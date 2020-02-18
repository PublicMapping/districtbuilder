import { Controller, Get, HttpStatus, Param, Res } from "@nestjs/common";
import { Response } from "express";

import { TopologyService } from "../services/topology.service";

@Controller("districts")
export class DistrictsController {
  constructor(public topologyService: TopologyService) {}

  @Get("topology/:key")
  getTopology(@Res() res: Response, @Param("key") key: string): void {
    this.topologyService.get(key).then(topology => {
      if (topology != null) {
        res.status(HttpStatus.OK).json(topology);
      } else {
        res.status(HttpStatus.NOT_FOUND).json({ status: "not-found" });
      }
    });
  }
}
