"use strict";

// 这是一个自定义Jest转换器，将样式导入转换为空对象。
// http://facebook.github.io/jest/docs/en/webpack.html

module.exports = {
  process() {
    return "module.exports = {};";
  },
  getCacheKey() {
    // 输出总是相同的。
    return "cssTransform";
  }
};
