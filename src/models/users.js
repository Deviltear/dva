import { sleep } from '../utils';
export default {
    namespace: 'users',
    state: {
        userlist: [
            { id: 1, name: "张三" },
            { id: 2, name: "李四" }
        ]
    },
    reducers: {
        add(state, action) {
          
            state.userlist.push({ id: 3, name: action.payload });
        }
    },
    effects: {
        *asyncAdd(action, { put, call }) {
            yield call(sleep, 1000);
            yield put({ type: 'add', payload: '孙悟空' });
        }
    },
    subscriptions: {
        something() {
            console.log('我是users something');
        }
    }
}