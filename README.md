# DistrictBuilder

This project is a continuation of the original version of DistrictBuilder, now called [DistrictBuilder Classic](https://github.com/PublicMapping/districtbuilder-classic), which is no longer being maintained. This repository is where active development of DistrictBuilder will continue to occur.

## Overview

DistrictBuilder is web-based, open source software for collaborative redistricting.

- [Requirements](#requirements)
- [Development](#development)
  - [Host Environments](#host-environments)
    - [Linux](#linux)
    - [macOS](#macos)
  - [Hot Reloading 🔥](#hot-reloading-)
  - [Remote Server Proxy](#remote-server-proxy)
  - [Project Organization](#project-organization)
  - [Stack](#stack)
  - [Ports](#ports)
- [Scripts](#scripts)
- [Command Line Interface](#command-line-interface)

## Requirements

- [Docker Engine](https://docs.docker.com/install/) 17.12+
- [Docker Compose](https://docs.docker.com/compose/install/) 1.21+

## Development

_Optional:_
Ensure that you have an AWS credential profile for `district-builder` configured on your host system.
The server backend will use this in order to access S3 assets if present, and any `manage` commands that use S3 assets will **require** it.

### Host Environments

The Docker containers used in development work very well on Linux, but require an additional layer of translation when running on non-Linux hosts. In particular, there are significant file-watching costs, which result in high CPU usage on macOS. On macOS, it is more efficient to run the containers within a Linux VM created with Vagrant.

#### Linux

On Linux, run `scripts/setup` to prepare the development environment:

```bash
$ ./scripts/setup
```

All other scripts can be run natively from the host, e.g.

```bash
$ ./scripts/update
```

#### macOS

On macOS, use the `--vagrant` flag to create a Vagrant VM instead:

```bash
$ ./scripts/setup --vagrant
```

All other scripts must be run from the Vagrant VM, e.g.

```bash
$ vagrant ssh
vagrant@vagrant:/vagrant$ ./scripts/update
```

or

```bash
$ vagrant ssh -c 'cd /vagrant && ./scripts/update'
```

For brevity, this document will use Linux examples throughout. You should run the scripts from the appropriate environment.

_Note:_ It is recommended to configure your editor to auto-format your code via Prettier on save.

### Hot Reloading 🔥

Next, run `scripts/server` to start the application:

```bash
 $ ./scripts/server
```

While `server` is running, the [Create React App](https://github.com/facebook/create-react-app/) frontend will automatically [reload](https://github.com/facebook/create-react-app/#whats-included) when changes are made. Additionally, the [NestJS](https://nestjs.com/) backend will [restart](https://docs.nestjs.com/cli/usages#nest-start) when changes are made.

### Remote Server Proxy

If you want to develop the `client` locally against a `server` running in the AWS staging environment, you can configure a local proxy using the `BASE_URL` environment variable:

```#bash
BASE_URL=https://app.staging.districtbuilder.org docker-compose up client
```

This will proxy local all requests directed at `/api` to `https://staging.districtbuilder.org`.

### PlanScore API integration

You will need a PlanScore API token to test the PlanScore integration in development. Please email info@planscore.org to get a token, then run `./scripts/bootstrap` to create a `.env` file in the server directory and populate the `PLAN_SCORE_API_TOKEN` environment variable with your token.

### Development Data

#### Using pre-processed data for development and testing

1. Sign up for an account in your local dev instance of the application at [http://localhost:3003](http://localhost:3003)(if you haven't already done so)
1. Load testing data with `$ ./scripts/load-dev-data`. This will:

- Load region configs for Pennsylvania, Michigan, and Dane County WI.
- Create an organization, accessible at [`http://localhost:3003/o/azavea`](http://localhost:3003/o/azavea)
- Set the user you just created as the organization administrator

#### Processing your own data for custom regions

To have data to work with, you'll need to do a two step process:

1. Process the GeoJSON for your state/region (this outputs all the static files DistrictBuilder needs to work in a local directory)
1. Publish the resulting files (upload to S3 for use by the app)

To process PA data, first copy the GeoJSON file into the `src/manage/data` directory, create an output directory (eg. `src/manage/data/output-pa`), and then run this command:

```
$ ./scripts/manage process-geojson data/PA.geojson -b -o data/output-pa -n 12,4,4 -x 12,12,12
```

Then:

```
$ ./scripts/manage publish-region data/output-pa US PA Pennsylvania
```

Once your data is published, you should be able to run the app and create a new project through the UI using that region and begin building districts.

If instead you'd like to use the processed data to update S3 in-place (and not insert a new region into the database), you may instead run the command:

```
$ ./scripts/manage update-region data/output-pa s3://previous/location/of/the/published/region
```

Note: when doing this, you will need to restart your server to see the new data, since it's cached on startup

### Project Organization

In order to allow for code-sharing across the frontend and backend in conjunction with an unejected Create React App (CRA), it was decided that the simplest and least error-prone way forward was to structure the code as such:

```
.
├── package.json (Applies to the CRA frontend)
├── src
│   ├── client (Location for all CRA frontend code)
│   ├── index.tsx (This and another file need to be here for CRA-purposes)
│   ├── manage (Command-line interface)
│   │   ├── package.json (Applies to the command-line interface)
│   ├── server (NestJS backend code)
│   │   ├── package.json (Applies to the NestJS backend)
│   └── shared (Code that is used by both the frontend and backend)
```

### Stack

- [TypeScript](https://www.typescriptlang.org/) for type safety
- [React](https://reactjs.org/) as a declarative view layer
- [Redux](https://redux.js.org/) for state management
- [redux-loop](https://redux-loop.js.org/) for effect management (eg. API calls)
- [ts.data.json](https://github.com/joanllenas/ts.data.json) for JSON decoding
- [PostgreSQL](https://www.postgresql.org/) for a relational database
- [NestJS](https://nestjs.com/) for the backend web server
- [TypeORM](https://typeorm.io/) for database queries and migrations
- [TopoJSON](https://github.com/topojson/topojson) for fast, topologically-aware geospatial operations

### Ports

| Port                          | Service          |
| ----------------------------- | ---------------- |
| [3003](http://localhost:3003) | Create React App |
| [3005](http://localhost:3005) | NestJS           |

## Scripts

| Name            | Description                                                               |
| --------------- | ------------------------------------------------------------------------- |
| `cibuild`       | Build application for staging or a release.                               |
| `cipublish`     | Publish container images to Elastic Container Registry.                   |
| `dbshell`       | Enter a database shell.                                                   |
| `infra`         | Execute Terraform subcommands with remote state management.               |
| `load-dev-data` | Loads development data for testing                                        |
| `manage`        | Execute commands with the `manage` CLI tool.                              |
| `migration`     | Execute TypeORM migration CLI commands.                                   |
| `server`        | Bring up all of the services required for the project to function.        |
| `setup`         | Setup the project's development environment.                              |
| `test`          | Run linters and tests.                                                    |
| `update`        | Build container images, update dependencies, and run database migrations. |
| `yarn`          | Execute Yarn CLI commands.                                                |

## Command Line Interface

A command line interface is available for performing data processing operations.
See `src/manage/README.md` for more info.
