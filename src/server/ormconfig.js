const process = require("process");

module.exports = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  logging: process.env.NODE_ENV === "Development",
  synchronize: false,
  entities: ["dist/**/*.entity.js"],
  subscribers: ["dist/server/subscriber/*.js"],
  migrations: ["dist/server/migrations/*.js"],
  cli: {
    entitiesDir: "src",
    migrationsDir: "migrations",
    subscribersDir: "subscriber"
  }
};
