"use strict";

// 首先这样做，这样任何读它的代码都知道正确的环境。
process.env.BABEL_ENV = "test";
process.env.NODE_ENV = "test";
process.env.PUBLIC_URL = "";

// 使脚本在未处理的拒绝上崩溃，而不是静默
//忽略它们。在未来，不被处理的承诺会被拒绝
//使用非零退出码终止Node.js进程。
process.on("unhandledRejection", err => {
  throw err;
});

// 确保读取环境变量。
require("../config/env");
// @remove-on-eject-begin
//执行飞行前检查(仅在弹出之前进行)。
const verifyPackageTree = require("./utils/verifyPackageTree");
if (process.env.SKIP_PREFLIGHT_CHECK !== "true") {
  verifyPackageTree();
}
const verifyTypeScriptSetup = require("./utils/verifyTypeScriptSetup");
verifyTypeScriptSetup();
// @remove-on-eject-end

const jest = require("jest");
const execSync = require("child_process").execSync;
let argv = process.argv.slice(2);

function isInGitRepository() {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      stdio: "ignore"
    });
    return true;
  } catch (e) {
    return false;
  }
}

function isInMercurialRepository() {
  try {
    execSync("hg --cwd . root", {
      stdio: "ignore"
    });
    return true;
  } catch (e) {
    return false;
  }
}

//除非在CI上或显式地运行所有测试，否则请观察
if (
  !process.env.CI &&
  argv.indexOf("--watchAll") === -1 &&
  argv.indexOf("--watchAll=false") === -1
) {
  // https://github.com/facebook/create-react-app/issues/5210
  const hasSourceControl = isInGitRepository() || isInMercurialRepository();
  argv.push(hasSourceControl ? "--watch" : "--watchAll");
}

// @remove-on-eject-begin
// 在弹出之后，这是不必要的，因为我们将配置嵌入到了package.json中
const createJestConfig = require("./utils/createJestConfig");
const path = require("path");
const paths = require("../config/paths");
argv.push(
  "--config",
  JSON.stringify(
    createJestConfig(
      relativePath => path.resolve(__dirname, "..", relativePath),
      path.resolve(paths.appSrc, ".."),
      false
    )
  )
);

// 对于https://github.com/facebook/jest/issues/5913来说，这是一个非常糟糕的解决方案。
//我们试图自己解决环境问题，因为Jest做错了。
// TODO:一旦它在玩笑中被修复，立即删除它。
const resolve = require("resolve");

function resolveJestDefaultEnvironment(name) {
  const jestDir = path.dirname(
    resolve.sync("jest", {
      basedir: __dirname
    })
  );
  const jestCLIDir = path.dirname(
    resolve.sync("jest-cli", {
      basedir: jestDir
    })
  );
  const jestConfigDir = path.dirname(
    resolve.sync("jest-config", {
      basedir: jestCLIDir
    })
  );
  return resolve.sync(name, {
    basedir: jestConfigDir
  });
}
let cleanArgv = [];
let env = "jsdom";
let next;
do {
  next = argv.shift();
  if (next === "--env") {
    env = argv.shift();
  } else if (next.indexOf("--env=") === 0) {
    env = next.substring("--env=".length);
  } else {
    cleanArgv.push(next);
  }
} while (argv.length > 0);
argv = cleanArgv;
let resolvedEnv;
try {
  resolvedEnv = resolveJestDefaultEnvironment(`jest-environment-${env}`);
} catch (e) {
  // ignore
}
if (!resolvedEnv) {
  try {
    resolvedEnv = resolveJestDefaultEnvironment(env);
  } catch (e) {
    // ignore
  }
}
const testEnvironment = resolvedEnv || env;
argv.push("--env", testEnvironment);
// @remove-on-eject-end
jest.run(argv);
