const hooks = [
  "onEffect", // enhance effect
  "extraReducers", //add extra reducers
];

export function filterHooks(option = {}) {
  return Object.keys(option).reduce((pre, cur) => {
    if (hooks.includes(cur)) {
      pre[cur] = option[cur];
    }
    return pre;
  }, {});
}

export default class Plugin {
  constructor() {
    this.hooks = hooks.reduce((pre, cur) => {
      pre[cur] = [];
      return pre;
    }, {});
  }
  //插件就是一个对象，它的属性就是钩子函数
  //use接收钩子函数，然后缓存在当前实例 hooks属性上
  use(plugin) {
    const { hooks } = this;
    for (const key in plugin) {
      if (Object.hasOwnProperty.call(plugin, key)) {
        hooks[key].push(plugin[key]);
      }
    }
  }

  get(key) {
    const { hooks } = this;
    if (key === "extraReducers") {
      return getExtraReducers(hooks[key]);
    } else {
      return hooks[key];
    }
  }
}

function getExtraReducers(hook) {
  let obj = {};
  for (const reduceObj of hook) {
    obj = { ...obj, ...reduceObj };
  }
  return obj;
}
