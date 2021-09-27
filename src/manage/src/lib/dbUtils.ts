import { ConnectionOptions } from "typeorm";
import { Chamber } from "../../../server/src/chambers/entities/chamber.entity";
import { Organization } from "../../../server/src/organizations/entities/organization.entity";
import { ProjectTemplate } from "../../../server/src/project-templates/entities/project-template.entity";
import { ReferenceLayer } from "../../../server/src/reference-layers/entities/reference-layer.entity";
import { RegionConfig } from "../../../server/src/region-configs/entities/region-config.entity";
import { User } from "../../../server/src/users/entities/user.entity";
import { Project } from "../../../server/src/projects/entities/project.entity";

export const connectionOptions: ConnectionOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [Chamber, Organization, ProjectTemplate, RegionConfig, ReferenceLayer, User, Project],
  logging: true,
  synchronize: false
};
