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
  GetManyDefaultResponse,
  Override,
  ParsedBody,
  ParsedRequest
} from "@nestjsx/crud";
import stringify from "csv-stringify/lib/sync";
import { Response } from "express";
import { convert } from "geojson2shp";
import * as _ from "lodash";
import isUUID from "validator/lib/isUUID";

import { MakeDistrictsErrors } from "../../../../shared/constants";
import {
  DistrictsDefinition,
  GeoUnitHierarchy,
  ProjectId,
  PublicUserProperties
} from "../../../../shared/entities";
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
    // This is a pretty heavy column, and is exposed by the export/geojson endpoint separately
    exclude: ["districts"],
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
    private readonly regionConfigService: RegionConfigsService
  ) {}

  // Overriden to add OptionalJwtAuthGuard, and possibly return a read-only view
  @Override()
  @UseGuards(OptionalJwtAuthGuard)
  async getOne(@Param("id") id: ProjectId, @ParsedRequest() req: CrudRequest): Promise<Project> {
    return this.getProject(req, id);
  }

  // Overriden to add JwtAuthGuard
  @Override()
  @UseGuards(JwtAuthGuard)
  getMany(@ParsedRequest() req: CrudRequest): Promise<GetManyDefaultResponse<Project> | Project[]> {
    if (!this.base.getManyBase) {
      this.logger.error("Routes misconfigured. Missing `getManyBase` route");
      throw new InternalServerErrorException();
    }
    return this.base.getManyBase(req);
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

      // Districts definition is optional. Use it if supplied, otherwise use all-unassigned.
      const districtsDefinition =
        dto.districtsDefinition || new Array(geoCollection.hierarchy.length).fill(0);
      const lockedDistricts = new Array(dto.numberOfDistricts).fill(false);
      const districts = await this.getGeojson({
        numberOfDistricts: dto.numberOfDistricts,
        districtsDefinition,
        regionConfig
      });

      return this.service.createOne(req, {
        ...dto,
        districtsDefinition,
        districts,
        lockedDistricts,
        user: req.parsed.authPersist.userId
      });
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
    const geoCollection = await this.topologyService.get(s3URI);
    if (!geoCollection || !("topology" in geoCollection)) {
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
    const geoCollection = await this.topologyService.get(project.regionConfig.s3URI);
    if (!geoCollection) {
      throw new NotFoundException(
        `Topology ${project.regionConfig.s3URI} not found`,
        MakeDistrictsErrors.TOPOLOGY_NOT_FOUND
      );
    }
    const baseGeoLevel = geoCollection.definition.groups.slice().reverse()[0];
    const baseGeoUnitProperties = geoCollection.topologyProperties[baseGeoLevel];

    // First column is the base geounit id, second column is the district id
    const mutableCsvRows: [number, number][] = [];

    // The geounit hierarchy and district definition have the same structure (except the
    // hierarchy always goes out to the base geounit level). Walk them both at the same time
    // and collect the information needed for the CSV (base geounit id and district id).
    const accumulateCsvRows = (
      defnSubset: number | GeoUnitHierarchy,
      hierarchySubset: GeoUnitHierarchy
    ) => {
      hierarchySubset.forEach((hierarchyNumOrArray, idx) => {
        const districtOrArray = typeof defnSubset === "number" ? defnSubset : defnSubset[idx];
        if (typeof districtOrArray === "number" && typeof hierarchyNumOrArray === "number") {
          // The numbers found in the hierarchy are the base geounit indices of the topology.
          // Access this item in the topology to find it's base geounit id.
          const props: any = baseGeoUnitProperties[hierarchyNumOrArray];
          mutableCsvRows.push([props[baseGeoLevel], districtOrArray]);
        } else if (typeof hierarchyNumOrArray !== "number") {
          // Keep recursing into the hierarchy until we reach the end
          accumulateCsvRows(districtOrArray, hierarchyNumOrArray);
        } else {
          // This shouldn't ever happen, and would suggest a district definition/hierarchy mismatch
          this.logger.error(
            "Hierarchy and districts definition mismatch",
            districtOrArray.toString(),
            hierarchyNumOrArray.toString()
          );
          throw new InternalServerErrorException();
        }
      });
    };
    accumulateCsvRows(project.districtsDefinition, geoCollection.hierarchyDefinition);

    return stringify(mutableCsvRows, {
      header: true,
      columns: [`${baseGeoLevel.toUpperCase()}ID`, "DISTRICT"]
    });
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
    if (project.projectTemplate) {
      const orgId = project.projectTemplate.organization.id;
      if (orgId) {
        const userId = req.parsed.authPersist.userId || null;
        const org = await this.organizationService.findOne({ id: orgId }, { relations: ["admin"] });
        const user = await this.usersService.findOne({ id: userId });
        if (user && org) {
          if (org.admin) {
            if (org.admin && org.admin.id === userId) {
              // eslint-disable-next-line
              project.isFeatured = projectFeatured.isFeatured;
              await this.service.save(project);
            } else {
              throw new NotFoundException(
                `User does not have admin privileges for organization: ${orgId}`
              );
            }
          } else {
            throw new NotFoundException(`Organization ${orgId} does not have an admin`);
          }
        } else {
          throw new NotFoundException(`Unable to find user: ${userId}`);
        }
      } else {
        throw new NotFoundException(`Project is not connected to an organization`);
      }
    } else {
      throw new NotFoundException(`Project is not connected to an organization's template`);
    }
    return project;
  }

  @UseInterceptors(CrudRequestInterceptor)
  @UseGuards(JwtAuthGuard)
  @Post(":id/planScore")
  async sendToPlanScoreAPI(
    @ParsedRequest() req: CrudRequest,
    @Param("id") projectId: ProjectId
  ): Promise<Project> {
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
