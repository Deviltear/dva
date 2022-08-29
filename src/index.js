import React from 'react';
import dva, { connect } from './dva';
import './style.css';

const delay = (ms = 1000) => new Promise(reslove => setTimeout(reslove, ms))
// 1. Initialize
const app = dva();


// 2. Model
app.model({
  namespace: 'count',
  state: { number: 0 },
  reducers: {
    add({ number }) {
      return { number: number + 1 };
    },
    minus(state) {
      return { number: state.number - 1 };
    }
  },
  effects: {
    *asyncAdd(action, { put }) {
      yield delay(500)
      yield put({ type: 'add' })
    }
  }
});

class TestError extends React.Component {
  componentDidCatch(e) {
    alert(e.message);
  }

  render() {
    return <div>TestError</div>
  }
}

// 3. View
const App = connect(({ count }) => ({
  number: count.number
}))(function (props) {
  console.log(props);
  return (
    <div>
      <TestError />
      <h2>{props.number}</h2>
      <button key="add" onClick={() => { props.dispatch({ type: 'count/add' }) }}>+</button>
      <button key="minus" onClick={() => { props.dispatch({ type: 'count/minus' }) }}>-</button>
      <button key="asyncAdd" onClick={() => { props.dispatch({ type: 'count/asyncAdd' }) }}>asycn +</button>

    </div>
  );
});

// 4. Router
app.router(() => <App />);

// 5. Start
app.start('#root');