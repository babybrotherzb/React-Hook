"use strict";

const fs = require("fs");
const path = require("path");
const paths = require("./paths");

// 确保在env.js之后包含path .js将读取.env变量。
delete require.cache[require.resolve("./paths")];

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  throw new Error(
    "The NODE_ENV environment variable is required but was not specified."
  );
}

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${paths.dotenv}.${NODE_ENV}.local`,
  `${paths.dotenv}.${NODE_ENV}`,
  //不包括“.env。本地'为'测试'环境
  //因为通常情况下，您期望测试产生相同的结果
  //每个人的结果
  NODE_ENV !== "test" && `${paths.dotenv}.local`,
  paths.dotenv
].filter(Boolean);

//从.env*文件中加载环境变量。使用静默抑制警告
//如果这个文件丢失了。dotenv永远不会修改任何环境变量
//在.env文件中支持变量扩展。
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require("dotenv-expand")(
      require("dotenv").config({
        path: dotenvFile
      })
    );
  }
});

// 我们支持根据“NODE_PATH”解析模块。
//这让你在导入时使用绝对路径在大型的monorepos:
// https://github.com/facebook/create-react-app/issues/253。
//它的工作原理类似于节点本身的“NODE_PATH”:
// https://nodejs.org/api/modules.html modules_loading_from_the_global_folders
//注意，与Node中不同的是，这里只支持“NODE_PATH”中的“相对”路径。
//否则，我们将冒着将Node.js核心模块导入应用程序而不是Webpack垫片的风险。
// https://github.com/facebook/create-react-app/issues/1023 # issuecomment - 265344421
//我们还会解决这些问题，以确保所有使用它们的工具都能一致地工作。
const appDirectory = fs.realpathSync(process.cwd());
process.env.NODE_PATH = (process.env.NODE_PATH || "")
  .split(path.delimiter)
  .filter(folder => folder && !path.isAbsolute(folder))
  .map(folder => path.resolve(appDirectory, folder))
  .join(path.delimiter);

// 获取NODE_ENV和REACT_APP_*环境变量，并将它们准备好
//通过Webpack配置中的DefinePlugin注入到应用程序中。
const REACT_APP = /^REACT_APP_/i;

function getClientEnvironment(publicUrl) {
  const raw = Object.keys(process.env)
    .filter(key => REACT_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key];
        return env;
      },
      {
        // 用于确定我们是否在生产模式下运行。
        //最重要的是，它把反应切换到正确的模式。
        NODE_ENV: process.env.NODE_ENV || "development",
        // 用于解析到“public”中的静态资产的正确路径。
        //例如，<img src={process.env。PUBLIC_URL + ' / img /标志。png '} / >。
        //这只能用作逃生出口。通常你会把
        //图像到“src”中，然后在代码中“导入”它们，以获得它们的路径。
        PUBLIC_URL: publicUrl
      }
    );
  // Stringify所有值，这样我们就可以输入Webpack DefinePlugin
  const stringified = {
    "process.env": Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {})
  };

  return {
    raw,
    stringified
  };
}

module.exports = getClientEnvironment;
