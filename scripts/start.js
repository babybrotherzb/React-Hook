"use strict";

//首先这样做，这样任何读它的代码都知道正确的环境。
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

// 使脚本在未处理的拒绝上崩溃，而不是静默
//忽略它们。在未来，不被处理的承诺会被拒绝
//使用非零退出码终止Node.js进程。
process.on("unhandledRejection", err => {
  throw err;
});

// 确保读取环境变量。
require("../config/env");

const fs = require("fs");
const chalk = require("react-dev-utils/chalk");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const clearConsole = require("react-dev-utils/clearConsole");
const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles");
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls
} = require("react-dev-utils/WebpackDevServerUtils");
const openBrowser = require("react-dev-utils/openBrowser");
const paths = require("../config/paths");
const configFactory = require("../config/webpack.config");
const createDevServerConfig = require("../config/webpackDevServer.config");

const useYarn = fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTTY;

// 警告和崩溃，如果所需的文件丢失
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// 像Cloud9这样的工具就依赖于此。
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(
    `Learn more here: ${chalk.yellow("https://bit.ly/CRA-advanced-config")}`
  );
  console.log();
}

// 我们要求您显式地设置浏览器，并且不要退回到
// browserslist违约。
const { checkBrowsers } = require("react-dev-utils/browsersHelper");
checkBrowsers(paths.appPath, isInteractive)
  .then(() => {
    // 我们尝试使用默认端口，但如果它忙，我们提供给用户
    //在不同的端口上运行。“choosePort()”承诺解析到下一个空闲端口。
    return choosePort(HOST, DEFAULT_PORT);
  })
  .then(port => {
    if (port == null) {
      // 我们还没有找到一个端口。
      return;
    }
    const config = configFactory("development");
    const protocol = process.env.HTTPS === "true" ? "https" : "http";
    const appName = require(paths.appPackageJson).name;
    const useTypeScript = fs.existsSync(paths.appTsConfig);
    const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === "true";
    const urls = prepareUrls(protocol, HOST, port);
    const devSocket = {
      warnings: warnings =>
        devServer.sockWrite(devServer.sockets, "warnings", warnings),
      errors: errors => devServer.sockWrite(devServer.sockets, "errors", errors)
    };
    // 创建一个配置了自定义消息的webpack编译器。
    const compiler = createCompiler({
      appName,
      config,
      devSocket,
      urls,
      useYarn,
      useTypeScript,
      tscCompileOnError,
      webpack
    });
    // 负载代理配置
    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(proxySetting, paths.appPublic);
    // 通过web服务器提供编译器生成的webpack资产。
    const serverConfig = createDevServerConfig(
      proxyConfig,
      urls.lanUrlForConfig
    );
    const devServer = new WebpackDevServer(compiler, serverConfig);
    // WebpackDevServer发射。
    devServer.listen(port, HOST, err => {
      if (err) {
        return console.log(err);
      }
      if (isInteractive) {
        clearConsole();
      }

      // 我们曾经支持根据“NODE_PATH”解析模块。
      //现在已经不支持这个配置，而支持jsconfig/tsconfig.json
      //这让你在导入时使用绝对路径在大型的monorepos:
      if (process.env.NODE_PATH) {
        console.log(
          chalk.yellow(
            "Setting NODE_PATH to resolve modules absolutely has been deprecated in favor of setting baseUrl in jsconfig.json (or tsconfig.json if you are using TypeScript) and will be removed in a future major release of create-react-app."
          )
        );
        console.log();
      }

      console.log(chalk.cyan("Starting the development server...\n"));
      openBrowser(urls.localUrlForBrowser);
    });

    ["SIGINT", "SIGTERM"].forEach(function(sig) {
      process.on(sig, function() {
        devServer.close();
        process.exit();
      });
    });
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
