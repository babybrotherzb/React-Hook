"use strict";

// 首先这样做，以便任何读取它的代码都知道正确的环境.
process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";

//出现错误时，使用非零退出代码终止Node.js进程
process.on("unhandledRejection", err => {
  throw err;
});

// 确保读取环境变量。
require("../config/env");
// @remove-on-eject-begin

const path = require("path");
const chalk = require("react-dev-utils/chalk");
const fs = require("fs-extra");
const webpack = require("webpack");
const configFactory = require("../config/webpack.config");
const paths = require("../config/paths");
const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles");
const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const printHostingInstructions = require("react-dev-utils/printHostingInstructions");
const FileSizeReporter = require("react-dev-utils/FileSizeReporter");
const printBuildError = require("react-dev-utils/printBuildError");
const inquirer = require("inquirer");
const Const = require("../config/const");
const colors = require("colors");
const glob = require("glob");

const measureFileSizesBeforeBuild =
  FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;
const useYarn = fs.existsSync(paths.yarnLockFile);

// 这些尺寸相当大。我们会警告有包裹超过限额。
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

//判断Node.js是否运行在TTY上下文的
const isInteractive = process.stdout.isTTY;

// 警告和崩溃，如果所需的文件丢失
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// 调用webpack传环境变量
// const config = configFactory( 'production' );
let config = {};

const { checkBrowsers } = require("react-dev-utils/browsersHelper");

const brfore = async () => {
  //选择将要打包的环境
  const result = await inquirer.prompt({
    type: "list",
    name: "env",
    message: "请选择build环境",
    filter: title => {
      let name = title;
      for (let i = 0; i < Const.env.length; i++) {
        if (Const.env[i].title === title) {
          name = Const.env[i].name;
          break;
        }
      }
      return name;
    },
    choices: Const.env.map(item => item.title)
  });

  const env = await result.env;

  const Domain = await `${Const.domain[result.env]}`;

  //CDN的项目文件路径获取
  config = await configFactory(env, `${Domain}${Const.projectName}`);
  console.log(chalk.yellow("config：", env, Domain, Const.projectName));

  await checkBrowsers(paths.appPath, isInteractive)
    .then(() => {
      // 首先，读取build目录中的当前文件大小
      // 这让我们可以显示他们后来改变了多少。
      return measureFileSizesBeforeBuild(paths.appBuild);
    })
    .then(previousFileSizes => {
      // 删除所有内容，但保留目录
      fs.emptyDirSync(paths.appBuild);
      //与公用文件夹合并
      copyPublicFolder();
      // 开始打包
      return build(previousFileSizes);
    })
    .then(
      ({ stats, previousFileSizes, warnings }) => {
        //调用build后的返回结果
        if (warnings.length) {
          console.log(chalk.yellow("Compiled with warnings.\n"));
          console.log(warnings.join("\n\n"));
          console.log(
            "\nSearch for the " +
              chalk.underline(chalk.yellow("keywords")) +
              " to learn more about each warning."
          );
          console.log(
            "To ignore, add " +
              chalk.cyan("// eslint-disable-next-line") +
              " to the line before.\n"
          );
        } else {
          console.log(chalk.green("Compiled successfully.\n"));
        }

        console.log(chalk.green("开始打包： \n"));
        printFileSizesAfterBuild(
          stats,
          previousFileSizes,
          paths.appBuild,
          WARN_AFTER_BUNDLE_GZIP_SIZE,
          WARN_AFTER_CHUNK_GZIP_SIZE
        );
        console.log(chalk.green("\n很好，打包成功了"));
        const appPackage = require(paths.appPackageJson);
        const publicUrl = paths.publicUrl;
        const publicPath = config.output.publicPath;
        const buildFolder = path.relative(process.cwd(), paths.appBuild);
        printHostingInstructions(
          appPackage,
          publicUrl,
          publicPath,
          buildFolder,
          useYarn
        );
      },
      err => {
        const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === "true";
        if (tscCompileOnError) {
          console.log(
            chalk.yellow(
              "使用以下类型错误编译(您可能希望在部署应用程序之前检查这些错误):\n"
            )
          );
          printBuildError(err);
        } else {
          console.log(chalk.red("Failed to compile.\n"));
          printBuildError(err);
          process.exit(1);
        }
      }
    )
    .catch(err => {
      if (err && err.message) {
        console.log(err.message);
      }
      process.exit(1);
    });
  //模拟上传操作
  //************上传操作可以在这里写************* */
  await startUploadImage(env, "token", "qiniu");
  await startUpload(env, "token", "qiniu");
  //************上传操作可以在这里写************* */
};

brfore();

/**
 * @desc 上传静态js/css资源
 * @param {string} env 环境变量
 * @param {string} token
 *
 */
async function startUpload(env, token, qiniu) {
  const files = glob.sync(`${paths.appBuild}/static/{js,css}/**/*.{js,css}`);

  if (files.length === 0) throw new Error("请先build环境静态资源");

  for (let filepath of files) {
    const fileExtension = filepath.substring(filepath.lastIndexOf(".") + 1);

    // 文件上传
    console.log(colors.underline(filepath));
    console.log(
      colors.magenta(
        `${Const["domain"][env] +
          "static/" +
          fileExtension +
          "/" +
          path.basename(filepath)}`
      )
    );
  }
}

/**
 * @desc 上传静态图片资源
 * @param {string} env
 * @param {string} token
 *
 */
async function startUploadImage(env, token, qiniu) {
  const files = glob.sync(
    `${paths.appBuild}/static/media/**/*.{png,jpg,gif,jpeg,svg}`
  );

  for (let filepath of files) {
    // 文件上传
    console.log(colors.underline(filepath));
    console.log(
      colors.magenta(
        `${Const["domain"][env] + "static/media/" + path.basename(filepath)}`
      )
    );
  }
}

//开始打包
async function build(previousFileSizes) {
  // 我们曾经支持根据“NODE_PATH”解析模块.
  // 现在它已经被弃用，取而代之的是jsconfig/tsconfig.json
  // 这使您可以在大型的monorepos中使用绝对路径
  if (process.env.NODE_PATH) {
    console.log(
      chalk.yellow(
        "Setting NODE_PATH to resolve modules absolutely has been deprecated in favor of setting baseUrl in jsconfig.json (or tsconfig.json if you are using TypeScript) and will be removed in a future major release of create-react-app."
      )
    );
    console.log();
  }

  console.log("正在打包中别慌...");

  const compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages;
      if (err) {
        if (!err.message) {
          return reject(err);
        }
        messages = formatWebpackMessages({
          errors: [err.message],
          warnings: []
        });
      } else {
        messages = formatWebpackMessages(
          stats.toJson({
            all: false,
            warnings: true,
            errors: true
          })
        );
      }
      if (messages.errors.length) {
        // 只保留第一个错误
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join("\n\n")));
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== "string" ||
          process.env.CI.toLowerCase() !== "false") &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            "\nTreating warnings as errors because process.env.CI = true.\n" +
              "Most CI servers set it automatically.\n"
          )
        );
        return reject(new Error(messages.warnings.join("\n\n")));
      }

      return resolve({
        stats,
        previousFileSizes,
        warnings: messages.warnings
      });
    });
  });
}

//拷贝除了html以外public里的文件，放到打包文件里
function copyPublicFolder() {
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => file !== paths.appHtml
  });
}
