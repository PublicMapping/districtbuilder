import { Controller, UseGuards } from "@nestjs/common";
import { Crud, CrudController } from "@nestjsx/crud";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RegionConfig } from "../entities/region-config.entity";
import { RegionConfigsService } from "../services/region-configs.service";

@Crud({
  model: {
    type: RegionConfig
  },
  routes: {
    only: ["createOneBase", "getManyBase"]
  }
})
@UseGuards(JwtAuthGuard)
@Controller("api/region-configs")
export class RegionConfigsController implements CrudController<RegionConfig> {
  constructor(public service: RegionConfigsService) {}
}
