const projectName = "react-hook";
module.exports = {
  name: "react-hook",
  app_name: "react-hook",
  projectName: projectName,
  is_socket: true, // 是否启用scoket
  server: {
    port: 3250
  },
  //   hotServer: {
  //     port: 8999
  //   },
  socket: {
    port: 3025
  },
  proxy: {
    port: 9250
  },
  env: [
    {
      name: "release",
      title: "测试环境"
    },
    {
      name: "production",
      title: "正式环境"
    }
  ],
  qiniu: {
    // 七牛上传地址
    release: "http://qiniup.com",
    production: "https://upload.com"
  },
  domain: {
    // 服务器地址
    release: "https://react-hook-q1.com/",
    production: "https://react-hook.com/"
  },
  apiUrl: {
    global: "/api/v1/global",
    staticToken: "/api/v1/qiniu/static_token"
  }
};
