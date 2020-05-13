import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  memo
} from "react";

const UseRef = () => {
  const [name, setname] = useState("baby张"); //这里useState绑定个input,关联一个状态name
  const refvalue = useRef(null); // 先创建一个空的useRef
  const testRef = useRef("test");

  function addRef() {
    refvalue.current.value = name; //点击按钮时候给这个ref赋值
    // refvalue.current = name  //这样写时，即使ref没有绑定在dom上，值依然会存在创建的ref上，并且可以使用它
    console.log(refvalue.current.value);
    console.log("子组件input的value值：", testRef.current.value);
    testRef.current.focus();
  }
  return (
    <div>
      <h3>UseRef</h3>
      <input
        defaultValue={name}
        onChange={e => {
          setname(e.target.value);
        }}
      />
      <button onClick={addRef}>给下面插入名字</button>
      <p>给我个UseRef名字：</p>
      <input ref={refvalue} />
      <div style={{ border: "1px solid" }}>
        <Child ref={testRef} />
      </div>
    </div>
  );
};

const TestChild = (props, ref) => {
  const childref = useRef();
  useImperativeHandle(ref, () =>
    //第一个参数，要暴露给对应的父节点，第二个参数要暴露的东西
    ({
      value: childref.current.value,
      focus: () => childref.current.focus()
    })
  );
  return <input type="text" placeholder="useImperativeHandle" ref={childref} />;
};
const Child = memo(forwardRef(TestChild));

export default UseRef;
