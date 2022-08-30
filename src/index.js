import React from 'react';
import dva, { connect } from './dva';
import { routerRedux, Switch, Route, Link } from './dva/router';
import './style.css';
let { ConnectedRouter, push } = routerRedux;
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
  },
  subscriptions: {
    changeTitle({ history, dispatch }, done) {
      history.listen(({ pathname }) => {
        document.title = pathname;
      });
      done('我是subscriptions changeTitle changeTitle错误');
    }
  }
});

class TestError extends React.Component {

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
app.router(({ history, app }) => {
  return (
    <ConnectedRouter history={history}>
      <>
        <ul>
          <li><Link to="/">home</Link></li>
          <li><Link to="/counter">counter</Link></li>
        </ul>
        <Switch>
          <Route path="/" exact component={App} />
        </Switch>
      </>
    </ConnectedRouter>
  )
}
);

// 5. Start
app.start('#root');