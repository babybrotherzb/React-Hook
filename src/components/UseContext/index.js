import React, { useState, useContext, createContext } from 'react';

const ContextName = createContext();
//这里为了方便写博客，爷爷孙子组件都写在一个文件里，正常需要在爷爷组件和孙子组件挨个引入创建的Context

const UseContext = () => {
	//这里useState创建一个状态，并按钮控制变化
	const [ name, setname ] = useState('baby张');
	return (
		<div>
			<h3>UseContext 爷爷</h3>
			<button
				onClick={() => {
					setname('baby张' + new Date().getTime());
				}}
			>
				改变名字
			</button>
			{/**这里跟context用法一样，需要provider向子组件传递value值，value不一定是一个参数 */}
			<ContextName.Provider value={{ name: name, age: 18 }}>
				{/**需要用到变量的子组件一定要写在provider中间，才能实现共享 */}
				<Child />
			</ContextName.Provider>
		</div>
	);
};

const Child = () => {
	//创建一个儿子组件，里面引入孙子组件
	return (
		<div style={{ border: '1px solid' }}>
			Child 儿子
			<ChildChild />
		</div>
	);
};

const ChildChild = () => {
	//创建孙子组件，接受爷爷组件的状态，用useContext,获取到爷爷组件创建的ContextName的value值
	let childname = useContext(ContextName);
	return (
		<div style={{ border: '1px solid' }}>
			ChildChild 孙子
			<p>
				{childname.name}:{childname.age}
			</p>
		</div>
	);
};

export default UseContext;
