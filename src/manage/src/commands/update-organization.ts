import { Command } from "@oclif/command";
import { IArg } from "@oclif/parser/lib/args";
import { readFileSync } from "fs";
import yaml from "js-yaml";
import { createConnection } from "typeorm";

import { Organization } from "../../../server/src/organizations/entities/organization.entity";
import { ProjectTemplate } from "../../../server/src/project-templates/entities/project-template.entity";
import { connectionOptions } from "../lib/dbUtils";

interface TemplateConfig {
  readonly id: string;
  readonly name: string;
  readonly regionConfig: string;
  readonly numberOfDistricts: string;
  readonly description?: string;
  readonly details?: string;
}

interface OrganizationConfig {
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly logoUrl?: string;
  readonly linkUrl?: string;
  readonly municipality?: string;
  readonly region?: string;
  readonly projectTemplates?: readonly TemplateConfig[];
}

export default class UpdateOrganization extends Command {
  static description = "update or create organization information from a YAML configuration";

  static args: IArg[] = [
    {
      name: "config",
      description: "Path to YAML configuration file with organization details",
      required: true
    }
  ];

  async run(): Promise<void> {
    const { args } = this.parse(UpdateOrganization);

    const config = yaml.load(readFileSync(args.config, "utf8"));

    if (!config || typeof config !== "object" || !("name" in config) || !("slug" in config)) {
      this.log(`Invalid organization configuration '${args.config}'`);
      return;
    }

    const organizationDetails = config as OrganizationConfig;

    this.log("Saving organization to database");

    const connection = await createConnection(connectionOptions);
    const orgRepo = connection.getRepository(Organization);
    const templateRepo = connection.getRepository(ProjectTemplate);

    /* tslint:disable:no-object-mutation */
    const result = await orgRepo.findOne({ slug: organizationDetails.slug });
    const organization = result || new Organization();
    organization.slug = organizationDetails.slug;
    organization.name = organizationDetails.name;
    organization.description = organizationDetails.description || "";
    organization.logoUrl = organizationDetails.logoUrl || "";
    organization.linkUrl = organizationDetails.linkUrl || "";
    organization.municipality = organizationDetails.municipality || "";
    organization.region = organizationDetails.region || "";
    // @ts-ignore
    await orgRepo.save(organization);

    for (const config of organizationDetails.projectTemplates || []) {
      const id = config.id;
      const result = await templateRepo.findOne({ id });
      const template = result || new ProjectTemplate();
      template.organization = organization;
      template.id = id;
      template.name = config.name;
      // @ts-ignore
      template.regionConfig = { id: config.regionConfig };
      template.numberOfDistricts = Number(config.numberOfDistricts);
      template.description = config.description || "";
      template.details = config.details || "";
      // @ts-ignore
      await templateRepo.save(template);
    }
    /* tslint:enable */

    this.log("Organization saved to database");
  }
}
