import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";

import { TopologyService } from "../districts/services/topology.service";

@Injectable()
export default class TopologyLoadedIndicator extends HealthIndicator {
  constructor(public topologyService: TopologyService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const layers = this.topologyService.layers();
    const layerEntries = (await Promise.all(
      Object.entries(layers).map(([layerId, topology]) => {
        return new Promise((resolve, reject) => {
          // Promise.race should return the first already resolved promise
          // immediately when provided at least one, so this shouldn't block
          void Promise.race([topology, Promise.resolve(undefined)]).then(topology => {
            resolve([layerId, topology !== undefined]);
          });
        });
      })
    )) as [string, boolean][];
    const layerStatus = Object.fromEntries(layerEntries);
    const isHealthy = Object.values(layerStatus).every(status => status);
    const result = this.getStatus(key, isHealthy, layerStatus);

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError("Topology not fully loaded", result);
  }
}
