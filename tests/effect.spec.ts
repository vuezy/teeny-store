import { describe, expect, test, vi } from "vitest";
import { useEffectSystem } from "../src/effect";
import { createTaskQueue } from "../src/queue";

describe('useEffectSystem', () => {
  const getEffectSystem = () => {
    const queue = createTaskQueue();
    const { useEffect, triggerEffects } = useEffectSystem({ queue: queue });
    return {
      useEffect,
      triggerEffects,
      flushQueue: () => queue.flush(),
    };
  };

  test('tracks the effect and runs it immediately', () => {
    const { useEffect } = getEffectSystem();

    const effectFn = vi.fn();
    useEffect(effectFn);
    expect(effectFn).toHaveBeenCalled();
  });

  test('always re-runs effects with no dependency array when triggered', async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectSystem();

    const effectFn = vi.fn();
    useEffect(effectFn);
    expect(effectFn).toHaveBeenCalledOnce();

    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledTimes(2);

    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledTimes(3);
  });

  test("lazily runs the effect when the 'immediate' option is disabled", async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectSystem();

    const effectFn = vi.fn();
    useEffect(effectFn, undefined, { immediate: false });
    expect(effectFn).not.toHaveBeenCalled();

    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test('schedules effect execution in a microtask', async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectSystem();
    
    const effectFn = vi.fn();
    useEffect(effectFn, undefined, { immediate: false });
    
    triggerEffects();
    expect(effectFn).not.toHaveBeenCalled();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test('batches effect execution', async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectSystem();
    const names = ['Pete', 'Jackson', 'Diana'];
    let nameIdx = 0;
    let received = '';
    
    const effectFn = vi.fn(() => {
      received = names[nameIdx];
    });
    useEffect(effectFn, undefined, { immediate: false });

    triggerEffects();
    nameIdx++;
    triggerEffects();
    nameIdx++;
    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();
    expect(received).toBe('Diana');
  });

  test('re-runs the effect when triggered and at least one of its dependencies change', async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectSystem();
    let counter = 0;
    let active = false;

    const effectFn = vi.fn();
    useEffect(effectFn, () => [counter, active], { immediate: false });

    counter++;
    active = true;
    await flushQueue();
    expect(effectFn).not.toHaveBeenCalled();

    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();

    counter++;
    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  test('runs effects that have an empty dependency array only once', async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectSystem();

    const effectFn = vi.fn();
    useEffect(effectFn, () => []);
    expect(effectFn).toHaveBeenCalledOnce();

    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();

    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test("runs the effect only once when the 'once' option is enabled", async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectSystem();
    let counter = 0;

    const effectFn = vi.fn();
    useEffect(effectFn, () => [counter], { once: true });
    expect(effectFn).toHaveBeenCalledOnce();

    counter++;
    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();

    counter++;
    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test('runs the effect cleanup function before each effect re-execution', async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectSystem();
    const received: string[] = [];

    useEffect(() => {
      received.push('effect');

      return () => {
        received.push('cleanup');
      };
    });

    const expected = ['effect'];
    const assertReceived = () => {
      expect(received).toHaveLength(expected.length);
      received.forEach((op, idx) => expect(op).toBe(expected[idx]));
    };
    assertReceived();

    triggerEffects();
    await flushQueue();
    expected.push('cleanup', 'effect');
    assertReceived();

    triggerEffects();
    await flushQueue();
    expected.push('cleanup', 'effect');
    assertReceived();
  });
});