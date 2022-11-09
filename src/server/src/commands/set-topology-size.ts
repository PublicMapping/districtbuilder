import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import S3 from "aws-sdk/clients/s3";
import Queue from "promise-queue";

import { AppModule } from "../app.module";
import { DEBUG } from "../../../shared/constants";
import { formatBytes, getTopology, getTopologyLayerSize } from "../common/functions";
import { RegionConfigsModule } from "../region-configs/region-configs.module";
import { RegionConfigsService } from "../region-configs/services/region-configs.service";

async function bootstrap(): Promise<void> {
  const logger = new Logger();
  if (process.argv.includes("--help")) {
    logger.log("set-topology-size [-f | --force]");
    process.exit(0);
  }
  const app = await NestFactory.create(AppModule, {
    logger: DEBUG ? ["debug", "verbose", "log", "warn", "error"] : ["log", "warn", "error"]
  });

  const regionConfigsService = app
    .select(RegionConfigsModule)
    .get(RegionConfigsService, { strict: true });

  const s3 = new S3();
  const queue = new Queue(4);
  const findOpts =
    process.argv.includes("-f") || process.argv.includes("--force")
      ? {}
      : ({ layerSizeInBytes: 0 } as const);
  const regionConfigs = await regionConfigsService.find(findOpts);
  logger.log(`Found ${regionConfigs.length} regions`);
  await Promise.all(
    regionConfigs.map(regionConfig =>
      queue.add(async () => {
        const topology = await getTopology(regionConfig, s3);
        // eslint-disable-next-line functional/immutable-data
        regionConfig.layerSizeInBytes = getTopologyLayerSize(topology);
        // @ts-ignore
        await regionConfigsService.repo.save(regionConfig);
        logger.log(
          `Set ${regionConfig.s3URI} size to ${formatBytes(regionConfig.layerSizeInBytes)}`
        );
      })
    )
  );

  await app.close();
}
bootstrap(); // eslint-disable-line @typescript-eslint/no-floating-promises
