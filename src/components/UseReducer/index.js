import React, { useState, useReducer, useContext, createContext } from 'react';

//初始化stroe的类型、初始化值、创建reducer
const ADD_COUNTER = 'ADD_COUNTER';
const initReducer = {
	count: 0
};
//正常的reducer编写
function reducer(state, action) {
	switch (action.type) {
		case ADD_COUNTER:
			return { ...state, count: state.count + 1 };
		default:
			return state;
	}
}

const CountContext = createContext();
//上面这一段，初始化state和reducer创建context,可以单独写一个文件，这里为了方便理解，放一个文件里写了

const UseReducer = () => {
	const [ name, setname ] = useState('baby张');
	//父组件里使用useReducer,第一个参数是reducer函数，第二个参数是state，返回的是state和dispash
	const [ state, dispatch ] = useReducer(reducer, initReducer);
	return (
		<div>
			UseReducer
			{/* 在这里通过context，讲reducer和state传递给子组件*/}
			<CountContext.Provider value={{ state, dispatch, name, setname }}>
				<Child />
			</CountContext.Provider>
		</div>
	);
};

const Child = () => {
	//跟正常的接受context一样，接受父组件的值，通过事件等方式触发reducer，实现redux效果
	const { state, dispatch, name, setname } = useContext(CountContext);
	function handleclick(count) {
		dispatch({ type: ADD_COUNTER, count: 17 });
		setname(count % 2 == 0 ? 'babybrother' : 'baby张');
	}
	return (
		<div>
			<p>
				{name}今年{state.count}岁
			</p>
			<button onClick={() => handleclick(state.count)}>长大了</button>
		</div>
	);
};

export default UseReducer;
