import {
  BadRequestException,
  Controller,
  Get,
  Header,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
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
import { FeatureCollection } from "geojson";
import { GeometryCollection } from "topojson-specification";

import { MakeDistrictsErrors } from "../../../../shared/constants";
import { GeoUnitHierarchy, ProjectId, PublicUserProperties } from "../../../../shared/entities";
import { GeoUnitTopology } from "../../districts/entities/geo-unit-topology.entity";
import { TopologyService } from "../../districts/services/topology.service";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { User } from "../../users/entities/user.entity";
import { CreateProjectDto } from "../entities/create-project.dto";
import { Project } from "../entities/project.entity";
import { ProjectsService } from "../services/projects.service";
import { RegionConfigsService } from "../../region-configs/services/region-configs.service";
import { UpdateProjectDto } from "../entities/update-project.dto";
import { Errors } from "../../../../shared/types";

@Crud({
  model: {
    type: Project
  },
  params: {
    id: {
      type: "uuid",
      primary: true,
      field: "id"
    }
  },
  query: {
    join: {
      regionConfig: {
        eager: true
      },
      user: {
        allow: ["id", "name"] as PublicUserProperties[],
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
    // Filter to user's projects for all update requests and for full project
    // list. Unauthenticated access is allowed for individual projects
    if (req.method !== "GET" || req.url === "/api/projects") {
      const user = req.user as User;
      return {
        user_id: user ? user.id : undefined
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
    private readonly regionConfigService: RegionConfigsService
  ) {}

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
    const existingProject = await this.service.findOne({ id });
    if (dto.lockedDistricts && existingProject?.numberOfDistricts !== dto.lockedDistricts.length) {
      throw new BadRequestException({
        error: "Bad Request",
        message: { lockedDistricts: [`Length of array does not match "number_of_districts"`] }
      } as Errors<UpdateProjectDto>);
    }
    return this.service.updateOne(req, dto);
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

      return this.service.createOne(req, {
        ...dto,
        districtsDefinition: new Array(geoCollection.hierarchy.length).fill(0),
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
    const project = await this.base.getOneBase(req);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    return project;
  }

  // Helper for obtaining a topology for a given S3 URI, throws exception if not found
  async getGeoUnitTopology(s3URI: string): Promise<GeoUnitTopology> {
    const geoCollection = await this.topologyService.get(s3URI);
    if (!geoCollection) {
      throw new NotFoundException(
        `Topology ${s3URI} not found`,
        MakeDistrictsErrors.TOPOLOGY_NOT_FOUND
      );
    }
    return geoCollection;
  }

  @UseInterceptors(CrudRequestInterceptor)
  @Get(":id/export/geojson")
  async exportGeoJSON(
    @ParsedRequest() req: CrudRequest,
    @Param("id") projectId: ProjectId
  ): Promise<FeatureCollection> {
    const project = await this.getProject(req, projectId);
    const geoCollection = await this.getGeoUnitTopology(project.regionConfig.s3URI);
    const geojson = geoCollection.merge(
      { districts: project.districtsDefinition },
      project.numberOfDistricts
    );
    if (geojson === null) {
      this.logger.error(`Invalid districts definition for project ${projectId}`);
      throw new BadRequestException(
        "District definition is invalid",
        MakeDistrictsErrors.INVALID_DEFINITION
      );
    }
    return geojson;
  }

  @UseInterceptors(CrudRequestInterceptor)
  @Get(":id/export/csv")
  @Header("Content-Type", "text/csv")
  async exportCsv(
    @ParsedRequest() req: CrudRequest,
    @Param("id") projectId: ProjectId
  ): Promise<string> {
    const project = await this.getProject(req, projectId);
    const geoCollection = await this.getGeoUnitTopology(project.regionConfig.s3URI);
    const baseGeoLevel = geoCollection.definition.groups.slice().reverse()[0];
    const baseGeoUnitLayer = geoCollection.topology.objects[baseGeoLevel] as GeometryCollection;

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
          const props: any = baseGeoUnitLayer.geometries[hierarchyNumOrArray].properties;
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
    accumulateCsvRows(project.districtsDefinition, geoCollection.getGeoUnitHierarchy());

    return stringify(mutableCsvRows, {
      // Unsure if this CSV file should have headers. Switch the following to true if it should.
      header: false,
      columns: ["geoId", "districtId"]
    });
  }
}
