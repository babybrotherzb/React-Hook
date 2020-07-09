"use strict";

const fs = require("fs");
const isWsl = require("is-wsl");
const path = require("path");
const webpack = require("webpack");
const resolve = require("resolve");
const PnpWebpackPlugin = require("pnp-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const safePostCssParser = require("postcss-safe-parser");
const ManifestPlugin = require("webpack-manifest-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const WatchMissingNodeModulesPlugin = require("react-dev-utils/WatchMissingNodeModulesPlugin");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const getCSSModuleLocalIdent = require("react-dev-utils/getCSSModuleLocalIdent");
const paths = require("./paths");
const modules = require("./modules");
const getClientEnvironment = require("./env");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const ForkTsCheckerWebpackPlugin = require("react-dev-utils/ForkTsCheckerWebpackPlugin");
const typescriptFormatter = require("react-dev-utils/typescriptFormatter");
const eslint = require("eslint");
const consts = require("./const");
// @remove-on-eject-begin
const getCacheIdentifier = require("react-dev-utils/getCacheIdentifier");
// @remove-on-eject-end
const postcssNormalize = require("postcss-normalize");

const appPackageJson = require(paths.appPackageJson);

// 源映射是资源密集型的，对于大型源文件可能会导致内存不足的问题。
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";
// 有些应用程序不需要保存web请求的好处，因此不需要内联数据块使构建过程更加平滑。
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== "false";

const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || "10000"
);

// 检查TypeScript是否设置好
const useTypeScript = fs.existsSync(paths.appTsConfig);

// regex样式文件
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

// 这是生产和开发配置.
// 它专注于开发人员体验、快速重建和最小的包.
module.exports = function(webpackEnv) {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction =
    webpackEnv === "production" || webpackEnv === "release";
  console.log(paths.appBuild, "00000000000000000000000000000000");

  //多环境变量出口文件路径
  paths.appBuild = paths.appBuild + "/" + webpackEnv;
  console.log(paths.appBuild, "1111111111111111111111111111111111");
  // 用于在生产环境中启用分析的变量
  // 传入别名对象。如果传递到构建命令，则使用标志
  const isEnvProductionProfile =
    isEnvProduction && process.argv.includes("--profile");

  // Webpack使用“publicPath”来确定应用程序的服务来源.
  // 它需要一个结尾的斜杠，否则文件资产将得到一个不正确的路径.
  // 在发展中，我们始终从根本上服务。这使配置更容易。
  // 下面演示cdn上传动态生成html内的路径
  const publicPath = isEnvProduction
    ? consts["domain"][webpackEnv] + consts["projectName"]
    : isEnvDevelopment && "/";
  // 有些应用程序不使用带有pushState的客户端路由。
  // 对于这些，“主页”可以设置为“。”来启用相关的资产路径。
  const shouldUseRelativeAssetPaths = publicPath === "./";

  const publicUrl = isEnvProduction
    ? publicPath.slice(0, -1)
    : isEnvDevelopment && "";

  // 让环境变量注入我们的应用程序.
  const env = getClientEnvironment(publicUrl);

  // 获取样式加载器的公共函数
  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve("style-loader"),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        options: shouldUseRelativeAssetPaths
          ? {
              publicPath: "../../"
            }
          : {}
      },
      {
        loader: require.resolve("css-loader"),
        options: cssOptions
      },
      {
        //PostCSS的选项，因为我们引用这些选项两次
        //根据指定的浏览器支持添加厂商前缀
        // package.json
        loader: require.resolve("postcss-loader"),
        options: {
          // 必要的外部CSS导入工作
          // https://github.com/facebook/create-react-app/issues/2677
          ident: "postcss",
          plugins: () => [
            require("postcss-flexbugs-fixes"),
            require("postcss-preset-env")({
              autoprefixer: {
                flexbox: "no-2009"
              },
              stage: 3
            }),
            //添加PostCSS Normalize作为带有默认选项的重置css，
            //以便它在package.json中显示browserslist config
            //这反过来又让用户根据自己的需要定制目标行为。
            postcssNormalize()
          ],
          sourceMap: isEnvProduction && shouldUseSourceMap
        }
      }
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve("resolve-url-loader"),
          options: {
            sourceMap: isEnvProduction && shouldUseSourceMap
          }
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: true
          }
        }
      );
    }
    return loaders;
  };

  return {
    mode: isEnvProduction ? "production" : isEnvDevelopment && "development",
    //在生产环境中尽早停止编译
    bail: isEnvProduction,
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? "source-map"
        : false
      : isEnvDevelopment && "cheap-module-source-map",
    // 入口
    entry: [
      // 热更新
      isEnvDevelopment &&
        require.resolve("react-dev-utils/webpackHotDevClient"),
      // 应用程序的代码:
      paths.appIndexJs
      // 我们包含了app代码last，这样如果期间有运行时错误
      //初始化，它不会破坏WebpackDevServer客户端
      //改变JS代码仍然会触发刷新。
    ].filter(Boolean),
    output: {
      // 出口建立文件夹,正式或测试时生成打包文件，否则只编译
      path: isEnvProduction ? paths.appBuild : undefined,
      // 将/* filename */注释添加到输出中生成的require()s。
      pathinfo: isEnvDevelopment,
      // 每个异步块将有一个主包和一个文件。
      //在开发过程中，它不会生成真正的文件。
      filename: isEnvProduction
        ? "static/js/[name].[contenthash:8].js"
        : isEnvDevelopment && "static/js/bundle.js",
      futureEmitAssets: true,
      // 如果使用代码分割，还有其他JS块文件。
      chunkFilename: isEnvProduction
        ? "static/js/[name].[contenthash:8].chunk.js"
        : isEnvDevelopment && "static/js/[name].chunk.js",
      //我们从主页中推断出“公共路径”(例如/或/my-project)。
      //我们在开发中使用“/”。
      publicPath: publicPath,
      // 指向原始磁盘位置的sourcemap条目(格式为Windows上的URL)
      devtoolModuleFilenameTemplate: isEnvProduction
        ? info =>
            path
              .relative(paths.appSrc, info.absoluteResourcePath)
              .replace(/\\/g, "/")
        : isEnvDevelopment &&
          (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/")),
      //防止在多个Webpack运行时(来自不同的应用程序)发生冲突
      //在同一页上使用。
      jsonpFunction: `webpackJsonp${appPackageJson.name}`,
      // 这是默认的“窗口”，但通过设置它的“这个”然后
      //构建的模块块也可以在web workers中工作。
      globalObject: "this"
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // 这只在生产模式中使用
        new TerserPlugin({
          terserOptions: {
            parse: {
              // 我们希望terser解析ecma 8代码。然而，我们不想要它
              //应用任何使ecma 5代码有效的缩减步骤
              //进入无效的ecma 5代码。这就是为什么“压缩”和“输出”
              //section只应用ecma 5安全的转换
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8
            },
            compress: {
              ecma: 5,
              warnings: false,
              // 禁用的问题与Uglify打破看似有效的代码:
              // https://github.com/facebook/create-react-app/issues/2376
              //有待进一步调查:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // 禁用，因为问题与Terser打破有效的代码:
              // https://github.com/facebook/create-react-app/issues/5250
              //有待进一步调查:
              // https://github.com/terser-js/terser/issues/120
              inline: 2
            },
            mangle: {
              safari10: true
            },
            // 添加用于在devtools中进行分析
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              // 打开是因为表情符号和正则表达式在默认情况下没有被缩小
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true
            }
          },
          // 使用多进程并行运行来提高构建速度
          //默认并发运行数量:os.cpus()。长度- 1
          //由于Terser问题，在WSL(用于Linux的Windows子系统)上禁用了//
          // https://github.com/webpack-contrib/terser-webpack-plugin/issues/21
          parallel: !isWsl,
          //使文件缓存
          cache: true,
          sourceMap: shouldUseSourceMap
        }),
        // 这只在生产模式中使用
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: safePostCssParser,
            map: shouldUseSourceMap
              ? {
                  // `inline: false '强制将sourcemap输出到
                  //单独的文件
                  inline: false,
                  // ' annotation: true '将sourceMappingURL追加到的末尾
                  // css文件，帮助浏览器找到源地图
                  annotation: true
                }
              : false
          }
        })
      ],
      // 自动分割供应商和共享
      // https://twitter.com/wSokra/status/969633336732905474
      // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      splitChunks: {
        chunks: "all",
        name: false
      },
      // 保持运行时块分离以启用长期缓存
      // https://twitter.com/wSokra/status/969679223278505985
      // https://github.com/facebook/create-react-app/issues/5358
      runtimeChunk: {
        name: entrypoint => `runtime-${entrypoint.name}`
      }
    },
    resolve: {
      // 这允许您为Webpack应该在哪里寻找模块设置一个后备方案。
      //我们将这些路径放在第二位，因为我们希望' node_modules '能够"win"
      //如果有冲突的话。这与节点解析机制相匹配。
      // https://github.com/facebook/create-react-app/issues/253
      modules: ["node_modules", paths.appNodeModules].concat(
        modules.additionalModulePaths || []
      ),
      // 这些是节点生态系统支持的合理缺省值。
      //我们还将JSX作为一个通用组件文件名扩展名来支持
      //有些工具，虽然我们不建议使用，但请参阅:
      // https://github.com/facebook/create-react-app/issues/290
      //“web”扩展前缀已被添加，以提供更好的支持
      //用于React Native Web。
      extensions: paths.moduleFileExtensions
        .map(ext => `.${ext}`)
        .filter(ext => useTypeScript || !ext.includes("ts")),
      alias: {
        // 支持React原生Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        "react-native": "react-native-web",
        // 允许使用ReactDevTools进行更好的分析
        ...(isEnvProductionProfile && {
          "react-dom$": "react-dom/profiling",
          "scheduler/tracing": "scheduler/tracing-profiling"
        }),
        ...(modules.webpackAliases || {})
      },
      plugins: [
        // 增加了对即插即用安装的支持，使安装和添加速度更快
        //防止被遗忘的依赖关系等。
        PnpWebpackPlugin,
        //防止用户从src/(或node_modules/)外部导入文件。
        //这通常会引起混淆，因为我们只使用babel处理src/中的文件。
        //为了解决这个问题，我们阻止您从src/中导入文件——如果您愿意，
        //请将这些文件链接到您的node_modules/中，并允许启动模块解析。
        //确保你的源文件已被编译，因为它们不会以任何方式被处理。
        new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson])
      ]
    },
    resolveLoader: {
      plugins: [
        // 也与即插即用有关，但这次它告诉Webpack加载它的加载器
        //从当前包。
        PnpWebpackPlugin.moduleLoader(module)
      ]
    },
    module: {
      strictExportPresence: true,
      rules: [
        // 禁用要求。确保它不是一个标准的语言特性。
        {
          parser: {
            requireEnsure: false
          }
        },

        // 首先，运行linter。
        //在Babel处理JS之前这样做是很重要的。
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          enforce: "pre",
          use: [
            {
              options: {
                cache: true,
                formatter: require.resolve("react-dev-utils/eslintFormatter"),
                eslintPath: require.resolve("eslint"),
                resolvePluginsRelativeTo: __dirname,
                // @remove-on-eject-begin
                ignore: process.env.EXTEND_ESLINT === "true",
                baseConfig: (() => {
                  // 我们只允许在设置了env变量的情况下重写配置
                  if (process.env.EXTEND_ESLINT === "true") {
                    const eslintCli = new eslint.CLIEngine();
                    let eslintConfig;
                    try {
                      eslintConfig = eslintCli.getConfigForFile(
                        paths.appIndexJs
                      );
                    } catch (e) {
                      console.error(e);
                      process.exit(1);
                    }
                    return eslintConfig;
                  } else {
                    return {
                      extends: [require.resolve("eslint-config-react-app")]
                    };
                  }
                })(),
                useEslintrc: false
                // @remove-on-eject-end
              },
              loader: require.resolve("eslint-loader")
            }
          ],
          include: paths.appSrc
        },
        {
          // “one of”将遍历以下所有加载器，直到其中一个加载器
          //符合要求。当没有加载器匹配时，它就会下降
          //返回到加载器列表末尾的“文件”加载器。
          oneOf: [
            // “url”加载器的工作原理类似于“文件”加载器，只是它嵌入了资产
            //小于指定的字节限制，作为数据url以避免请求。
            //一个缺失的“test”相当于一个匹配。
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve("url-loader"),
              options: {
                limit: imageInlineSizeLimit,
                name: "static/media/[name].[hash:8].[ext]"
              }
            },
            // 使用Babel处理应用程序JS。
            //预设包括JSX、Flow、TypeScript和一些ESnext特性。
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve("babel-loader"),
              options: {
                customize: require.resolve(
                  "babel-preset-react-app/webpack-overrides"
                ),
                // @remove-on-eject-begin
                babelrc: false,
                configFile: false,
                presets: [require.resolve("babel-preset-react-app")],
                // 确保我们有唯一的缓存标识符，在
                //谨慎的一面。
                //当用户抛出时，因为默认值，我们删除这个
                //是理智的，使用巴别塔选项。我们使用
                //反应脚本和babel-preset-反应应用程序版本。
                cacheIdentifier: getCacheIdentifier(
                  isEnvProduction
                    ? "production"
                    : isEnvDevelopment && "development",
                  [
                    "babel-plugin-named-asset-import",
                    "babel-preset-react-app",
                    "react-dev-utils",
                    "react-scripts"
                  ]
                ),
                // @remove-on-eject-end
                plugins: [
                  [
                    require.resolve("babel-plugin-named-asset-import"),
                    {
                      loaderMap: {
                        svg: {
                          ReactComponent:
                            "@svgr/webpack?-svgo,+titleProp,+ref![path]"
                        }
                      }
                    }
                  ]
                ],
                // 这是webpack的“Babel -loader”特性(不是Babel本身)。
                //它支持在./node_modules/.cache/babel-loader/中缓存结果
                //目录，以便更快地重新构建。
                cacheDirectory: true,
                // 有关为什么禁用cacheCompression的上下文，请参见#6846
                cacheCompression: false,
                compact: isEnvProduction
              }
            },
            // 使用Babel处理应用程序外部的所有JS。
            //与应用JS不同，我们只编译标准的ES特性。
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve("babel-loader"),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [
                  [
                    require.resolve("babel-preset-react-app/dependencies"),
                    {
                      helpers: true
                    }
                  ]
                ],
                cacheDirectory: true,
                // 有关为什么禁用cacheCompression的上下文，请参见#6846
                cacheCompression: false,
                // @remove-on-eject-begin
                cacheIdentifier: getCacheIdentifier(
                  isEnvProduction
                    ? "production"
                    : isEnvDevelopment && "development",
                  [
                    "babel-plugin-named-asset-import",
                    "babel-preset-react-app",
                    "react-dev-utils",
                    "react-scripts"
                  ]
                ),
                // @remove-on-eject-end
                //如果在包中发生错误，就有可能发生错误
                //因为它是编译的。因此，我们不需要浏览器
                //调试器以显示原始代码。相反,代码
                //进行评估会更有帮助。
                sourceMaps: false
              }
            },
            // “postcss”加载程序将autoprefixer应用于我们的CSS。
            //“css”加载器解析css中的路径并将资产添加为依赖项。
            //“style”加载器将CSS转换成注入<style>标签的JS模块。
            //在生产中，我们使用MiniCSSExtractPlugin来提取CSS
            //指向一个文件，但是在开发中，“style”加载器支持热编辑
            // CSS。
            //默认情况下，我们支持扩展名为.module.css的CSS模块
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction && shouldUseSourceMap
              }),
              // 不要考虑CSS导入死代码，即使
              //包装声称没有副作用。
              //当webpack为此添加警告或错误时删除它。
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // 使用扩展名.module.css
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction && shouldUseSourceMap,
                modules: true,
                getLocalIdent: getCSSModuleLocalIdent
              })
            },
            // 支持SASS(使用.scss或. SASS扩展)。
            //默认情况下，我们支持SASS模块
            //扩展.module。scss或.module.sass
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isEnvProduction && shouldUseSourceMap
                },
                "sass-loader"
              ),
              // 不要考虑CSS导入死代码，即使
              //包装声称没有副作用。
              //当webpack为此添加警告或错误时删除它。
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true
            },
            // 增加对CSS模块的支持，但使用SASS
            //使用扩展名.module。scss或.module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isEnvProduction && shouldUseSourceMap,
                  modules: true,
                  getLocalIdent: getCSSModuleLocalIdent
                },
                "sass-loader"
              )
            },
            {
              test: lessRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isEnvProduction && shouldUseSourceMap
                },
                "less-loader"
              ),
              // 不要考虑CSS导入死代码，即使
              //包装声称没有副作用。
              //当webpack为此添加警告或错误时删除它。
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true
            },
            {
              test: lessModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isEnvProduction && shouldUseSourceMap,
                  modules: true,
                  getLocalIdent: getCSSModuleLocalIdent
                },
                "less-loader"
              )
            },
            //“文件”加载器确保这些资产由WebpackDevServer提供服务。
            //当你“导入”一个资产时，你会得到它的(虚拟的)文件名。
            //在生产中，它们会被复制到“build”文件夹。
            //这个加载器不使用“test”，所以它会捕获所有模块
            //从其他装载机上掉下来。
            {
              loader: require.resolve("file-loader"),
              // 排除“js”文件，以保持“css”加载器工作，因为它注入
              //它的运行时，否则将通过“文件”加载器处理。
              //还排除了“html”和“json”扩展，以便处理它们
              // webpacks的内部装载机
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              options: {
                name: "static/media/[name].[hash:8].[ext]"
              }
            }
            // **停止**你正在添加一个新的加载程序?
            //确保在“文件”加载程序之前添加新的加载程序。
          ]
        }
      ]
    },
    plugins: [
      // 生成一个索引。注入<脚本>的html '文件。
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: paths.appHtml,
            filename: "index.html"
          },
          isEnvProduction
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true
                }
              }
            : undefined
        )
      ),
      // 内联webpack运行时脚本。这个脚本太小了，不值得使用
      //网络请求。
      // https://github.com/facebook/create-react-app/issues/5358
      isEnvProduction &&
        shouldInlineRuntimeChunk &&
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      // 使一些环境变量在index.html中可用。
      //该公共URL在索引中以%PUBLIC_URL%的形式可用。html,例如:
      // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
      //在生产中，它将是一个空字符串，除非你指定“主页”
      //在包中。json '，在这种情况下，它将是该URL的路径名。
      //在开发中，这将是一个空字符串。
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      // T他给出了一些必要的上下文模块没有发现错误，例如
      //请求资源。
      new ModuleNotFoundPlugin(paths.appPath),
      // 使一些环境变量对JS代码可用，例如:
      //如果(process.env。NODE_ENV === 'production'){…}。见“。/ js”。
      //将NODE_ENV设置为production是绝对必要的
      //在生产构建期间。
      //否则会在非常慢的开发模式下编译React。
      new webpack.DefinePlugin(env.stringified),
      // 这是必要的发射热更新(目前只有CSS):
      isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
      // 如果你在一个路径上输错了大小写，我们就会使用Watcher
      //一个插件，当你尝试这样做的时候会打印一个错误。
      //参见https://github.com/facebook/create-react-app/issues/240
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      // 如果你需要一个丢失的模块，然后' npm安装'它，你仍然有
      //重新启动开发服务器，以便Webpack发现它。这个插件
      //使发现自动进行，这样您就不必重新启动。
      // See https://github.com/facebook/create-react-app/issues/186
      isEnvDevelopment &&
        new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      isEnvProduction &&
        new MiniCssExtractPlugin({
          // 选项类似于webpackOptions.output中的相同选项
          //两个选项都是可选的
          filename: "static/css/[name].[contenthash:8].css",
          chunkFilename: "static/css/[name].[contenthash:8].chunk.css"
        }),
      // 生成包含以下内容的资产清单文件:
      // -“files”键:将所有资产文件名映射到它们对应的文件
      //输出文件，这样工具就可以在不解析的情况下提取它
      // index . html”
      // -“entrypoints”键:包含在“index.html”中的文件数组，
      //如果需要，可以使用//重构HTML
      new ManifestPlugin({
        fileName: "asset-manifest.json",
        publicPath: publicPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(
            fileName => !fileName.endsWith(".map")
          );

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles
          };
        }
      }),
      // js是一个非常流行的库，它捆绑了大型本地文件
      //默认情况下取决于Webpack如何解释它的代码。这是一个实用的
      //要求用户选择导入特定地区的解决方案。
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      //如果你不使用Moment.js，你可以删除这个:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      // 生成一个服务工作者脚本，该脚本将进行预录并保持最新，
      //作为Webpack构建的一部分的HTML和资产。
      isEnvProduction &&
        new WorkboxWebpackPlugin.GenerateSW({
          clientsClaim: true,
          exclude: [/\.map$/, /asset-manifest\.json$/],
          importWorkboxFrom: "cdn",
          navigateFallback: publicUrl + "/index.html",
          navigateFallbackBlacklist: [
            // 排除以/_开头的url，因为它们很可能是一个API调用
            new RegExp("^/_"),
            // 排除最后一部分似乎是文件扩展名的url
            //因为它们可能是一种资源，而不是水疗路线。
            //包含“?”字符的url不会被列入黑名单，因为它们有可能被列入黑名单
            //带有查询参数的路由(例如，auth回调)。
            new RegExp("/[^/?]+\\.[^/]+$")
          ]
        }),
      // TypeScript type checking
      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          typescript: resolve.sync("typescript", {
            basedir: paths.appNodeModules
          }),
          async: isEnvDevelopment,
          useTypescriptIncrementalApi: true,
          checkSyntacticErrors: true,
          resolveModuleNameModule: process.versions.pnp
            ? `${__dirname}/pnpTs.js`
            : undefined,
          resolveTypeReferenceDirectiveModule: process.versions.pnp
            ? `${__dirname}/pnpTs.js`
            : undefined,
          tsconfig: paths.appTsConfig,
          reportFiles: [
            "**",
            "!**/__tests__/**",
            "!**/?(*.)(spec|test).*",
            "!**/src/setupProxy.*",
            "!**/src/setupTests.*"
          ],
          silent: true,
          // 在开发过程中直接在WebpackDevServerUtils中调用格式化程序
          formatter: isEnvProduction ? typescriptFormatter : undefined
        })
    ].filter(Boolean),
    // 一些库导入节点模块，但在浏览器中不使用它们。
    //告诉Webpack为它们提供空的模拟，以便导入它们。
    node: {
      module: "empty",
      dgram: "empty",
      dns: "mock",
      fs: "empty",
      http2: "empty",
      net: "empty",
      tls: "empty",
      child_process: "empty"
    },
    // 关闭性能处理，因为我们利用
    //我们自己通过FileSizeReporter得到的提示
    performance: false
  };
};
