/* Adapted from 'node-tippecanoe' */

const shell = require("shelljs");
const kebabCase = require("kebab-case");
const colors = require("colors");

function shellExec(cmd, args, echo) {
  const fullCommand = `${cmd} ${args.join(" ")}`;
  if (echo) {
    console.log(fullCommand.green);
  }
  shell.exec(fullCommand);
  return fullCommand;
}

function execAsync(cmd, args, echo) {
  const spawn = require("child-process-promise").spawn;
  if (echo) {
    console.log(`${cmd} ${args.join(" ")}`.green);
  }
  const promise = spawn(`${cmd}`, args);
  promise.childProcess.stderr.pipe(process.stdout);
  return promise;
}

function execCmd(cmd, layerFiles = [], params, options = {}) {
  function quotify(s) {
    if (typeof s === "object") {
      s = JSON.stringify(s);
    } else {
      s = String(s);
    }
    return !options.async && s.match(/[ "[]/) ? `'${s}'` : s;
  }
  function makeParam(key, value) {
    if (Array.isArray(value)) {
      return value.map(v => makeParam(key, v)).join(" ");
    }
    if (value === false) {
      // why do we do this?
      return "";
    }
    const short = key.length <= 2;
    const param = short ? `-${key}` : `--${kebabCase(key)}`;
    if (value === true) {
      return param;
    }
    return short ? `${param}${quotify(value)}` : `${param}=${quotify(value)}`;
  }
  let paramStrs = Object.keys(params)
    .map(k => makeParam(k, params[k]))
    .filter(Boolean);
  layerFiles = !Array.isArray(layerFiles) ? [layerFiles] : layerFiles;

  const args = [...paramStrs, ...layerFiles.map(quotify)];
  if (options.async) {
    return execAsync(cmd, args, options.echo);
  } else {
    return shellExec(cmd, args, options.echo);
  }
}

module.exports = {
  tippecanoe: (layerFiles, params, options = {}) =>
    execCmd("tippecanoe", layerFiles, params, options),
  tileJoin: (layerFiles, params, options = {}) => execCmd("tile-join", layerFiles, params, options)
};
