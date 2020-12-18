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
    if (layers === undefined) {
      const result = this.getStatus(key, false, {});
      throw new HealthCheckError("Topology layers not intialized", result);
    }

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

    const isHealthy = layerEntries.every(([_, status]) => status);
    const pendingLayers = layerEntries.filter(([_, status]) => !status).map(([layer, _]) => layer);
    const result = this.getStatus(key, isHealthy, {
      total: layerEntries.length,
      complete: layerEntries.length - pendingLayers.length,
      pendingLayers
    });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError("Topology not fully loaded", result);
  }
}
