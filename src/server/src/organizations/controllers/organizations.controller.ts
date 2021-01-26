import { Controller, UseGuards } from "@nestjs/common";
import { Crud, CrudAuth, CrudController } from "@nestjsx/crud";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Organization } from "../entities/organization.entity";
import { OrganizationsService } from "../services/organizations.service";

@Crud({
  model: {
    type: Organization
  },
  routes: {
    only: ["getOneBase"]
  },
  params: {
    slug: {
      field: "slug",
      type: "string",
      primary: true
    }
  }
})
@Controller("api/organization")
export class OrganizationsController implements CrudController<Organization> {
  constructor(public service: OrganizationsService) {}
}
