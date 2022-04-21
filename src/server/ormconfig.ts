import { TypeOrmModuleOptions } from "@nestjs/typeorm";

const config: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  logging: process.env.NODE_ENV === "Development",
  synchronize: false,
  autoLoadEntities: true,
  migrations: ["migrations/*.ts"],
  cli: {
    entitiesDir: "src",
    migrationsDir: "migrations",
    subscribersDir: "subscriber"
  }
};

export default config;
