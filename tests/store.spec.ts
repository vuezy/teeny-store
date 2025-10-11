import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from '../src/store';
import { PersistenceOptions } from '../src/persistence';

interface User {
  name: string;
  age: number;
  hobby: string;
}

const setStorageItem = (storage: PersistenceOptions['storage'], key: string, user: User) => {
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
  it('stores the state', () => {
    const user = { name: 'Alice', age: 25, hobby: 'writing' };

    const store = createStore(user);

    expect(store.getState()).toEqual(user);
  });

  it('allows updating the state in the store', () => {
    const user = { name: 'Alice', age: 25, hobby: 'writing' };

    const store = createStore(user);
    store.setState((state) => ({ ...state, hobby: 'coding' }));

    expect(store.getState()).toEqual({ ...user, hobby: 'coding' });
  });

  it('allows defining custom action functions to update the state', () => {
    const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' }, {
      actions: {
        incrementAge: (state, setState) => {
          setState(() => ({ ...state, age: state.age + 1 }));
        },
        setHobby: (state, setState, newHobby: string) => {
          return setState(() => ({ ...state, hobby: newHobby }));
        },
      },
    });

    store.actions.incrementAge();
    expect(store.getState().age).toBe(26);

    const newState = store.actions.setHobby('coding');
    expect(newState?.hobby).toBe('coding');
  });

  it('always calls custom action functions with the latest state', () => {
    const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' }, {
      actions: {
        incrementAge: (state, setState) => {
          return setState(() => ({ ...state, age: state.age + 1 }));
        },
      },
    });

    let newState = store.actions.incrementAge();
    expect(newState?.age).toBe(26);

    newState = store.actions.incrementAge();
    expect(newState?.age).toBe(27);
  });

  it('triggers side effects after updating the state', () => {
    const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' });

    const effectFn = vi.fn();
    store.useEffect(effectFn, (state) => [state.hobby], { sync: true });
    const { computed: greeting } = store.compute(
      'greeting',
      (state) => `Hello ${state.name}`,
      (state) => [state.name],
      { sync: true },
    );

    expect(effectFn).toHaveBeenCalledOnce();
    expect(greeting).toBe('Hello Alice');
    expect(store.computed.greeting).toBe('Hello Alice');

    store.setState(() => ({ name: 'Bob', age: 26, hobby: 'coding' }));
    expect(effectFn).toHaveBeenCalledTimes(2);
    expect(store.computed.greeting).toBe('Hello Bob');
  });

  it('allows waiting until all side effects have been processed', async () => {
    const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' });

    const computationFn = vi.fn();
    const effectFn = vi.fn();
    store.compute('greeting', computationFn, (state) => [state.name]);
    store.useEffect(effectFn, (state) => [state.name]);
    computationFn.mockClear();
    effectFn.mockClear();

    store.setState((state) => ({ ...state, name: 'Bob' }));
    expect(computationFn).not.toHaveBeenCalled();
    expect(effectFn).not.toHaveBeenCalled();
    
    await store.nextTick();
    expect(computationFn).toHaveBeenCalled();
    expect(effectFn).toHaveBeenCalled();
  });

  describe('persistence', () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const storages = [
      {
        name: 'localStorage' as PersistenceOptions['storage'],
        assertFn: assertLocalStorageItemMatchesUserData,
      },
      {
        name: 'sessionStorage' as PersistenceOptions['storage'],
        assertFn: assertSessionStorageItemMatchesUserData,
      },
    ];

    it.each(storages)('persists the state to the $name', ({ name, assertFn }) => {
      const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' }, {
        persistence: {
          storage: name,
          key: 'user',
        },
      });

      assertFn('user', store.getState());
    });

    it.each(storages)('loads the state from the $name on store initialization', ({ name }) => {
      const persistedUser = setStorageItem(name, 'user', { name: 'Bob', age: 26, hobby: 'coding' });

      const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' }, {
        persistence: {
          storage: name,
          key: 'user',
        },
      });

      expect(store.getState()).toEqual(persistedUser);
    });

    it('sets up a side effect that saves the state to the storage whenever it changes', async () => {
      const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' }, {
        persistence: {
          storage: 'localStorage',
          key: 'user',
        },
      });

      store.setState((state) => ({ ...state, hobby: 'coding' }));
      await store.nextTick();
      assertLocalStorageItemMatchesUserData('user', store.getState());
    });

    it('allows reconfiguring or setting up persistence after store initialization', async () => {
      const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' });

      store.persist({ storage: 'localStorage', key: 'user' });
      assertLocalStorageItemMatchesUserData('user', store.getState());

      store.setState((state) => ({ ...state, hobby: 'coding' }));
      await store.nextTick();
      assertLocalStorageItemMatchesUserData('user', store.getState());
    });

    it('allows clearing the previously used storage when reconfiguring persistence', async () => {
      const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' }, {
        persistence: {
          storage: 'sessionStorage',
          key: 'user',
        }
      });

      assertSessionStorageItemMatchesUserData('user', store.getState());

      store.persist({ storage: 'localStorage', key: 'user', clearPrev: true });
      expect(sessionStorage.getItem('user')).toBeNull();
      assertLocalStorageItemMatchesUserData('user', store.getState());
    });

    it('allows turning off the persistence and clearing the previously used storage', async () => {
      const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' }, {
        persistence: {
          storage: 'localStorage',
          key: 'user',
        }
      });

      assertLocalStorageItemMatchesUserData('user', store.getState());
      store.dropPersistence();
      expect(localStorage.getItem('user')).toBeNull();

      store.setState((state) => ({ ...state, hobby: 'coding' }));
      await store.nextTick();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('allows loading data from a storage to update the state in the store', () => {
      const persistedUser = setStorageItem('sessionStorage', 'user', { name: 'Bob', age: 26, hobby: 'coding' });

      const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' });

      store.loadFromPersistence({ storage: 'sessionStorage', key: 'user' });
      expect(store.getState()).toEqual(persistedUser);
    });

    it('does not change the storage that is currently used when loading data from another one', async () => {
      setStorageItem('sessionStorage', 'user', { name: 'Bob', age: 26, hobby: 'coding' });

      const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' }, {
        persistence: {
          storage: 'localStorage',
          key: 'user',
        },
      });

      store.loadFromPersistence({ storage: 'sessionStorage', key: 'user' });
      await store.nextTick();
      assertLocalStorageItemMatchesUserData('user', store.getState());

      store.setState((state) => ({ ...state, name: 'Charlie' }));
      await store.nextTick();
      assertLocalStorageItemMatchesUserData('user', store.getState());
    });

    it('triggers side effects when loading data from a storage', async () => {
      setStorageItem('localStorage', 'user', { name: 'Bob', age: 26, hobby: 'coding' });

      const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' }, {
        persistence: {
          storage: 'sessionStorage',
          key: 'user',
        },
      });
      
      const effectFn = vi.fn();
      const computationFn = vi.fn();
      store.useEffect(effectFn, (state) => [state.hobby]);
      store.compute('greeting', computationFn, (state) => [state.name]);
      effectFn.mockClear();
      computationFn.mockClear();

      store.loadFromPersistence({ storage: 'localStorage', key: 'user' });
      await store.nextTick();
      expect(effectFn).toHaveBeenCalledOnce();
      expect(computationFn).toHaveBeenCalledOnce();
      assertLocalStorageItemMatchesUserData('user', store.getState());
    });

    it('allows processing data loaded from a storage before it is used to update the state', () => {
      const localStorageUser = setStorageItem('localStorage', 'user', { name: 'Bob', age: 26, hobby: 'coding' });
      const sessionStorageUser = setStorageItem('sessionStorage', 'user', { name: 'Charlie', age: 22, hobby: 'studying' });

      const store = createStore({ name: 'Alice', age: 25, hobby: 'writing' }, {
        persistence: {
          storage: 'localStorage',
          key: 'user',
          onLoaded: (data) => {
            return { ...data, age: data.age * 2 };
          },
        },
      });

      expect(store.getState()).toEqual({ ...localStorageUser, age: localStorageUser.age * 2 });

      store.loadFromPersistence({
        storage: 'sessionStorage',
        key: 'user',
        onLoaded: (data) => {
          return { ...data, age: data.age - 5 };
        },
      });

      expect(store.getState()).toEqual({ ...sessionStorageUser, age: sessionStorageUser.age - 5 });
    });
  });
});