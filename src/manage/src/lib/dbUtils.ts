import { ConnectionOptions } from "typeorm";
import { RegionConfig } from "../../../server/src/region-configs/entities/region-config.entity";

export const connectionOptions: ConnectionOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [RegionConfig],
  logging: true,
  synchronize: false
};
