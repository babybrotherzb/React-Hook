"use strict";

const chalk = require("react-dev-utils/chalk");
const fs = require("fs");
const resolve = require("resolve");
const path = require("path");
const paths = require("../../config/paths");
const os = require("os");
const immer = require("react-dev-utils/immer").produce;
const globby = require("react-dev-utils/globby").sync;

function writeJson(fileName, object) {
  fs.writeFileSync(
    fileName,
    JSON.stringify(object, null, 2).replace(/\n/g, os.EOL) + os.EOL
  );
}

function verifyNoTypeScript() {
  const typescriptFiles = globby(
    ["**/*.(ts|tsx)", "!**/node_modules", "!**/*.d.ts"],
    {
      cwd: paths.appSrc
    }
  );
  if (typescriptFiles.length > 0) {
    console.warn(
      chalk.yellow(
        `We detected TypeScript in your project (${chalk.bold(
          `src${path.sep}${typescriptFiles[0]}`
        )}) and created a ${chalk.bold("tsconfig.json")} file for you.`
      )
    );
    console.warn();
    return false;
  }
  return true;
}

function verifyTypeScriptSetup() {
  let firstTimeSetup = false;

  if (!fs.existsSync(paths.appTsConfig)) {
    if (verifyNoTypeScript()) {
      return;
    }
    writeJson(paths.appTsConfig, {});
    firstTimeSetup = true;
  }

  const isYarn = fs.existsSync(paths.yarnLockFile);

  // 确保安装了typescript
  let ts;
  try {
    ts = require(resolve.sync("typescript", {
      basedir: paths.appNodeModules
    }));
  } catch (_) {
    console.error(
      chalk.bold.red(
        `It looks like you're trying to use TypeScript but do not have ${chalk.bold(
          "typescript"
        )} installed.`
      )
    );
    console.error(
      chalk.bold(
        "Please install",
        chalk.cyan.bold("typescript"),
        "by running",
        chalk.cyan.bold(
          isYarn ? "yarn add typescript" : "npm install typescript"
        ) + "."
      )
    );
    console.error(
      chalk.bold(
        "If you are not trying to use TypeScript, please remove the " +
          chalk.cyan("tsconfig.json") +
          " file from your package root (and any TypeScript files)."
      )
    );
    console.error();
    process.exit(1);
  }

  const compilerOptions = {
    // 这些是建议的值，将在不存在时设置
    // tsconfig.json
    // 'parsedValue'匹配ts.parseJsonConfigFileContent()的输出值
    target: {
      parsedValue: ts.ScriptTarget.ES5,
      suggested: "es5"
    },
    lib: {
      suggested: ["dom", "dom.iterable", "esnext"]
    },
    allowJs: {
      suggested: true
    },
    skipLibCheck: {
      suggested: true
    },
    esModuleInterop: {
      suggested: true
    },
    allowSyntheticDefaultImports: {
      suggested: true
    },
    strict: {
      suggested: true
    },
    forceConsistentCasingInFileNames: {
      suggested: true
    },
    // TODO:启用v4.0 (#6936)
    // noFallthroughCasesInSwitch: {suggest: true}，
    //这些值是必需的，用户不能更改
    //保持与webpack配置同步
    module: {
      parsedValue: ts.ModuleKind.ESNext,
      value: "esnext",
      reason: "for import() and import/export"
    },
    moduleResolution: {
      parsedValue: ts.ModuleResolutionKind.NodeJs,
      value: "node",
      reason: "to match webpack resolution"
    },
    resolveJsonModule: {
      value: true,
      reason: "to match webpack loader"
    },
    isolatedModules: {
      value: true,
      reason: "implementation limitation"
    },
    noEmit: {
      value: true
    },
    jsx: {
      parsedValue: ts.JsxEmit.React,
      suggested: "react"
    },
    paths: {
      value: undefined,
      reason: "aliased imports are not supported"
    }
  };

  const formatDiagnosticHost = {
    getCanonicalFileName: fileName => fileName,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => os.EOL
  };

  const messages = [];
  let appTsConfig;
  let parsedTsConfig;
  let parsedCompilerOptions;
  try {
    const { config: readTsConfig, error } = ts.readConfigFile(
      paths.appTsConfig,
      ts.sys.readFile
    );

    if (error) {
      throw new Error(ts.formatDiagnostic(error, formatDiagnosticHost));
    }

    appTsConfig = readTsConfig;

    // 让TS解析和解析任何“扩展”
    //调用这个函数也会改变上面的tsconfig，
    //添加“包括”和“排除”，但编译器选项保持不变
    let result;
    parsedTsConfig = immer(readTsConfig, config => {
      result = ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        path.dirname(paths.appTsConfig)
      );
    });

    if (result.errors && result.errors.length) {
      throw new Error(
        ts.formatDiagnostic(result.errors[0], formatDiagnosticHost)
      );
    }

    parsedCompilerOptions = result.options;
  } catch (e) {
    if (e && e.name === "SyntaxError") {
      console.error(
        chalk.red.bold(
          "Could not parse",
          chalk.cyan("tsconfig.json") + ".",
          "Please make sure it contains syntactically correct JSON."
        )
      );
    }

    console.log(e && e.message ? `${e.message}` : "");
    process.exit(1);
  }

  if (appTsConfig.compilerOptions == null) {
    appTsConfig.compilerOptions = {};
    firstTimeSetup = true;
  }

  for (const option of Object.keys(compilerOptions)) {
    const { parsedValue, value, suggested, reason } = compilerOptions[option];

    const valueToCheck = parsedValue === undefined ? value : parsedValue;
    const coloredOption = chalk.cyan("compilerOptions." + option);

    if (suggested != null) {
      if (parsedCompilerOptions[option] === undefined) {
        appTsConfig.compilerOptions[option] = suggested;
        messages.push(
          `${coloredOption} to be ${chalk.bold(
            "suggested"
          )} value: ${chalk.cyan.bold(suggested)} (this can be changed)`
        );
      }
    } else if (parsedCompilerOptions[option] !== valueToCheck) {
      appTsConfig.compilerOptions[option] = value;
      messages.push(
        `${coloredOption} ${chalk.bold(
          valueToCheck == null ? "must not" : "must"
        )} be ${valueToCheck == null ? "set" : chalk.cyan.bold(value)}` +
          (reason != null ? ` (${reason})` : "")
      );
    }
  }

  //tsconfig此时将合并“包含”和“排除”
  if (parsedTsConfig.include == null) {
    appTsConfig.include = ["src"];
    messages.push(
      `${chalk.cyan("include")} should be ${chalk.cyan.bold("src")}`
    );
  }

  if (messages.length > 0) {
    if (firstTimeSetup) {
      console.log(
        chalk.bold(
          "Your",
          chalk.cyan("tsconfig.json"),
          "has been populated with default values."
        )
      );
      console.log();
    } else {
      console.warn(
        chalk.bold(
          "The following changes are being made to your",
          chalk.cyan("tsconfig.json"),
          "file:"
        )
      );
      messages.forEach(message => {
        console.warn("  - " + message);
      });
      console.warn();
    }
    writeJson(paths.appTsConfig, appTsConfig);
  }

  // 参考“react-scripts”类型
  if (!fs.existsSync(paths.appTypeDeclarations)) {
    fs.writeFileSync(
      paths.appTypeDeclarations,
      `/// <reference types="react-scripts" />${os.EOL}`
    );
  }
}

module.exports = verifyTypeScriptSetup;
