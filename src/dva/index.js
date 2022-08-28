import React from 'react';
import ReactDom from 'react-dom';
import { createRoot } from 'react-dom/client';

import { createHashHistory } from 'history';
import { createStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';

export {connect}
export default function (opts = {}) {
  let history = opts.history || createHashHistory();

  let app = {
    _models: [],
    _router: null,
    model,
    router,
    start,
    _store: {},
  };

  function model(m) {
    app._models.push(m); //把model放到models数组里去
  }
  function router(router) {
    app._router = router; //定义路由
  }

  function start(container) {
    const reducers = getReducers(app);
    app._store = createStore(reducers);
    const root = createRoot(document.querySelector(container));
    root.render(
      <Provider store={app._store}>{app._router()}</Provider>,
    );
  }
  return app
}

function getReducers(app) {
  let reducers = {}; //此对象会用来进行合并,传给combineReducers

  for (const model of app._models) {
    reducers[model.namespace] = function (state=model.state, action) {

      const model_reducer = model.reducers
      const reducer = model_reducer[action.type]
      console.log(reducer,action);
      if (reducer) {
      console.log(44);

        return reducer(state, action)
      } else {
        return state
      }
    };
  }

  return combineReducers(reducers);
}
