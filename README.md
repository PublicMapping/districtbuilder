# DistrictBuilder 2

DistrictBuilder 2 is web-based, open source software for collaborative redistricting.

The app is meant to be run directly on the host machine (not within a container or VM).

## Requirements

* [nvm](https://github.com/creationix/nvm) to manage Node versions on your machine
* [yvm](https://yvm.js.org/docs/overview) to manage Yarn versions for package management 

## Development

### Setup

1. Make sure you have `nvm` and `yvm` installed (see links in [Requirements](#requirements))
1. Run `./scripts/setup`

Note that it is recommended to configure your editor to auto-format your code via Prettier on save.

## Stack

This app uses:
* [TypeScript](https://www.typescriptlang.org/) for type safety
* [React](https://reactjs.org/) as a declarative view layer
* [Redux](https://redux.js.org/) for state management
* [redux-loop](https://redux-loop.js.org/) for effect management (eg. API calls)
* [ts.data.json](https://github.com/joanllenas/ts.data.json) for JSON decoding

## Ports

| Port                          | Service                                               |
| ----------------------------- | ----------------------------------------------------- |
| [3003](http://localhost:3003) | [CRA](https://github.com/facebook/create-react-app)-based frontend application                        |

## Scripts

### Scripts to Rule Them All (STRTA)

| Name      | Description                                               |
| --------- | --------------------------------------------------------- |
| `server`  | Run application                                           |
| `setup`   | Get set up for development                                |
| `test`    | Check for lint and formatting and run tests               |
| `update`  | Update dependencies                                       |

### Yarn commands

### `yarn start`

Runs the app in development mode.

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
