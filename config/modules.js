"use strict";

const fs = require("fs");
const path = require("path");
const paths = require("./paths");
const chalk = require("react-dev-utils/chalk");
const resolve = require("resolve");

/**
 * 基于compilerOptions对象的baseUrl获取其他模块路径.
 *
 * @param {Object} options
 */
function getAdditionalModulePaths(options = {}) {
  const baseUrl = options.baseUrl;

  // 我们需要显式地检查null和undefined(而不是一个假值)，因为
  // TypeScript将空字符串处理为' . '。
  if (baseUrl == null) {
    // 如果没有baseUrl集合，我们就使用NODE_PATH
    //注意，NODE_PATH已被弃用，将被删除
    //在create- response -app的下一个主要版本中。

    const nodePath = process.env.NODE_PATH || "";
    return nodePath.split(path.delimiter).filter(Boolean);
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

  // 如果' baseUrl '被设置为' node_modules '，我们不需要做任何事情。这是
  //默认行为。
  if (path.relative(paths.appNodeModules, baseUrlResolved) === "") {
    return null;
  }

  // 允许用户将“baseUrl”设置为“appSrc”。
  if (path.relative(paths.appSrc, baseUrlResolved) === "") {
    return [paths.appSrc];
  }

  //如果路径等于根目录，我们在这里忽略它。
  //我们不希望直接从根目录导入源文件
  //在“src”之外没有泄露。我们确实允许进口
  //绝对路径。' src/Components/Button.js ')但我们用
  //一个别名。
  if (path.relative(paths.appPath, baseUrlResolved) === "") {
    return null;
  }

  // 否则，抛出错误。
  throw new Error(
    chalk.red.bold(
      "Your project's `baseUrl` can only be set to `src` or `node_modules`." +
        " Create React App does not support other values at this time."
    )
  );
}

/**
 * 基于compilerOptions对象的baseUrl获取webpack别名。
 *
 * @param {*} options
 */
function getWebpackAliases(options = {}) {
  const baseUrl = options.baseUrl;

  if (!baseUrl) {
    return {};
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

  if (path.relative(paths.appPath, baseUrlResolved) === "") {
    return {
      src: paths.appSrc
    };
  }
}

/**
 *基于compilerOptions对象的baseUrl获取jest别名。
 *
 * @param {*} options
 */
function getJestAliases(options = {}) {
  const baseUrl = options.baseUrl;

  if (!baseUrl) {
    return {};
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

  if (path.relative(paths.appPath, baseUrlResolved) === "") {
    return {
      "src/(.*)$": "<rootDir>/src/$1"
    };
  }
}

function getModules() {
  // Check if TypeScript is setup
  const hasTsConfig = fs.existsSync(paths.appTsConfig);
  const hasJsConfig = fs.existsSync(paths.appJsConfig);

  if (hasTsConfig && hasJsConfig) {
    throw new Error(
      "You have both a tsconfig.json and a jsconfig.json. If you are using TypeScript please remove your jsconfig.json file."
    );
  }

  let config;

  // 如果有tsconfig。json，我们假设它是a
  // TypeScript项目并设置配置
  //基于tsconfig.json
  if (hasTsConfig) {
    const ts = require(resolve.sync("typescript", {
      basedir: paths.appNodeModules
    }));
    config = ts.readConfigFile(paths.appTsConfig, ts.sys.readFile).config;
    // 否则，我们将检查是否有jsconfig.json
    //非技术项目。
  } else if (hasJsConfig) {
    config = require(paths.appJsConfig);
  }

  config = config || {};
  const options = config.compilerOptions || {};

  const additionalModulePaths = getAdditionalModulePaths(options);

  return {
    additionalModulePaths: additionalModulePaths,
    webpackAliases: getWebpackAliases(options),
    jestAliases: getJestAliases(options),
    hasTsConfig
  };
}

module.exports = getModules();
