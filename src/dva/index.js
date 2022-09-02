import React from "react";
import ReactDOM from "react-dom";

import { createBrowserHistory } from "history";
import { createStore, combineReducers, applyMiddleware } from "redux";
import { Provider, connect } from "react-redux";
import createSagaMiddleware from "redux-saga";
import * as sagaEffects from "redux-saga/effects";
import { NAMESPACE_SEP } from "./constant";
import { routerRedux } from "./router";
import Plugin, { filterHooks } from "./plugin";

export { connect };
const { routerMiddleware, connectRouter } = routerRedux;
export default function (opts = {}) {
  const history = opts.history || createBrowserHistory();
  let app = {
    _models: [],
    _router: null,
    model,
    router,
    start,
    use: null,
    _store: {},
    _history: history,
  };

  function model(m) {
    const prefixdModel = prefixNamespace(m);
    app._models.push(prefixdModel); //把model放到models数组里去
    return prefixdModel;
  }
  function router(router) {
    app._router = router; //定义路由
  }

  //这个对象是要传给combineReducers的,是用来合并的,每个属性都是字符串，而且代表合并状态的一个分状态属性
  let initialReducers = {
    //初始的reducer  connected-react-redux
    //当页面路径发生改变时，会向仓库派发动作，仓库状态会发生改变 router:{location,action}
    router: connectRouter(app._history),
  };
  let plugin = new Plugin();
  plugin.use(filterHooks(opts));
  app.use = plugin.use.bind(plugin);
  const onEffect = plugin.get("onEffect");
  function start(container) {
    for (const model of app._models) {
      initialReducers[model.namespace] = getReducer(model);
    }
    const rootReducer = createReducer();
    const sagas = getSagas(app, onEffect); //获取saga数组
    let sagaMiddleware = createSagaMiddleware();
    app._store = applyMiddleware(
      routerMiddleware(history),
      sagaMiddleware,
    )(createStore)(rootReducer);
    function runSubscription(subscriptions = {}) {
      for (let key in subscriptions) {
        const subscription = subscriptions[key];
        subscription({ history, dispatch: app._store.dispatch }, (error) => {
          // const onError = plugin.get('onError');
          // onError.forEach(fn => fn(error));
        });
      }
    }
    for (const model of app._models) {
      runSubscription(model.subscriptions);
    }

    function createReducer() {
      // const reducerEnhancer = plugin.get('onReducer');
      let extraReducers = plugin.get("extraReducers");
      // return reducerEnhancer(combineReducers({
      //     ...initialReducers,
      //     ...extraReducers
      // }));
      return combineReducers({ ...initialReducers, ...extraReducers });
    }
    sagas.forEach(sagaMiddleware.run); //run 就是启动saga执行
    ReactDOM.render(
      <Provider store={app._store}>{app._router({ app, history })}</Provider>,
      document.querySelector(container),
    );
  }
  return app;
}

function getReducer(model) {
  let { state: defultState = {}, reducers = {} } = model;
  return function (state = defultState, action) {
    const reducer = reducers[action.type];
    if (reducer) {
      return reducer(state, action);
    } else {
      return state;
    }
  };
}

function prefix(obj, namespace) {
  return Object.keys(obj).reduce((pre, key) => {
    const newKey = `${namespace}${NAMESPACE_SEP}${key}`;
    pre[newKey] = obj[key];
    return pre;
  }, {});
}

function prefixNamespace(model) {
  const { reducers, effects, namespace } = model || {};
  if (reducers) {
    model.reducers = prefix(reducers, namespace);
  }
  if (effects) {
    model.effects = prefix(effects, namespace);
  }
  return model;
}
//获取sagas数组
function getSagas(app, onEffect) {
  let sagas = [];
  for (const model of app._models) {
    //把effects对象变成一个saga
    sagas.push(function* (params) {
      for (const key in model.effects) {
        const watcher = getWatcher(key, model.effects[key], model, onEffect);
        const task = yield sagaEffects.fork(watcher); //sagaEffects.fork 可以使每个saga进行非阻塞执行,利用了child process spawn
        yield sagaEffects.fork(function* () {
          yield sagaEffects.take(`${model.namespace}/@@CANCEL_EFFECTS`);
          yield sagaEffects.cancel(task);
        });
      }
    });
  }
  return sagas;
}

function prefixType(type, model) {
  // effect action 取消namespace 前缀
  if (type.indexOf("/") === -1) {
    return `${model.namespace}${NAMESPACE_SEP}${type}`;
  } else {
    if (type.startsWith(model.namespace)) {
      console.error(
        `Warning: [sagaEffects.put] ${type} should not be prefixed with namespace ${model.namespace}`,
      );
    }
  }
  return type;
}

function getWatcher(key, effect, model, onEffect) {
  function put(action) {
    return sagaEffects.put({ ...action, type: prefixType(action.type, model) });
  }
  return function* () {
    if (onEffect) {
      for (const fn of onEffect) {
        effect = fn(effect, { ...sagaEffects, put }, model, key);
      }
    }
    yield sagaEffects.takeEvery(key, function* (...args) {
      yield effect(...args, { ...sagaEffects, put }); //重写put方法
    });
  };
}
