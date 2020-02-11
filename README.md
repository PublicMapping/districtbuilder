# DistrictBuilder 2

DistrictBuilder 2 is web-based, open source software for collaborative redistricting.

- [Requirements](#requirements)
- [Development](#development)
  - [Hot Reloading 🔥](#hot-reloading-)
  - [Project Organization](#project-organization)
  - [Stack](#stack)
  - [Ports](#ports)
- [Scripts](#scripts)

## Requirements

- [Docker Engine](https://docs.docker.com/install/) 17.12+
- [Docker Compose](https://docs.docker.com/compose/install/) 1.21+

## Development

Run `scripts/update` to prepare the development environment:

 ```bash
 $ ./scripts/update
 ```

 Next, run `scripts/server` to start the application:

  ```bash
 $ ./scripts/server
 ```

 *Note:* It is recommended to configure your editor to auto-format your code via Prettier on save.

### Hot Reloading 🔥

While `server` is running, the [Create React App](https://github.com/facebook/create-react-app/) frontend will automatically [reload](https://github.com/facebook/create-react-app/#whats-included) when changes are made. Additionally, the NestJS backend will [restart](https://docs.nestjs.com/cli/usages#nest-start) when changes are made.

### Project Organization

In order to allow for code-sharing across the frontend and backend in conjunction with an unejected Create React App (CRA), it was decided that the simplest and least error-prone way forward was to structure the code as such:

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

### Stack

* [TypeScript](https://www.typescriptlang.org/) for type safety
* [React](https://reactjs.org/) as a declarative view layer
* [Redux](https://redux.js.org/) for state management
* [redux-loop](https://redux-loop.js.org/) for effect management (eg. API calls)
* [ts.data.json](https://github.com/joanllenas/ts.data.json) for JSON decoding
* [PostgreSQL](https://www.postgresql.org/) for a relational database
* [NestJS](https://nestjs.com/) for the backend web server
* [TypeORM](https://typeorm.io/) for database queries and migrations
* [TopoJSON](https://github.com/topojson/topojson) for fast, topologically-aware geospatial operations

### Ports

| Port                          | Service          |
|-------------------------------|------------------|
| [3003](http://localhost:3003) | Create React App |
| [3005](http://localhost:3005) | NestJS           |

## Scripts

| Name        | Description                                                               |
|-------------|---------------------------------------------------------------------------|
| `cibuild`   | Build application for staging or a release.                               |
| `dbshell`   | Enter a database shell.                                                   |
| `migration` | Execute TypeORM migration CLI commands.                                   |
| `server`    | Bring up all of the services required for the project to function.        |
| `test`      | Run linters and tests.                                                    |
| `update`    | Build container images, update dependencies, and run database migrations. |
| `yarn`      | Execute Yarn CLI commands.                                                |
