import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createStore } from '../src/store';

describe('TeenyStore', () => {
  interface User {
    name: string;
    age: number;
    hobby: string;
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('gets the state from the store', () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' });
    const state = store.getState();
    expect(state.name).toBe('Pete');
    expect(state.age).toBe(25);
    expect(state.hobby).toBe('writing');
  });

  test('updates the state in the store', () => {
    const store = createStore({ name: 'Pete' });
    const state = store.setState({ name: 'Jackson' });
    expect(state.name).toBe('Jackson');
  });

  test('uses custom action functions to update the state', () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      actions: {
        incrementAge: (state, setState) => {
          setState({ ...state, age: state.age + 1 });
        },
        setHobby: (state, setState, newHobby: string) => {
          return setState({ ...state, hobby: newHobby });
        },
      },
    });

    store.actions.incrementAge();
    expect(store.getState().age).toBe(26);

    const state = store.actions.setHobby('coding');
    expect(state?.hobby).toBe('coding');
  });

  test("triggers effects and recomputation when 'setState' is called", async () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' });

    const effectFn = vi.fn();
    store.useEffect(effectFn, () => [store.getState().hobby]);
    const { computed: greeting } = store.compute(
      'greeting',
      () => `Hello ${store.getState().name}`,
      () => [store.getState().name],
    );

    expect(effectFn).toHaveBeenCalledOnce();
    expect(greeting).toBe('Hello Pete');
    expect(store.computed.greeting).toBe('Hello Pete');

    store.setState({ name: 'Jackson', age: 26, hobby: 'coding' });
    await store.nextTick();
    expect(effectFn).toHaveBeenCalledTimes(2);
    expect(store.computed.greeting).toBe('Hello Jackson');
  });

  test('allows persisting the state in the local storage or the session storage', () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      persistence: {
        storage: 'localStorage',
        key: 'user',
      },
    });

    const userJSON = localStorage.getItem('user');
    assertUserDataFromJSON(userJSON, store.getState());
  });

  test('loads the state from the persistent storage on store initialization', () => {
    const persistedUser: User = { name: 'Jackson', age: 26, hobby: 'coding' };
    localStorage.setItem('user', JSON.stringify(persistedUser));

    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      persistence: {
        storage: 'localStorage',
        key: 'user',
      },
    });

    expect(store.getState().name).toBe(persistedUser.name);
    expect(store.getState().age).toBe(persistedUser.age);
    expect(store.getState().hobby).toBe(persistedUser.hobby);
  });

  test("updates the state in the persistent storage when 'setState' is called", async () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      persistence: {
        storage: 'sessionStorage',
        key: 'user',
      },
    });

    store.setState({ ...store.getState(), hobby: 'coding' });
    await store.nextTick();
    const userJSON = sessionStorage.getItem('user');
    assertUserDataFromJSON(userJSON, store.getState());
  });

  test('schedules persistent storage updates', async () => {
    const user: User = { name: 'Pete', age: 25, hobby: 'writing' };
    const store = createStore(user, {
      persistence: {
        storage: 'localStorage',
        key: 'user',
      },
    });

    store.setState({ ...store.getState(), hobby: 'coding' });
    let userJSON = localStorage.getItem('user');
    assertUserDataFromJSON(userJSON, user);

    await store.nextTick();
    userJSON = localStorage.getItem('user');
    assertUserDataFromJSON(userJSON, store.getState());
  });

  test('batches persistent storage updates', async () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      persistence: {
        storage: 'sessionStorage',
        key: 'user',
      },
    });

    const spySessionStorage = vi.spyOn(sessionStorage, 'setItem');

    store.setState({ ...store.getState(), name: 'Jackson' });
    store.setState({ ...store.getState(), age: 26 });
    store.setState({ ...store.getState(), hobby: 'coding' });

    await store.nextTick();
    expect(spySessionStorage).toHaveBeenCalledOnce();
    const userJSON = sessionStorage.getItem('user');
    assertUserDataFromJSON(userJSON, store.getState());
  });

  const assertUserDataFromJSON = (jsonString: string | null, user: User) => {
    expect(jsonString).not.toBeNull();
    const userFromJSON = JSON.parse(jsonString!) as User;
    expect(userFromJSON.name).toBe(user.name);
    expect(userFromJSON.age).toBe(user.age);
    expect(userFromJSON.hobby).toBe(user.hobby);
  };
});