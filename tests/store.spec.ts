import { describe, expect, test } from 'vitest';
import { createStore } from '../src/store';

describe('createStore', () => {
  test('can get and set the state from the store', () => {
    const store = createStore({ name: 'Pete' });
    let state = store.getState();

    expect(state.name).toBe('Pete');
    state = store.setState({ name: 'Jackson' });
    expect(state.name).toBe('Jackson');
  });

  test('runs watchers when the state is immutably updated via setState', () => {
    const store = createStore({ name: 'Pete' });

    let result = '';
    store.watch(() => {
      result += store.getState().name;
    });
    store.watch(() => {
      result = `Hello ${result}`;
    });

    store.getState().name = 'Mike';
    expect(result).toBe('');

    store.setState({ name: 'Jackson' });
    expect(result).toBe('Hello Jackson');
  });
});