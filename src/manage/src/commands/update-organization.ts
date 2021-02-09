import { Command } from "@oclif/command";
import { IArg } from "@oclif/parser/lib/args";
import { readFileSync } from "fs";
import yaml from "js-yaml";
import { createConnection } from "typeorm";

import { Organization } from "../../../server/src/organizations/entities/organization.entity";
import { connectionOptions } from "../lib/dbUtils";

interface OrganizationConfig {
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly logoUrl?: string;
  readonly linkUrl?: string;
  readonly municipality?: string;
  readonly region?: string;
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
    const repo = connection.getRepository(Organization);

    /* tslint:disable:no-object-mutation */
    const result = await repo.findOne({ slug: organizationDetails.slug });
    const organization = result || new Organization();
    organization.slug = organizationDetails.slug;
    organization.name = organizationDetails.name;
    organization.description = organizationDetails.description || "";
    organization.logoUrl = organizationDetails.logoUrl || "";
    organization.linkUrl = organizationDetails.linkUrl || "";
    organization.municipality = organizationDetails.municipality || "";
    organization.region = organizationDetails.region || "";
    /* tslint:enable */
    await repo.save(organization);
    this.log("Organization saved to database");
  }
}
