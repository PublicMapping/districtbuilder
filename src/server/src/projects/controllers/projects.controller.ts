import { Controller, UseGuards } from "@nestjs/common";
import { Crud, CrudController } from "@nestjsx/crud";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Project } from "../entities/project.entity";
import { ProjectsService } from "../services/projects.service";

@Crud({
  model: {
    type: Project
  },
  routes: {
    only: ["getManyBase", "createOneBase"]
  },
  params: {
    id: {
      type: "uuid",
      primary: true,
      disabled: true
    }
  }
})
@UseGuards(JwtAuthGuard)
@Controller("api/projects")
export class ProjectsController implements CrudController<Project> {
  constructor(public service: ProjectsService) {}
}
