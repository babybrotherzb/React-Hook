import React, { useState } from 'react';

//通常的class写法,改变状态

// class UseState extends React.Component {
//   constructor(props){
//     super(props)
//     this.state = {
//       hook:'react hook 是真的好用啊'
//     }
//   }
//   changehook = () => {
//     this.setState({
//       hook:'我改变了react hook 的值'
//     })
//   }
//   render () {
//     const { hook } = this.state
//     return(
//          <header className="UseState-header">
//           {hook}
//           <button onClick={this.changehook}>
//             改变hook
//           </button>
//         </header>
//       )
//   }
// }
// export default UseState

//箭头函数的函数写法,改变状态
const UseState = (props) => {
	const [ hook, sethook ] = useState('react hook 是真的好用啊');
	return (
    <header className="UseState-header">
      <h3>UseState</h3>
			{hook}
			<button onClick={() => sethook('我改变了react hook 的值')}>改变hook</button>
		</header>
	);
};
export default UseState;

//函数式写法,改变状态

// function UseState() {
//   const [hook, sethook] = useState("react hook 是真的好用啊");
//    return (
//      <header className="UseState-header">
//        {hook}
//        <button onClick={() => sethook("我改变了react hook 的值")}>
//          改变hook
//        </button>
//      </header>
//    );
//  }
//  export default UseState
