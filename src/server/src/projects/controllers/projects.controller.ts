import {
  BadRequestException,
  Controller,
  Get,
  Header,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  // Not sure why, but eslint thinks these decorators are unused
  /* eslint-disable */
  ParseIntPipe,
  Query,
  /* eslint-enable */
  Body,
  Request,
  Res,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import {
  Crud,
  CrudAuth,
  CrudController,
  CrudRequest,
  CrudRequestInterceptor,
  Override,
  ParsedBody,
  ParsedRequest
} from "@nestjsx/crud";
import stringify from "csv-stringify/lib/sync";
import { Response } from "express";
import { convert } from "geojson2shp";
import * as _ from "lodash";
import isUUID from "validator/lib/isUUID";
import { Pagination } from "nestjs-typeorm-paginate";

import { MakeDistrictsErrors, ConvertProjectErrors } from "../../../../shared/constants";
import { DistrictsDefinition, ProjectId, PublicUserProperties } from "../../../../shared/entities";
import { ProjectVisibility } from "../../../../shared/constants";
import { GeoUnitTopology } from "../../districts/entities/geo-unit-topology.entity";
import { TopologyService } from "../../districts/services/topology.service";

import { JwtAuthGuard, OptionalJwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { User } from "../../users/entities/user.entity";
import { CreateProjectDto } from "../entities/create-project.dto";
import { DistrictsGeoJSON, Project } from "../entities/project.entity";
import { ProjectsService } from "../services/projects.service";
import { OrganizationsService } from "../../organizations/services/organizations.service";

import { RegionConfigsService } from "../../region-configs/services/region-configs.service";
import { UsersService } from "../../users/services/users.service";
import { UpdateProjectDto } from "../entities/update-project.dto";
import { Errors } from "../../../../shared/types";
import axios from "axios";
import { CrosswalkService } from "../services/crosswalk.service";
import { GeoUnitProperties } from "../../districts/entities/geo-unit-properties.entity";

@Crud({
  model: {
    type: Project
  },
  params: {
    id: {
      type: "string",
      primary: true,
      field: "id"
    }
  },
  query: {
    join: {
      projectTemplate: {
        exclude: ["districtsDefinition"],
        eager: true
      },
      "projectTemplate.organization": {
        eager: true
      },
      "projectTemplate.organization.admin": {
        alias: "org_admin",
        eager: false
      },
      "projectTemplate.regionConfig": {
        alias: "template_region_config",
        eager: true
      },
      regionConfig: {
        eager: true
      },
      user: {
        allow: ["id", "name"] as PublicUserProperties[],
        alias: "project_user",
        required: true,
        eager: true
      }
    }
  },
  routes: {
    only: ["createOneBase", "getManyBase", "getOneBase", "updateOneBase"]
  },
  dto: {
    update: UpdateProjectDto
  }
})
@CrudAuth({
  filter: (req: any) => {
    const user = req.user as User;
    // Restrict access to organization projects if using toggleFeatured endpoint
    if (req.route.path.split("/").reverse()[0] === "toggleFeatured") {
      return {
        "projectTemplate.organization.admin": user.id
      };
      // Filter to user's projects for all other update requests and for full project
      // list.
    } else if (req.method !== "GET" || req.route.path === "/api/projects") {
      return {
        user_id: user ? user.id : undefined
      };
    } else {
      // Unauthenticated access is allowed for individual projects if they are
      // visible or published, and not archived.
      const publicallyVisible = [
        { visibility: ProjectVisibility.Published },
        { visibility: ProjectVisibility.Visible }
      ];
      const visibleFilter = user
        ? [
            // User created project
            { user_id: user.id },
            // Or it's public
            ...publicallyVisible
          ]
        : publicallyVisible;
      return {
        $and: [
          {
            $or: visibleFilter
          },
          { archived: false }
        ]
      };
    }
  },
  persist: (req: any) => {
    const user = req.user as User;
    return {
      userId: user ? user.id : undefined
    };
  }
})
@Controller("api/projects")
// @ts-ignore
export class ProjectsController implements CrudController<Project> {
  get base(): CrudController<Project> {
    return this;
  }
  private readonly logger = new Logger(ProjectsController.name);
  constructor(
    public service: ProjectsService,
    public topologyService: TopologyService,
    private readonly usersService: UsersService,
    private readonly organizationService: OrganizationsService,
    private readonly regionConfigService: RegionConfigsService,
    private readonly crosswalkService: CrosswalkService
  ) {}

  // Overriden to add OptionalJwtAuthGuard, and possibly return a read-only view
  @Override()
  @UseGuards(OptionalJwtAuthGuard)
  async getOne(@Param("id") id: ProjectId, @ParsedRequest() req: CrudRequest): Promise<Project> {
    return this.getProject(req, id);
  }

  // Overriden to add JwtAuthGuard and support pagination
  @Override()
  @UseGuards(JwtAuthGuard)
  getMany(
    @ParsedRequest() req: CrudRequest,
    @Query("page", ParseIntPipe) page = 1,
    @Query("limit", ParseIntPipe) limit = 10
  ): Promise<Pagination<Project>> {
    const user_id = req.parsed.authPersist.userId;
    return this.service.findAllUserProjectsPaginated(user_id, { page, limit });
  }

  @Override()
  @UseGuards(JwtAuthGuard)
  async updateOne(
    @Param("id") id: ProjectId,
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: UpdateProjectDto
  ) {
    // @ts-ignore
    const existingProject = await this.service.findOne({ id }, { relations: ["regionConfig"] });
    if (dto.lockedDistricts && existingProject?.numberOfDistricts !== dto.lockedDistricts.length) {
      throw new BadRequestException({
        error: "Bad Request",
        message: { lockedDistricts: [`Length of array does not match "number_of_districts"`] }
      } as Errors<UpdateProjectDto>);
    }

    // Update districts GeoJSON if the definition has changed or there is no cached value yet
    const dataWithDefinitions =
      existingProject &&
      dto.districtsDefinition &&
      (!existingProject.districts ||
        !_.isEqual(dto.districtsDefinition, existingProject.districtsDefinition))
        ? {
            ...dto,
            districts: await this.getGeojson({
              regionConfig: existingProject.regionConfig,
              numberOfDistricts: existingProject.numberOfDistricts,
              districtsDefinition: dto.districtsDefinition
            })
          }
        : dto;

    // Only change updatedDt field when whitelisted fields have changed
    const whitelistedFields: ReadonlyArray<keyof UpdateProjectDto> = [
      "districtsDefinition",
      "name"
    ];
    const fields = whitelistedFields.filter(field => field in dto);
    const data = _.isEqual(_.pick(dataWithDefinitions, fields), _.pick(existingProject, fields))
      ? { ...dataWithDefinitions }
      : { ...dataWithDefinitions, updatedDt: new Date() };

    return this.service.updateOne(req, {
      ...data,
      isFeatured: dto.visibility === ProjectVisibility.Private ? false : existingProject?.isFeatured
    });
  }

  @Override()
  @UseGuards(JwtAuthGuard)
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: CreateProjectDto
  ): Promise<Project> {
    try {
      const regionConfig = await this.regionConfigService.findOne({ id: dto.regionConfig.id });
      if (!regionConfig) {
        throw new NotFoundException(`Unable to find region config: ${dto.regionConfig.id}`);
      }

      const geoCollection = await this.topologyService.get(regionConfig.s3URI);
      if (!geoCollection) {
        throw new NotFoundException(
          `Topology ${regionConfig.s3URI} not found`,
          MakeDistrictsErrors.TOPOLOGY_NOT_FOUND
        );
      }

      return await this.service.createOne(
        req,
        await this.formatCreateProjectDto(dto, geoCollection, regionConfig, req)
      );
    } catch (error) {
      this.logger.error(`Error creating project: ${error}`);
      throw new InternalServerErrorException();
    }
  }

  private async formatCreateProjectDto(
    dto: CreateProjectDto,
    geoCollection: GeoUnitTopology | GeoUnitProperties,
    regionConfig: RegionConfig,
    req: CrudRequest
  ) {
    // Districts definition is optional. Use it if supplied, otherwise use all-unassigned.
    const districtsDefinition =
      dto.districtsDefinition || new Array(geoCollection.hierarchy.length).fill(0);
    const lockedDistricts = new Array(dto.numberOfDistricts).fill(false);
    const districts = await this.getGeojson({
      numberOfDistricts: dto.numberOfDistricts,
      districtsDefinition,
      regionConfig
    });
    return {
      ...dto,
      districtsDefinition,
      districts,
      lockedDistricts,
      user: req.parsed.authPersist.userId
    };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CrudRequestInterceptor)
  @Post(":id/duplicate")
  async duplicate(@ParsedRequest() req: CrudRequest, @Param("id") id: ProjectId): Promise<Project> {
    try {
      const project = await this.getProject(req, id);
      const geoCollection = await this.topologyService.get(project.regionConfig.s3URI);
      if (!geoCollection) {
        throw new NotFoundException(
          `Topology ${project.regionConfig.s3URI} not found`,
          MakeDistrictsErrors.TOPOLOGY_NOT_FOUND
        );
      }
      // Set any fields we don't want duplicated to be undefined
      const dto = {
        ...project,
        name: `Copy of ${project.name}`,
        id: undefined,
        user: undefined,
        createdDt: undefined,
        updatedDt: undefined,
        isFeatured: undefined
      };

      return await this.service.save(
        await this.formatCreateProjectDto(dto, geoCollection, project.regionConfig, req)
      );
    } catch (error) {
      this.logger.error(`Error creating project: ${error}`);
      throw new InternalServerErrorException();
    }
  }

  // Helper for obtaining a project for a given project request, throws exception if not found
  async getProject(req: CrudRequest, projectId: ProjectId): Promise<Project> {
    if (!this.base.getOneBase) {
      this.logger.error("Routes misconfigured. Missing `getOneBase` route");
      throw new InternalServerErrorException();
    }
    if (!isUUID(projectId)) {
      throw new NotFoundException(`Project ${projectId} is not a valid UUID`);
    }
    const project = await this.base.getOneBase(req).then(project => {
      return project.user.id === req.parsed.authPersist.userId
        ? project
        : project.getReadOnlyView();
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    return project;
  }

  // Helper for obtaining a topology for a given S3 URI, throws exception if not found
  async getGeoUnitTopology(s3URI: string): Promise<GeoUnitTopology> {
    const geoCollection = await this.getGeoUnitProperties(s3URI);
    if (!("topology" in geoCollection)) {
      throw new NotFoundException(
        `Topology ${s3URI} is archived`,
        MakeDistrictsErrors.TOPOLOGY_NOT_FOUND
      );
    }
    return geoCollection;
  }

  // Helper for obtaining a topology or props for a given S3 URI, throws exception if not found
  async getGeoUnitProperties(s3URI: string): Promise<GeoUnitTopology | GeoUnitProperties> {
    const geoCollection = await this.topologyService.get(s3URI);
    if (!geoCollection) {
      throw new NotFoundException(
        `Topology ${s3URI} not found`,
        MakeDistrictsErrors.TOPOLOGY_NOT_FOUND
      );
    }
    return geoCollection;
  }

  async getGeojson({
    districtsDefinition,
    numberOfDistricts,
    regionConfig
  }: {
    readonly districtsDefinition: DistrictsDefinition;
    readonly numberOfDistricts: number;
    readonly regionConfig: RegionConfig;
  }): Promise<DistrictsGeoJSON> {
    const geoCollection = await this.getGeoUnitTopology(regionConfig.s3URI);
    const geojson = geoCollection.merge({ districts: districtsDefinition }, numberOfDistricts);
    if (geojson === null) {
      this.logger.error(`Invalid districts definition for project`);
      throw new BadRequestException(
        "District definition is invalid",
        MakeDistrictsErrors.INVALID_DEFINITION
      );
    }
    return geojson;
  }

  @UseInterceptors(CrudRequestInterceptor)
  @UseGuards(OptionalJwtAuthGuard)
  @Get(":id/export/geojson")
  async exportGeoJSON(@Request() req: any, @Param("id") id: ProjectId): Promise<DistrictsGeoJSON> {
    const user = req.user as User;
    // Not using 'getProject' because we need to select the 'districts' column
    // Unauthenticated access is allowed for individual projects if they are
    // visible or published, and not archived.
    const commonFilter = { id, archived: false };
    const project = await this.service.findOne({
      where: [
        { ...commonFilter, user: { id: user.id } },
        { ...commonFilter, visibility: ProjectVisibility.Published },
        { ...commonFilter, visibility: ProjectVisibility.Visible }
      ],
      loadEagerRelations: false,
      relations: ["regionConfig"]
    });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    // If the region is archived we can't calculate districts
    if (project.regionConfig.archived && !project.districts) {
      throw new BadRequestException(
        "Saved district is not available and cannot be calculated",
        MakeDistrictsErrors.INVALID_DEFINITION
      );
    }

    return project.districts;
  }

  @UseInterceptors(CrudRequestInterceptor)
  @UseGuards(OptionalJwtAuthGuard)
  @Get(":id/export/shp")
  async exportShapefile(
    @Request() req: any,
    @Param("id") projectId: ProjectId,
    @Res() response: Response
  ): Promise<void> {
    const geojson = await this.exportGeoJSON(req, projectId);
    const formattedGeojson = {
      ...geojson,
      features: geojson.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          // Flatten nested demographics & voting objects so they are maintained when converting
          demographics: undefined,
          voting: undefined,
          ...feature.properties.demographics,
          ...feature.properties.voting,
          // The feature ID doesn't seem to make its way over as part of 'convert' natively
          id: feature.id
        }
      }))
    };
    await convert(formattedGeojson, response, { layer: "districts" });
  }

  @UseInterceptors(CrudRequestInterceptor)
  @UseGuards(OptionalJwtAuthGuard)
  @Get(":id/export/csv")
  @Header("Content-Type", "text/csv")
  async exportCsv(
    @ParsedRequest() req: CrudRequest,
    @Param("id") projectId: ProjectId
  ): Promise<string> {
    const project = await this.getProject(req, projectId);
    const geoCollection = await this.getGeoUnitProperties(project.regionConfig.s3URI);
    const baseGeoLevel = geoCollection.definition.groups.slice().reverse()[0];
    const csvRows = project.exportToCsv(geoCollection);

    return stringify(csvRows, {
      header: true,
      columns: [`${baseGeoLevel.toUpperCase()}ID`, "DISTRICT"]
    });
  }

  // Creates a copy of a project in an archived 2010-census region,
  // with it's districts converted to use a new 2020-census region
  @UseInterceptors(CrudRequestInterceptor)
  @UseGuards(JwtAuthGuard)
  @Post(":id/convert-and-copy")
  async convertAndCopy(
    @ParsedRequest() req: CrudRequest,
    @Param("id") projectId: ProjectId
  ): Promise<Project> {
    const project = await this.getProject(req, projectId);
    const regionCode = project.regionConfig.regionCode;
    if (!project.regionConfig.archived) {
      throw new BadRequestException(
        "The project region must be archived to convert it",
        ConvertProjectErrors.REGION_NOT_ARCHIVED
      );
    }
    const newRegion = await this.regionConfigService.findOne({
      where: { archived: false, regionCode }
    });
    if (newRegion === undefined || newRegion.archived) {
      throw new BadRequestException(
        `There is not an unarchived region for ${regionCode}`,
        ConvertProjectErrors.NO_ACTIVE_REGION
      );
    }
    const crosswalk = await this.crosswalkService.getCrosswalk(regionCode);
    if (crosswalk === undefined) {
      throw new BadRequestException(
        `There is not an unarchived region for ${regionCode}`,
        ConvertProjectErrors.NO_ACTIVE_REGION
      );
    }

    const archivedTopoProperties = await this.getGeoUnitProperties(project.regionConfig.s3URI);
    const newGeoUnitTopology = await this.getGeoUnitTopology(newRegion.s3URI);

    const oldBlockToDistricts = Object.fromEntries(project.exportToCsv(archivedTopoProperties));

    // CSV export contains every block<->district pair
    // Crosswalk maps new block -> old in many<->many fashion, specifying percent of old block in new block
    // Sum district share for each new block and assign block to the district w/ largest share

    // Written in non-functional style for higher perf.
    const blockSums: { [blockId: string]: { readonly [districtId: number]: number } } = {};
    // eslint-disable-next-line functional/no-loop-statement
    for (const [newFips, oldBlocks] of Object.entries(crosswalk)) {
      // eslint-disable-next-line functional/no-loop-statement
      for (const { fips, amount } of oldBlocks) {
        const districtId = oldBlockToDistricts[fips];
        const districtSums = blockSums[newFips] || {};
        const sum = (districtSums[districtId] || 0) + amount;
        // eslint-disable-next-line functional/immutable-data
        blockSums[newFips] = { ...districtSums, [districtId]: sum };
      }
    }

    const blockToDistricts = _.mapValues(blockSums, districtSums => {
      const [largestDistrict] = _.maxBy(Object.entries(districtSums), ([, sum]) => sum) || [0, 0];
      return Number(largestDistrict);
    });

    const districtsDefinition = newGeoUnitTopology.importFromCSV(blockToDistricts);

    const districts = await this.getGeojson({
      numberOfDistricts: project.numberOfDistricts,
      regionConfig: newRegion,
      districtsDefinition
    });

    try {
      return this.service.save({
        name: `${project.name} (2020)`,
        regionConfig: newRegion,
        chamber: project.chamber,
        projectTemplate: project.projectTemplate,
        numberOfDistricts: project.numberOfDistricts,
        user: req.parsed.authPersist.userId,
        visibility: project.visibility,
        lockedDistricts: project.lockedDistricts,
        populationDeviation: project.populationDeviation,
        pinnedMetricFields: project.pinnedMetricFields,
        districtsDefinition,
        districts
      });
    } catch (error) {
      this.logger.error(`Error creating converted project: ${error}`);
      throw new InternalServerErrorException();
    }
  }

  @UseInterceptors(CrudRequestInterceptor)
  @UseGuards(JwtAuthGuard)
  @Post(":id/toggleFeatured")
  async setProjectAsFeatured(
    @ParsedRequest() req: CrudRequest,
    @Param("id") projectId: ProjectId,
    @Body() projectFeatured: { isFeatured: boolean }
  ): Promise<Project> {
    const project = await this.getProject(req, projectId);
    if (!project.projectTemplate) {
      throw new NotFoundException(`Project is not connected to an organization's template`);
    }
    const orgId = project.projectTemplate.organization.id;
    if (!orgId) {
      throw new NotFoundException(`Project is not connected to an organization`);
    }
    const userId = req.parsed.authPersist.userId || null;
    const org = await this.organizationService.findOne({ id: orgId }, { relations: ["admin"] });
    const user = await this.usersService.findOne({ id: userId });
    if (!user || !org) {
      throw new NotFoundException(`Unable to find user: ${userId}`);
    }
    if (!org.admin) {
      throw new NotFoundException(`Organization ${orgId} does not have an admin`);
    }
    if (org.admin.id !== userId) {
      throw new NotFoundException(`User does not have admin privileges for organization: ${orgId}`);
    }

    // eslint-disable-next-line
    project.isFeatured = projectFeatured.isFeatured;
    await this.service.save(project);
    return project;
  }

  @UseInterceptors(CrudRequestInterceptor)
  @UseGuards(JwtAuthGuard)
  @Post(":id/planScore")
  async sendToPlanScoreAPI(@Param("id") projectId: ProjectId): Promise<Project> {
    const planScoreToken = process.env.PLAN_SCORE_API_TOKEN || "";
    const project = await this.service.findOne(projectId, { relations: ["regionConfig"] });
    const geojson = project && {
      ...project.districts,
      features: project.districts.features.filter(f => f.id !== 0)
    };
    return new Promise((resolve, reject) => {
      axios({
        method: "POST",
        data: project && Buffer.from(JSON.stringify(geojson)),
        url: "http://api.planscore.org/upload/",
        headers: {
          Authorization: `Bearer ${planScoreToken}`
        }
      })
        .then(response => {
          resolve(response.data);
        })
        .catch(error => {
          reject(error.message);
        });
    });
  }
}
