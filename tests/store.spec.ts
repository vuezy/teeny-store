import { describe, expect, test, vi } from 'vitest';
import { createStore } from '../src/store';

describe('TeenyStore', () => {
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
});