import React from 'react';
import dva, { connect } from './dva';
import { routerRedux, Switch, Route, Link } from './dva/router';
import createLoading from './dva/dva-loading';
import dynamic from './dva/dynamic';
import logger from './dva/redux-logger';

import {sleep} from './utils'
import './style.css';
let { ConnectedRouter, push } = routerRedux;
// 1. Initialize
const app = dva();
app.use(createLoading())
app.use({
  onAction: logger
});
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
      yield sleep(500)
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
    return <div>这是首页</div>
  }
}

// 3. View
const App = connect(({count,loading}) => ({
  number: count.number,
  loading:loading.models.count

}))(function (props) {
  const {loading,number,dispatch} =props||{}
  return (
    <div>
      <h2>{loading ? <span>执行中...</span> : number}</h2>
      <button key="add" onClick={() => { dispatch({ type: 'count/add' }) }}>+</button>
      <button key="minus" onClick={() => { dispatch({ type: 'count/minus' }) }}>-</button>
      <button key="asyncAdd" disabled={loading} onClick={() => { dispatch({ type: 'count/asyncAdd' }) }}>asycn +</button>

    </div>
  );
});
const Home = connect(({ count }) => ({
  number: count.number
}))(function (props) {
  return (
    <div>
      <TestError />
    </div>
  );
});

const UsersPage = dynamic({
  app,
  models: () => [import('./models/users')],
  component: () => import('./pages/UserPage')
});
// 4. Router
app.router(({ history, app }) => {
  return (
    <ConnectedRouter history={history}>
      <>
        <ul>
          <li><Link to="/home">home</Link></li>
          <li><Link to="/counter">counter</Link></li>
          <li><Link to="/users">users</Link></li>
        </ul>
        <Switch>
          <Route path="/counter" exact component={App} />
          <Route path="/home" exact component={Home} />
          <Route path="/users"  component={UsersPage} />

        </Switch>
      </>
    </ConnectedRouter>
  )
}
);

// 5. Start
app.start('#root');