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

  test("tracks effects and re-run them when their dependencies change and 'setState' is called", async () => {
    const store = createStore({ name: 'Pete' });
    let greeting = '';
    let exclamation = 0;

    store.trackEffects((useEffect) => {
      useEffect(() => {
        greeting = `Hello ${store.getState().name}`;
      }, [store.getState()]);

      useEffect(() => {
        for (let i = 0; i < exclamation; i++) {
          greeting += '!';
        }
      }, [exclamation]);
    });

    store.setState({ name: 'Jackson' });
    await store.effectExecution();
    expect(greeting).toBe('Hello Jackson');

    exclamation++;
    await store.effectExecution();
    expect(greeting).toBe('Hello Jackson'); // Should not change because setState is not called

    store.setState(store.getState()); // Should trigger effects, but should not change the state in the store
    await store.effectExecution();
    expect(greeting).toBe('Hello Jackson!');
  });

  test('runs the effect immediately after its registration', () => {
    const store = createStore({ name: 'Pete' });

    const effectFn = vi.fn();
    store.trackEffects((useEffect) => {
      useEffect(effectFn, [store.getState()]);
    });

    expect(effectFn).toHaveBeenCalled();
  });

  test("runs the effect lazily when the 'immediate' option is disabled", async () => {
    const store = createStore({ name: 'Pete' });

    const effectFn = vi.fn();
    store.trackEffects((useEffect) => {
      useEffect(effectFn, [store.getState()], { immediate: false });
    });

    expect(effectFn).not.toHaveBeenCalled();
    store.setState({ ...store.getState() });
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalled();
  });

  test("always re-runs effects without a dependency array whenever 'setState' is called", async () => {
    const store = createStore({ name: 'Pete' });
    const state = store.getState();

    const effectFn = vi.fn();
    store.trackEffects((useEffect) => {
      useEffect(effectFn);
    });

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
    const state = store.getState();

    const effectFn = vi.fn();
    store.trackEffects((useEffect) => {
      useEffect(effectFn, []);
    });

    expect(effectFn).toHaveBeenCalledOnce();

    state.name = 'Jackson';
    store.setState(state);
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test("runs the effect only once when the 'once' option is enabled", async () => {
    const store = createStore({ name: 'Pete' });

    const effectFn = vi.fn();
    store.trackEffects((useEffect) => {
      useEffect(effectFn, [store.getState().name], { once: true });
    });

    expect(effectFn).toHaveBeenCalledOnce();

    store.setState({ name: 'Jackson' });
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test('runs the cleanup function before each effect re-execution', async () => {
    const store = createStore({ name: 'Pete' });
    const received: string[] = [];

    store.trackEffects((useEffect) => {
      useEffect(() => {
        received.push('effect');

        return () => {
          received.push('cleanup');
        };
      }, [store.getState()]);
    });

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
    store.trackEffects((useEffect) => {
      useEffect(effectFn, undefined, { immediate: false });
    });
    
    store.setState({ name: 'Jackson' });
    expect(effectFn).not.toHaveBeenCalled();
    await store.effectExecution();
    expect(effectFn).toHaveBeenCalled();
  });

  test('batches effect execution', async () => {
    const store = createStore({ name: 'Pete' });
    const names: string[] = [];

    store.trackEffects((useEffect) => {
      useEffect(() => {
        names.push(store.getState().name);
      }, undefined, { immediate: false });
    });

    store.setState({ name: 'Jackson' });
    store.setState({ name: 'Diana' });
    await store.effectExecution();

    expect(names).toHaveLength(1);
    expect(names).toContain('Diana');
  });

  test("properly tracks conditional or dynamic effects when the 'dynamicEffects' option is enabled", async () => {
    const store = createStore({ name: 'Pete', age: 25, job: 'developer' }, { dynamicEffects: true });

    const effectEntries = [
      {
        key: Symbol('effect'),
        effect: vi.fn(),
        deps: [() => store.getState().name],
        active: true,
      },
      {
        key: Symbol('effect'),
        effect: vi.fn(),
        active: false,
      },
      {
        key: Symbol('effect'),
        effect: vi.fn(),
        deps: [() => store.getState().job],
        active: true,
      },
    ];

    store.trackEffects((useEffect) => {
      for (const effectEntry of effectEntries) {
        if (effectEntry.active) {
          const deps = effectEntry.deps?.map((dep) => dep());
          useEffect(effectEntry.effect, deps, {
            key: effectEntry.key,
          });
        }
      }
    });

    expect(effectEntries[0].effect).toHaveBeenCalled();
    expect(effectEntries[1].effect).not.toHaveBeenCalled();
    expect(effectEntries[2].effect).toHaveBeenCalled();

    effectEntries[1].active = true;
    effectEntries[2].active = false;
    store.setState({ name: 'Jackson', age: 27, job: 'engineer' });
    await store.effectExecution();

    expect(effectEntries[0].effect).toHaveBeenCalledTimes(2);
    expect(effectEntries[1].effect).toHaveBeenCalledTimes(1);
    expect(effectEntries[2].effect).toHaveBeenCalledTimes(1);
  });
});