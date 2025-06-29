import { describe, expect, test, vi } from 'vitest';
import { createStore } from '../src/store';

describe('TeenyStore', () => {
  test('can get and set the state from the store', () => {
    const store = createStore({ name: 'Pete' });
    let state = store.getState();

    expect(state.name).toBe('Pete');
    state = store.setState({ name: 'Jackson' });
    expect(state.name).toBe('Jackson');
  });

  test('can use custom action functions to update the state', () => {
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

    store.actions?.incrementAge();
    expect(store.getState().age).toBe(26);

    const state = store.actions?.setHobby('coding');
    expect(state?.hobby).toBe('coding');
  });

  test("tracks effects and re-run them when their dependencies change and 'setState' is called", async () => {
    const store = createStore({ name: 'Pete', hobby: 'writing' });
    let greeting = 'Hello';
    let hobby = 'writing';

    store.useEffect(() => {
      greeting = `Hello ${store.getState().name}`;
    }, () => [store.getState()]);

    store.useEffect(() => {
      store.setState({ ...store.getState(), hobby: hobby });
    }, () => [hobby]);

    store.setState({ ...store.getState(), name: 'Jackson' });
    await store.effectExecution();
    expect(greeting).toBe('Hello Jackson');
    expect(store.getState().hobby).toBe('writing');

    hobby = 'coding';
    await store.effectExecution();
    // Should not change because setState is not called
    expect(greeting).toBe('Hello Jackson');
    expect(store.getState().hobby).toBe('writing');

    store.setState(store.getState()); // Should trigger effects, but should not change the state reference in the store
    await store.effectExecution();
    expect(greeting).toBe('Hello Jackson');
    expect(store.getState().hobby).toBe('coding');
  });

  test('runs the effect immediately after its registration', () => {
    const store = createStore({ name: 'Pete' });

    const effectFn = vi.fn();
    store.useEffect(effectFn, () => [store.getState()]);

    expect(effectFn).toHaveBeenCalled();
  });

  test("runs the effect lazily when the 'immediate' option is disabled", async () => {
    const store = createStore({ name: 'Pete' });

    const effectFn = vi.fn();
    store.useEffect(effectFn, () => [store.getState()], { immediate: false });

    expect(effectFn).not.toHaveBeenCalled();
    store.setState({ ...store.getState() });
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalled();
  });

  test("always re-runs effects without a dependency array whenever 'setState' is called", async () => {
    const store = createStore({ name: 'Pete' });
    const state = store.getState();

    const effectFn = vi.fn();
    store.useEffect(effectFn);

    expect(effectFn).toHaveBeenCalledOnce();

    state.name = 'Jackson';
    store.setState(state);
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalledTimes(2);

    store.setState(state);
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalledTimes(3);
  });

  test('runs effects that have an empty dependency array only once', async () => {
    const store = createStore({ name: 'Pete' });

    const effectFn = vi.fn();
    store.useEffect(effectFn, () => []);

    expect(effectFn).toHaveBeenCalledOnce();

    store.setState({ ...store.getState() });
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test("runs the effect only once when the 'once' option is enabled", async () => {
    const store = createStore({ name: 'Pete' });

    const effectFn = vi.fn();
    store.useEffect(effectFn, () => [store.getState().name], { once: true });

    expect(effectFn).toHaveBeenCalledOnce();

    store.setState({ name: 'Jackson' });
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test('runs the cleanup function before each effect re-execution', async () => {
    const store = createStore({ name: 'Pete' });
    const received: string[] = [];

    store.useEffect(() => {
      received.push('effect');

      return () => {
        received.push('cleanup');
      };
    }, () => [store.getState()]);

    const expected = ['effect'];
    const assertReceived = () => {
      expect(received).toHaveLength(expected.length);
      received.forEach((op, idx) => expect(op).toBe(expected[idx]));
    };
    assertReceived();

    store.setState({ name: 'Jackson' });
    await store.effectExecution();
    expected.push('cleanup', 'effect');
    assertReceived();

    store.setState({ name: 'Diana' });
    await store.effectExecution();
    expected.push('cleanup', 'effect');
    assertReceived();
  });

  test('schedules effect execution in a microtask', async () => {
    const store = createStore({ name: 'Pete' });
    
    const effectFn = vi.fn();
    store.useEffect(effectFn, undefined, { immediate: false });
    
    store.setState({ name: 'Jackson' });
    expect(effectFn).not.toHaveBeenCalled();
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test('batches effect execution', async () => {
    const store = createStore({ name: 'Pete' });

    const effectFn = vi.fn();
    store.useEffect(effectFn, undefined, { immediate: false });

    store.setState({ name: 'Jackson' });
    store.setState({ name: 'Diana' });
    store.setState({ name: 'Gian' });
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test('computes the computed properties immediately after its registration', () => {
    const store = createStore({ name: 'Pete' });

    const computed = store.compute(
      'greeting',
      () => `Hello ${store.getState().name}`,
      () => [store.getState().name],
    );

    expect(computed).toBe('Hello Pete');
    expect(store.computed.greeting).toBe('Hello Pete');
  });

  test("updates the computed properties when their dependencies change and 'setState' is called", async () => {
    const store = createStore({ name: 'Pete', weightInKg: 80 });

    store.compute(
      'greeting',
      () => `Hello ${store.getState().name}`,
      () => [store.getState()],
    );

    store.compute(
      'weightInLbs',
      () => store.getState().weightInKg * 2.2,
      () => [store.getState().weightInKg],
    );

    store.setState({ name: 'Jackson', weightInKg: 75 });
    await store.computation();
    expect(store.computed.greeting).toBe('Hello Jackson');
    expect(store.computed.weightInLbs).toBeCloseTo(75 * 2.2);

    const state = store.getState();
    state.name = 'Diana';
    state.weightInKg = 50;
    // Should not change because setState is not called
    expect(store.computed.greeting).toBe('Hello Jackson');
    expect(store.computed.weightInLbs).toBeCloseTo(75 * 2.2);

    store.setState(state); // Should trigger recomputation, but should not change the state reference in the store
    await store.computation();
    expect(store.computed.greeting).toBe('Hello Jackson');
    expect(store.computed.weightInLbs).toBeCloseTo(50 * 2.2);
  });

  test('schedules recomputation in a microtask', async () => {
    const store = createStore({ name: 'Pete' });

    const computationFn = vi.fn();
    store.compute('greeting', computationFn, () => [store.getState().name]);

    expect(computationFn).toHaveBeenCalledOnce();
    store.setState({ name: 'Jackson' });
    expect(computationFn).toHaveBeenCalledOnce();
    await store.computation();
    expect(computationFn).toHaveBeenCalledTimes(2);
  });

  test('batches recomputation', async () => {
    const store = createStore({ name: 'Pete' });

    const computationFn = vi.fn();
    store.compute('greeting', computationFn, () => [store.getState().name]);

    expect(computationFn).toHaveBeenCalledOnce();
    store.setState({ name: 'Jackson' });
    store.setState({ name: 'Diana' });
    store.setState({ name: 'Gian' });
    await store.computation();
    expect(computationFn).toHaveBeenCalledTimes(2);
  });
});