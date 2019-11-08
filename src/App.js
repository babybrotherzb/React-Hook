import React from 'react';
import './App.css';
import { BrowserRouter, Route, Link, Redirect } from 'react-router-dom';
import { UseState, UseEffect, UseContext, UseReducer, UseMemo, UseRef } from './components';

const App = () => {
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
						https://blog.csdn.net/weixin_43648947
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
