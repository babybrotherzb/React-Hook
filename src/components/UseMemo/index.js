import React, { useState, useMemo ,useCallback } from 'react';
//用来优化子组件的渲染问题，或者监听子组件状态变化来处理事件，这一点在以前是很难做到的，
//因为shouldComponentUpdate 里能监听到是否变化，但没法控制其他的外部方法，只能返回true和false,
//而componentDidUpdate只能在更新后执行，所以想在渲染之前做些事情就不好搞了。

const UseMemo = () => {
	//useState 设置名字和年龄，并用2两个按钮改变他们，传给Child组件
	const [ name, setname ] = useState('baby张');
	const [ age, setage ] = useState(18);
	return (
		<div>
			<h3>UseMemo</h3>
			<button
				onClick={() => {
					setname('baby张' + new Date().getTime());
				}}
			>
				改名字
			</button>
			<button
				onClick={() => {
					setage('年龄' + new Date().getTime());
				}}
			>
				改年龄
			</button>
			<p>
				UseMemo {name}：{age}
			</p>
			<Child age={age} name={name}>
				{name}的children
			</Child>
		</div>
	);
};

const Child = ({ age, name, children }) => {
	//在不用useMemo做处理的时候，只要父组件状态改变了，子组件都会渲染一次，用了useMemo可以监听某个状态name，当name变化时候执行useMemo里第一个函数
	console.log(age, name, children, '11111111');
	function namechange() {
		console.log(age, name, children, '22222222');
		return name + 'change';
    }
    {/** react 官网虽说useCallback与useMemo的功能差不多，但不知道版本问题还怎么回是，这个方法目前还不能用
    const memoizedCallback = useCallback(
        () => {
            console.log('useCallback')
        },
        [name],
      );
    console.log(memoizedCallback,'memoizedCallback')
     */}

	//useMemo有两个参数，和useEffect一样，第一个参数是函数，第二个参数是个数组，用来监听某个状态的变化
    const changedname = useMemo(() => namechange(), [ name ]);
	return (
		<div style={{ border: '1px solid' }}>
			<p>children：{children}</p>
			<p>name：{name}</p>
			<p>changed：{changedname}</p>
			<p>age：{age}</p>
		</div>
	);
};

export default UseMemo;
