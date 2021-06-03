import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Request,
  UseGuards,
  Header,
  UnauthorizedException,
  HostParam,
  InternalServerErrorException
} from "@nestjs/common";

import { OrganizationSlug, IStaticMetadata } from "../../../../shared/entities";

import { JwtAuthGuard, OptionalJwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Organization } from "../../organizations/entities/organization.entity";
import { OrganizationsService } from "../../organizations/services/organizations.service";

import { ProjectTemplate } from "../entities/project-template.entity";
import { ProjectTemplatesService } from "../services/project-templates.service";
import { TopologyService } from "../../districts/services/topology.service";
import { GeoUnitTopology } from "../../districts/entities/geo-unit-topology.entity";
import { getDemographicLabel } from "../../../../shared/functions";
import _ from "lodash";
import stringify from "csv-stringify/lib/sync";

function getIds(
  topoLayers: { [s3uri: string]: GeoUnitTopology },
  prop: "demographics" | "voting"
): readonly string[] {
  return [
    ...new Set(
      Object.values(topoLayers).flatMap(layer => {
        const data = layer && layer.staticMetadata[prop];
        return data ? data.map(file => file.id) : [];
      })
    )
  ];
}

@Controller("api/project_templates")
export class ProjectTemplatesController {
  constructor(
    private service: ProjectTemplatesService,
    private orgService: OrganizationsService,
    private topologyService: TopologyService
  ) {}

  async getOrg(organizationSlug: OrganizationSlug): Promise<Organization> {
    const org = await this.orgService.getOrgAndProjectTemplates(organizationSlug);
    if (!org) {
      throw new NotFoundException(`Organization ${organizationSlug} not found`);
    }
    return org;
  }

  async getOrgFeaturedProjects(organizationSlug: OrganizationSlug): Promise<ProjectTemplate[]> {
    const projects = await this.service.findOrgFeaturedProjects(organizationSlug);
    if (!projects) {
      throw new NotFoundException(`Organization ${organizationSlug} not found`);
    }
    return projects;
  }

  @UseGuards(JwtAuthGuard)
  @Get(":slug/")
  async getAllProjects(
    @Param("slug") organizationSlug: OrganizationSlug,
    @Request() req: any
  ): Promise<ProjectTemplate[]> {
    const userId = req.user.id;
    const org = await this.getOrg(organizationSlug);
    const userIsAdmin = org && org.admin.id === userId;
    if (userIsAdmin) {
      return this.service.findAdminOrgProjects(organizationSlug);
    } else {
      throw new BadRequestException(`User is not an admin for organization ${organizationSlug}`);
    }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get("featured/:slug")
  async getFeaturedProjects(
    @Param("slug") organizationSlug: OrganizationSlug
  ): Promise<ProjectTemplate[]> {
    return this.getOrgFeaturedProjects(organizationSlug);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":slug/export/maps-csv")
  @Header("Content-Type", "text/csv")
  async exportMapsCsv(
    @Param("slug") slug: OrganizationSlug,
    @Request() req: any,
    @HostParam("host") host: string
  ): Promise<string> {
    const org = await this.getOrg(slug);
    if (org.admin.id !== req.user.id) {
      throw new UnauthorizedException(
        `User does not have admin privileges for organization: ${org.id}`
      );
    }
    const projectRows = await this.service.findAdminOrgProjectsWithDistrictProperties(slug);
    const regionURIs = new Set(projectRows.map(row => row.regionS3URI));
    let topoLayers: { [s3uri: string]: GeoUnitTopology } = {};
    for (const [s3uri, layerPromise] of Object.entries(this.topologyService.layers() || {})) {
      const layer = await layerPromise;
      if (layer && regionURIs.has(s3uri)) {
        topoLayers[s3uri] = layer;
      }
    }

    const projectColumns = [
      "Map creator user-id",
      "Map creator full name",
      "Map creator email",
      "Map name",
      "URL",
      "Created date",
      "Last updated date",
      "Template name",
      "Region name",
      "Chamber name"
    ];
    const districtColumns = ["District number", "Contiguity", "Compactness"];
    const demographicsColumns = getIds(topoLayers, "demographics");
    const votingColumns = getIds(topoLayers, "voting");

    const rows = projectRows.flatMap(row =>
      row.districtProperties.map((districtProps, idx) => {
        const topo = topoLayers[row.regionS3URI];
        if (!topo) {
          throw new InternalServerErrorException();
        }

        return [
          row.userId,
          row.userName,
          row.userEmail,
          row.mapName,
          `${host || process.env.CLIENT_URL}/projects/${row.projectId}/`,
          row.createdDt,
          row.updatedDt,
          row.templateName,
          row.regionName,
          row?.chamberName || "",
          idx,
          districtProps.contiguity,
          districtProps.compactness
        ]
          .concat(demographicsColumns.map(id => districtProps.demographics[id] || ""))
          .concat(
            votingColumns.map(id => (districtProps.voting ? districtProps?.voting[id] || "" : ""))
          );
      })
    );
    return stringify(rows, {
      header: true,
      columns: projectColumns
        .concat(districtColumns)
        .concat(demographicsColumns.map(getDemographicLabel))
        .concat(votingColumns)
    });
  }
}
