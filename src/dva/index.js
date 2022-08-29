import React from 'react';
import { createRoot } from 'react-dom/client';

import { createHashHistory } from 'history';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import createSagaMiddleware from 'redux-saga'
import * as sagaEffects from 'redux-saga/effects';
import { NAMESPACE_SEP } from './constant';

export { connect }
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
    const prefixdModel = prefixNamespace(m)
    app._models.push(prefixdModel); //把model放到models数组里去
  }
  function router(router) {
    app._router = router; //定义路由
  }

  function start(container) {
    const reducers = getReducers(app);
    const sagas = getSagas(app)//获取saga数组
    let sagaMiddleware = createSagaMiddleware()
    app._store = applyMiddleware(sagaMiddleware)(createStore)(reducers);
    sagas.forEach(sagaMiddleware.run);//run 就是启动saga执行
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
    reducers[model.namespace] = function (state = model.state || {}, action) {
      const model_reducers = model.reducers || {}
      const reducer = model_reducers[action.type]
      if (reducer) {
        return reducer(state, action)
      } else {
        return state
      }
    };
  }

  return combineReducers(reducers);
}

function prefix(obj, namespace) {
  return Object.keys(obj).reduce((pre, key) => {
    const newKey = `${namespace}${NAMESPACE_SEP}${key}`
    pre[newKey] = obj[key]
    return pre
  }, {})
}

function prefixNamespace(model) {
  const { reducers, effects, namespace } = model || {}
  if (reducers) {
    model.reducers = prefix(reducers, namespace)
  }
  if (effects) {
    model.effects = prefix(effects, namespace)
  }
  return model
}
//获取sagas数组
function getSagas(app) {
  let sagas = []
  for (const model of app._models) {
    //把effects对象变成一个saga
    sagas.push(function* (params) {
      for (const key in model.effects) {
        const watcher = getWatcher(key, model.effects[key], model)
        yield sagaEffects.fork(watcher) //sagaEffects.fork 可以使每个saga进行非阻塞执行,利用了child process spawn
      }
    })
  }
  return sagas
}

function prefixType(type, model) { // effect action 取消namespace 前缀
  if (type.indexOf('/') === -1) {
    return `${model.namespace}${NAMESPACE_SEP}${type}`;
  } else {
    if (type.startsWith(model.namespace)) {
      console.error(`Warning: [sagaEffects.put] ${type} should not be prefixed with namespace ${model.namespace}`);
    }
  }
  return type;
}

function getWatcher(key, effect, model) {
  function put(action) {
    return sagaEffects.put({ ...action, type: prefixType(action.type, model) });
  }
  return function* () {
    yield sagaEffects.takeEvery(key, function* (...args) {
      yield effect(...args, { ...sagaEffects, put })//重写put方法

    })

  }
}