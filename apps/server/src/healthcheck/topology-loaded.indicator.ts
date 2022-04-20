import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";

import { TopologyService } from "../districts/services/topology.service";

type Status = "pending" | "loading" | "loaded";

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
      Object.entries(layers).map(([layerId, layer]) => {
        return new Promise(resolve => {
          // Promise.race should return the first already resolved promise
          // immediately when provided at least one, so this shouldn't block
          void Promise.race([layer, Promise.resolve(undefined)]).then(topology => {
            resolve([
              layerId,
              layer === null ? "pending" : topology === undefined ? "loading" : "loaded"
            ]);
          });
        });
      })
    )) as [string, Status][];

    const isHealthy = layerEntries.every(([_, status]) => status === "loaded");
    const pending = layerEntries
      .filter(([_, status]) => status === "pending")
      .map(([layer, _]) => layer);
    const loading = layerEntries
      .filter(([_, status]) => status === "loading")
      .map(([layer, _]) => layer);
    const result = this.getStatus(key, isHealthy, {
      total: layerEntries.length,
      complete: layerEntries.length - pending.length - loading.length,
      pending,
      loading
    });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError("Topology not fully loaded", result);
  }
}
