import { describe, expect, test } from 'vitest';
import { createStore } from '../src/store';

describe('TeenyStore', () => {
  test('can get and set the state from the store', () => {
    const store = createStore({ name: 'Pete' });
    let state = store.getState();

    expect(state.name).toBe('Pete');
    state = store.setState({ name: 'Jackson' });
    expect(state.name).toBe('Jackson');
  });

  test("tracks effects and re-run them when their dependencies change and 'setState' is called", () => {
    const store = createStore({ name: 'Pete' });
    let greeting = 'Hello ';
    let exclamation = 0;

    store.trackEffects((useEffect) => {
      useEffect(() => {
        greeting += store.getState().name;
      }, [store.getState()]);

      useEffect(() => {
        for (let i = 0; i < exclamation; i++) {
          greeting += '!';
        }
      }, [exclamation]);
    });

    store.setState({ name: 'Jackson' });
    expect(greeting).toBe('Hello Jackson');

    exclamation++;
    expect(greeting).toBe('Hello Jackson'); // Should not change because setState is not called

    store.setState(store.getState()); // Should trigger effects, but should not change the state in the store
    expect(greeting).toBe('Hello Jackson!');
  });

  test("always runs effects without a dependency array whenever 'setState' is called", () => {
    const store = createStore({ name: 'Pete' });
    const state = store.getState();

    const names: string[] = [];

    store.trackEffects((useEffect) => {
      useEffect(() => {
        names.push(state.name);
      });
    });

    store.setState(state);
    state.name = 'Jackson';
    store.setState(state);
    
    const expectedNames = ['Pete', 'Jackson'];
    names.forEach((name, idx) => expect(name).toBe(expectedNames[idx]));
  });

  test('runs effects that have an empty dependency array only once', () => {
    const store = createStore({ name: 'Pete' });
    const state = store.getState();

    const names: string[] = [];

    store.trackEffects((useEffect) => {
      useEffect(() => {
        names.push(state.name);
      }, []);
    });

    store.setState(state);
    state.name = 'Jackson';
    store.setState(state);

    const expectedNames = ['Pete'];
    names.forEach((name, idx) => expect(name).toBe(expectedNames[idx]));
  });

  test("runs the effect only once when the 'once' option is enabled", () => {
    const store = createStore({ name: 'Pete' });

    const names: string[] = [];

    store.trackEffects((useEffect) => {
      useEffect(() => {
        names.push(store.getState().name);
      }, [store.getState().name], { once: true });
    });

    store.setState({ name: 'Jackson' });
    store.setState({ name: 'Diana' });

    const expectedNames = ['Jackson'];
    names.forEach((name, idx) => expect(name).toBe(expectedNames[idx]));
  });

  test("runs the effect immediately after its registration when the 'immediate' option is enabled", () => {
    const store = createStore({ name: 'Pete' });
    let hasRunEffect = false;

    store.trackEffects((useEffect) => {
      useEffect(() => {
        hasRunEffect = true;
      }, [store.getState()], { immediate: true });
    });

    expect(hasRunEffect).toBe(true);
  });

  test('properly tracks conditional or dynamic effects when they have stable keys', () => {
    const store = createStore({ name: 'Pete', age: 25, job: 'developer' });
    let receivedName = '';
    let receivedAge = 0;
    let receivedJob = '';

    const effectEntries = [
      {
        key: Symbol('effect'),
        effect: () => { receivedName = store.getState().name; },
        deps: [() => store.getState().name],
        active: true,
      },
      {
        key: Symbol('effect'),
        effect: () => { receivedAge = store.getState().age; },
        active: false,
      },
      {
        key: Symbol('effect'),
        effect: () => { receivedJob = store.getState().job; },
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
            immediate: true,
          });
        }
      }
    });

    expect(receivedName).toBe('Pete');
    expect(receivedAge).toBe(0);
    expect(receivedJob).toBe('developer');

    effectEntries[1].active = true;
    effectEntries[2].active = false;
    store.setState({ name: 'Jackson', age: 27, job: 'engineer' });

    expect(receivedName).toBe('Jackson');
    expect(receivedAge).toBe(27);
    expect(receivedJob).toBe('developer');
  });

  test('runs the cleanup function before each effect re-execution', () => {
    const store = createStore({ name: 'Pete' });
    const received: string[] = [];

    store.trackEffects((useEffect) => {
      useEffect(() => {
        received.push('effect');

        return () => {
          received.push('cleanup');
        };
      }, [store.getState()], { immediate: true });
    });

    const expected = ['effect'];
    received.forEach((op, idx) => expect(op).toBe(expected[idx]));

    store.setState({ name: 'Jackson' });
    expected.push('cleanup', 'effect');
    received.forEach((op, idx) => expect(op).toBe(expected[idx]));

    store.setState({ name: 'Diana' });
    expected.push('cleanup', 'effect');
    received.forEach((op, idx) => expect(op).toBe(expected[idx]));
  });
});