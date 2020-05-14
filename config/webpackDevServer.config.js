"use strict";

const errorOverlayMiddleware = require("react-dev-utils/errorOverlayMiddleware");
const evalSourceMapMiddleware = require("react-dev-utils/evalSourceMapMiddleware");
const noopServiceWorkerMiddleware = require("react-dev-utils/noopServiceWorkerMiddleware");
const ignoredFiles = require("react-dev-utils/ignoredFiles");
const paths = require("./paths");
const fs = require("fs");

const protocol = process.env.HTTPS === "true" ? "https" : "http";
const host = process.env.HOST || "0.0.0.0";

module.exports = function(proxy, allowedHost) {
  return {
    //WebpackDevServer 2.4.3引入了一个防止远程访问的安全补丁
    //网站可能通过DNS重绑定访问本地内容:
    // https://github.com/webpack/webpack-dev-server/issues/887
    // https://medium.com/webpack/webpack - dev -服务器- - 1489 d950874a中间件——安全问题
    //然而，它提出了几个现有的用例，例如云中的开发
    //开发中的环境或子域明显更复杂:
    // https://github.com/facebook/create-react-app/issues/2271
    // https://github.com/facebook/create-react-app/issues/2233
    //我们正在研究更好的解决办法，现在我们将采取行动
    //妥协。因为我们的WDS配置只服务于“public”中的文件
    //文件夹我们不认为访问它们是一个漏洞。然而,如果你
    //使用“代理”功能，它变得更危险，因为它可以暴露
    // Django和Rails等后台的远程代码执行漏洞。
    //因此，我们将禁用主机检查正常，但启用它，如果你有
    //指定“代理”设置。最后，我们允许您重写它
    //真正知道如何处理一个特殊的环境变量。
    disableHostCheck:
      !proxy || process.env.DANGEROUSLY_DISABLE_HOST_CHECK === "true",
    // 启用生成文件的gzip压缩。
    compress: true,
    // 封住WebpackDevServer自己的日志，因为它们通常没什么用。
    //它仍然会显示编译警告和错误。
    clientLogLevel: "none",
    //默认情况下，WebpackDevServer从当前目录提供物理文件
    //除了它从内存中提供的所有虚拟构建产品之外。
    //这是令人困惑的，因为这些文件不会自动可用
    //生产构建文件夹，除非我们复制它们。然而，复制整个
    //项目目录是危险的，因为我们可能会暴露敏感文件。
    //相反，我们建立了一个约定，即只在“public”目录中保存文件
    //得到服务。我们的构建脚本将把“public”复制到“build”文件夹中。
    //在“索引。html '，你可以得到' public '文件夹的URL与%PUBLIC_URL%:
    // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
    //在JavaScript代码中，你可以通过“process.env.PUBLIC_URL”访问它。
    //注意，我们只建议使用“public”文件夹作为转义出口
    //像“favicon”这样的文件。图标”、“清单。json '和库
    //由于某些原因，在通过Webpack导入时损坏。如果你想的话
    //使用一张图片，把它放在“src”中，然后从JavaScript“导入”它。
    contentBase: paths.appPublic,
    //默认情况下，来自“contentBase”的文件不会触发页面重载。
    watchContentBase: true,
    // 启用热重新加载服务器。它将提供/sockjs-node/ endpoint
    //用于WebpackDevServer客户端，以便它可以了解文件的时间
    //更新。WebpackDevServer客户端包含作为入口点
    //在Webpack开发配置中。注意，只有更改
    //当前正在热重载CSS。JS的变化将刷新浏览器。
    hot: true,
    // 告诉WebpackDevServer使用相同的“根”路径是很重要的
    //就像我们在配置中指定的那样。在开发过程中，我们始终服务于/。
    publicPath: "/",
    // WebpackDevServer在默认情况下是有噪声的，所以我们发出自定义消息
    //通过使用“compiler.hook[…]”监听编译器事件。利用上面的电话。
    quiet: true,
    // 据报道，这避免了某些系统的CPU过载。
    // https://github.com/facebook/create-react-app/issues/293
    // src/node_modules不会被忽略，以支持绝对导入
    // https://github.com/facebook/create-react-app/issues/1065
    watchOptions: {
      ignored: ignoredFiles(paths.appSrc)
    },
    // 如果HTTPS环境变量设置为“true”，则启用HTTPS
    https: protocol === "https",
    host,
    overlay: false,
    historyApiFallback: {
      // 带点的路径仍然应该使用历史回退
      // See https://github.com/facebook/create-react-app/issues/387.
      disableDotRule: true
    },
    public: allowedHost,
    proxy,
    before(app, server) {
      if (fs.existsSync(paths.proxySetup)) {
        // 由于代理原因，此注册用户提供的中间件
        require(paths.proxySetup)(app);
      }

      // 这允许我们从webpack获取源内容以覆盖错误
      app.use(evalSourceMapMiddleware(server));
      //这允许我们从运行时错误覆盖打开文件。
      app.use(errorOverlayMiddleware());

      // 这个服务工作者文件实际上是一个“no-op”，它将重置任何
      //以前的服务工作者注册了相同的主机:端口组合。
      //我们在开发过程中这样做是为了避免碰到生产缓存
      //它使用相同的主机和端口。
      // https://github.com/facebook/create-react-app/issues/2272 # issuecomment - 302832432
      app.use(noopServiceWorkerMiddleware());
    }
  };
};
