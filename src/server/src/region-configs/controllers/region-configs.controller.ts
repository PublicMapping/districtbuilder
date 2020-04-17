import { Controller, UseGuards } from "@nestjs/common";
import { Crud, CrudAuth, CrudController } from "@nestjsx/crud";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RegionConfig } from "../entities/region-config.entity";
import { RegionConfigsService } from "../services/region-configs.service";

@Crud({
  model: {
    type: RegionConfig
  },
  routes: {
    only: ["createOneBase", "getManyBase"]
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
@Controller("api/region-configs")
export class RegionConfigsController implements CrudController<RegionConfig> {
  constructor(public service: RegionConfigsService) {}
}
