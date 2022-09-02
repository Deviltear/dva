const SHOW = "@@DVA_LOADING/SHOW"; //当执行saga之前派发的动作
const HIDE = "@@DVA_LOADING/HIDE"; //当saga执行结束之后派发的动作
const NAMESPACE = "loading"; //命名空间 { }

export default function createLoading(options) {
  const initialState = {
    models: {},
    global: false,
    effects: {},
  };

  const extraReducers = {
    [NAMESPACE](state = initialState, { type, payload }) {
      const { namespace, actionType } = payload || {};
      const { models: _models, effects: _effects } = state || {};
      switch (type) {
        case SHOW:
          return {
            ...state,
            global: true,
            models: {
              ..._models,
              [namespace]: true,
            },
            effects: {
              ..._effects,
              [actionType]: true,
            },
          };
        case HIDE:
          let effects = { ..._effects, [actionType]: false };
          let models = {
            ..._models,
            [namespace]: Object.keys(effects).some((actionType) => {
              const _namespace = actionType.split("/")[0]; //取出当前动作的namespace
              if (_namespace !== namespace) {
                return false;
              }
              return effects[actionType];
            }),
          };
          const global = Object.keys(effects).some(
            (namespace) => models[namespace],
          );
          return {
            effects,
            global,
            models,
          };

        default:
          return state;
      }
    },
  };

  function onEffect(effect, { put }, model, actionType) {
    const { namespace } = model;
    return function* (...args) {
      try {
        yield put({ type: SHOW, payload: { namespace, actionType } });
        yield effect(...args);
      } finally {
        yield put({ type: HIDE, payload: { namespace, actionType } });
      }
    };
  }
  return {
    onEffect,
    extraReducers,
  };
}
