import React from "react";
import "./App.less";
import { BrowserRouter, Route, Link, Redirect } from "react-router-dom";
import {
  UseState,
  UseEffect,
  UseContext,
  UseReducer,
  UseMemo,
  UseRef,
  WaterMark
} from "./components";

const App = () => {
  WaterMark({ content: "baby张" });

  return (
    <BrowserRouter>
      {/**此处无关紧要 */}
      <div className="title">
        baby张的React Hook,10种hook Demo实例
        <p>
          Github地址：
          <a href="https://github.com/babybrotherzb" target="_blank">
            https://github.com/babybrotherzb
          </a>
        </p>
        <p>
          博客地址：
          <a href="https://blog.csdn.net/weixin_43648947" target="_blank">
            https://juejin.im/post/5f059b63f265da22d26b8aa1
          </a>
        </p>
        <p>
          掘金地址：
          <a
            href="https://juejin.im/user/5d90295cf265da5b5c08f32d/posts"
            target="_blank"
          >
            https://juejin.im/user/5d90295cf265da5b5c08f32d/posts
          </a>
        </p>
      </div>
      <ul className="router">
        <li>
          <Link to="/useState">useState </Link>
        </li>
        <li>
          <Link to="/useEffect">useEffect-useLayoutEffect </Link>
        </li>
        <li>
          <Link to="/useMemo">useMemo-useCallback </Link>
        </li>
        <li>
          <Link to="/useRef">useRef-useImperativeHandle </Link>
        </li>
        <li>
          <Link to="/useContext">useContext </Link>
        </li>
        <li>
          <Link to="/useReducer">useReducer </Link>
        </li>
      </ul>
      <div className="content">
        <Route path="/" exact render={() => <Redirect to="/useState" />} />
        <Route path="/useState" exact component={UseState} />
        <Route path="/useEffect" exact component={UseEffect} />
        <Route path="/useMemo" exact component={UseMemo} />
        <Route path="/useRef" exact component={UseRef} />
        <Route path="/useContext" exact component={UseContext} />
        <Route path="/useReducer" exact component={UseReducer} />
      </div>
    </BrowserRouter>
  );
};

export default App;
