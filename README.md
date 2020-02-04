# DistrictBuilder 2

DistrictBuilder 2 is web-based, open source software for collaborative redistricting.

## Requirements

* [Docker](https://www.docker.com/get-started)
* [`docker-compose`](https://docs.docker.com/compose/install/)

## Development

### Setup

1. Make sure you have `docker` and `docker-compose` installed (see links in [Requirements](#requirements))
1. Run `./scripts/setup`

Note that it is recommended to configure your editor to auto-format your code via Prettier on save.

## Stack

This app uses:
* [TypeScript](https://www.typescriptlang.org/) for type safety
* [React](https://reactjs.org/) as a declarative view layer
* [Redux](https://redux.js.org/) for state management
* [redux-loop](https://redux-loop.js.org/) for effect management (eg. API calls)
* [ts.data.json](https://github.com/joanllenas/ts.data.json) for JSON decoding
* [PostgreSQL](https://www.postgresql.org/) for a relational database
* [NestJS](https://nestjs.com/) for the backend web server
* [TypeORM](https://typeorm.io/) for database queries and migrations
* [TopoJSON](https://github.com/topojson/topojson) for fast, topologically-aware geospatial operations

## Ports

| Port                          | Service                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------ |
| [3003](http://localhost:3003) | [CRA](https://github.com/facebook/create-react-app)-based frontend application |
| [3005](http://localhost:3005) | [NestJS](https://nestjs.com/)-based backend application                        |

## Scripts

### Scripts to Rule Them All (STRTA)

| Name                 | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `dbshell`            | Open a `psql` shell connected to the database                |
| `migrate`            | Run database migrations                                      |
| `migration_generate` | Generate a new database migration                            |
| `server`             | Run application services                                     |
| `setup`              | Get set up for development                                   |
| `test`               | Check for lint and formatting and run tests (client + server)|
| `update`             | Update project dependencies and run migrations               |

### Project Organization

In order to allow for code-sharing across the frontend and backend in conjunction with an unejected `create-react-app`, it was decided that the simplest and least error-prone way forward was to structure the code as such:

```
.
├── package.json (Applies to the CRA frontend)
├── src
│   ├── client (Location for all CRA frontend code)
│   ├── index.tsx (This and another file need to be here for CRA-purposes)
│   ├── server (NestJS backend code)
│   │   ├── package.json (Applies to the NestJS backend)
│   └── shared (Code that is used by both the frontend and backend)
```

Note that there are two `package.json` files. Yarn commands can be run on the frontend in the root directory, and on the backend in the `src/server` directory.

### Development workflow

 * After remote code has been updated, run `scripts/update`
 * To start all services, run `scripts/server`
 * Both services will be auto-reloaded when relevant code changes
 * To run tests for both services, run `scripts/test`
 * To run formatting and linting, run `yarn format` and `yarn lint` in the appropriate directory
   * For client (and shared code), run in the root directory
   * For server, run in `src/server`

### Yarn commands (frontend)

### `yarn start`

Runs the CRA frontend in development mode.

Open [http://localhost:3003](http://localhost:3003) to view it in the browser.

### `yarn compile`

Compile TypeScript.

### `yarn watch`

Watch for TypeScript changes.

### `yarn fix`

Fix any auto-fixable issues.

### `yarn lint`

Run linter to check for any issues.

### `yarn format`

Automatically format all source files.

### `yarn check-format`

Ensure all files are properly formatted.

### `yarn test`

Launches the test runner in interactive watch mode.

### `yarn build`

Builds the app for production to the `build` folder.


### Yarn commands (backend -- run from `src/server`)

### `yarn start|start:dev|start:debug|start:prod`

Not intended to be used directly. Instead use `scripts/server`, which starts the development server with proper environment variables to allow connecting to the database container.

### `yarn compile`

Compile TypeScript.

### `yarn fix`

Fix any auto-fixable issues.

### `yarn lint`

Run linter to check for any issues.

### `yarn format`

Automatically format all source files.

### `yarn check-format`

Ensure all files are properly formatted.

### `yarn test`

Run unit tests.

### `yarn test:watch`

Launches the test runner in interactive watch mode.

### `yarn test:cov`

Run code coverage.

### `yarn test:e2e`

Run end-to-end tests.

### `yarn typeorm`

Run typeorm commands.

### `yarn migration:generate|migration:create|migration:run`

Not intended to be used directly. Instead use `scripts/migrate` and `scripts/migration_generate`, which runs these commands with proper environment variables to allow connecting to the database container.
