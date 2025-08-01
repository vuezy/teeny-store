import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createStore } from '../src/store';

interface User {
  name: string;
  age: number;
  hobby: string;
}

const setStorageItem = (storage: 'localStorage' | 'sessionStorage', key: string, user: User) => {
  window[storage].setItem(key, JSON.stringify(user));
  return user;
};

const assertLocalStorageItemMatchesUserData = (key: string, user: User) => {
  const userJSON = localStorage.getItem(key);
  assertJSONMatchesUserData(userJSON, user);
};

const assertSessionStorageItemMatchesUserData = (key: string, user: User) => {
  const userJSON = sessionStorage.getItem(key);
  assertJSONMatchesUserData(userJSON, user);
};

const assertJSONMatchesUserData = (jsonString: string | null, user: User) => {
  expect(jsonString).not.toBeNull();
  const userFromJSON = JSON.parse(jsonString!) as User;
  expect(userFromJSON).toEqual(user);
};

describe('TeenyStore', () => {
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

  test('triggers effects and recomputation in the order they are defined', async () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' });
    const calls: string[] = [];

    store.compute('result1', () => {
      calls.push('computation1');
    }, () => [store.getState()]);

    store.useEffect(() => {
      calls.push('effect');
    });

    store.compute('result2', () => {
      calls.push('computation2');
    }, () => [store.getState()]);

    calls.length = 0;
    store.setState({ ...store.getState() });
    await store.nextTick();
    expect(calls).toEqual(['computation1', 'effect', 'computation2']);
  });

  test('allows persisting the state to the local storage or the session storage', () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      persistence: {
        storage: 'localStorage',
        key: 'user',
      },
    });

    assertLocalStorageItemMatchesUserData('user', store.getState());
  });

  test('loads the state from the persistent storage on store initialization', () => {
    const persistedUser = setStorageItem('localStorage', 'user', { name: 'Jackson', age: 26, hobby: 'coding' });

    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      persistence: {
        storage: 'localStorage',
        key: 'user',
      },
    });

    expect(store.getState()).toEqual(persistedUser);
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
    assertSessionStorageItemMatchesUserData('user', store.getState());
  });

  test('schedules the persistent storage update', async () => {
    const initialUser: User = { name: 'Pete', age: 25, hobby: 'writing' };
    const store = createStore(initialUser, {
      persistence: {
        storage: 'localStorage',
        key: 'user',
      },
    });

    store.setState({ ...store.getState(), hobby: 'coding' });
    assertLocalStorageItemMatchesUserData('user', initialUser);

    await store.nextTick();
    assertLocalStorageItemMatchesUserData('user', store.getState());
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
    assertSessionStorageItemMatchesUserData('user', store.getState());
  });

  test('allows configuring persistence after store initialization', async () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' });

    store.persist({ storage: 'localStorage', key: 'user' });
    assertLocalStorageItemMatchesUserData('user', store.getState());

    store.setState({ name: 'Jackson', age: 26, hobby: 'coding' });
    await store.nextTick();
    assertLocalStorageItemMatchesUserData('user', store.getState());
  });

  test("clears the previous persistent storage when calling the 'persist' method with the 'clearPrev' option enabled", () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      persistence: {
        storage: 'localStorage',
        key: 'user',
      }
    });

    assertLocalStorageItemMatchesUserData('user', store.getState());

    store.persist({ storage: 'localStorage', key: 'person', clearPrev: true });
    expect(localStorage.getItem('user')).toBeNull();
    assertLocalStorageItemMatchesUserData('person', store.getState());
  });

  test('clears the persistent storage and stops saving future state changes', async () => {
    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      persistence: {
        storage: 'localStorage',
        key: 'user',
      }
    });

    assertLocalStorageItemMatchesUserData('user', store.getState());
    store.dropPersistence();
    expect(localStorage.getItem('user')).toBeNull();

    store.setState({ name: 'Jackson', age: 26, hobby: 'coding' });
    await store.nextTick();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('allows loading the state from the persistent storage after store initialization', () => {
    const persistedUser = setStorageItem('sessionStorage', 'user', { name: 'Jackson', age: 26, hobby: 'coding' });

    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' });

    store.loadFromPersistence({ storage: 'sessionStorage', key: 'user' });
    expect(store.getState()).toEqual(persistedUser);
  });

  test('does not change the persistent storage that is used when loading the state from another one', async () => {
    setStorageItem('sessionStorage', 'user', { name: 'Jackson', age: 26, hobby: 'coding' });

    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      persistence: {
        storage: 'localStorage',
        key: 'user',
      },
    });

    store.loadFromPersistence({ storage: 'sessionStorage', key: 'user' });
    await store.nextTick();
    assertLocalStorageItemMatchesUserData('user', store.getState());

    store.setState({ ...store.getState(), name: 'Diana' });
    await store.nextTick();
    assertLocalStorageItemMatchesUserData('user', store.getState());
  });

  test("triggers effects, recomputation, and persistent storage update when 'loadFromPersistence' is called", async () => {
    setStorageItem('localStorage', 'person', { name: 'Jackson', age: 26, hobby: 'coding' });

    const store = createStore({ name: 'Pete', age: 25, hobby: 'writing' }, {
      persistence: {
        storage: 'localStorage',
        key: 'user',
      },
    });
    
    const effectFn = vi.fn();
    store.useEffect(effectFn, () => [store.getState().hobby], { immediate: false });
    store.compute(
      'greeting',
      () => `Hello ${store.getState().name}`,
      () => [store.getState().name],
    );

    store.loadFromPersistence({ storage: 'localStorage', key: 'person' });
    await store.nextTick();
    expect(effectFn).toHaveBeenCalledOnce();
    expect(store.computed.greeting).toBe('Hello Jackson');
    assertLocalStorageItemMatchesUserData('user', store.getState());
  });
});