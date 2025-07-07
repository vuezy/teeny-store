import { describe, expect, test, vi } from "vitest";
import { useEffectService } from "../src/useEffectService";
import { createTaskQueue } from "../src/queue";

describe('useEffectService', () => {
  const getEffectService = () => {
    const queue = createTaskQueue();
    const { useEffect, triggerEffects } = useEffectService({ queue: queue });
    return {
      useEffect,
      triggerEffects,
      flushQueue: () => queue.flush(),
    };
  };

  test('tracks the effect and runs it immediately', () => {
    const { useEffect } = getEffectService();

    const effectFn = vi.fn();
    useEffect(effectFn);
    expect(effectFn).toHaveBeenCalled();
  });

  test('always re-runs effects with no dependency array when triggered', async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectService();

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
    const { useEffect, triggerEffects, flushQueue } = getEffectService();

    const effectFn = vi.fn();
    useEffect(effectFn, undefined, { immediate: false });
    expect(effectFn).not.toHaveBeenCalled();

    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test('schedules effect execution in a microtask', async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectService();
    
    const effectFn = vi.fn();
    useEffect(effectFn, undefined, { immediate: false });
    
    triggerEffects();
    expect(effectFn).not.toHaveBeenCalled();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test('batches effect execution', async () => {
    const { useEffect, triggerEffects, flushQueue } = getEffectService();
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

  test("synchronously runs the effect when the 'sync' option is enabled", () => {
    const { useEffect, triggerEffects } = getEffectService();
    
    const effectFn = vi.fn();
    useEffect(effectFn, undefined, { immediate: false, sync: true });
    
    triggerEffects();
    expect(effectFn).toHaveBeenCalledOnce();
    
    triggerEffects();
    triggerEffects();
    expect(effectFn).toHaveBeenCalledTimes(3);
  });

  test('re-runs the effect when triggered and at least one of its dependencies change', () => {
    const { useEffect, triggerEffects } = getEffectService();
    let counter = 0;
    let active = false;

    const effectFn = vi.fn();
    useEffect(effectFn, () => [counter, active], { immediate: false, sync: true });

    counter++;
    active = true;
    expect(effectFn).not.toHaveBeenCalled();

    triggerEffects();
    expect(effectFn).toHaveBeenCalledOnce();

    counter++;
    triggerEffects();
    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  test('runs effects that have an empty dependency array only once', () => {
    const { useEffect, triggerEffects } = getEffectService();

    const effectFn = vi.fn();
    useEffect(effectFn, () => [], { sync: true });
    expect(effectFn).toHaveBeenCalledOnce();

    triggerEffects();
    expect(effectFn).toHaveBeenCalledOnce();

    triggerEffects();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test("runs the effect only once when the 'once' option is enabled", () => {
    const { useEffect, triggerEffects } = getEffectService();
    let counter = 0;

    const effectFn = vi.fn();
    useEffect(effectFn, () => [counter], { once: true, sync: true });
    expect(effectFn).toHaveBeenCalledOnce();

    counter++;
    triggerEffects();
    expect(effectFn).toHaveBeenCalledOnce();

    counter++;
    triggerEffects();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  test('runs the effect cleanup function before each effect re-execution', () => {
    const { useEffect, triggerEffects } = getEffectService();
    const received: string[] = [];

    useEffect(() => {
      received.push('effect');

      return () => {
        received.push('cleanup');
      };
    }, undefined, { sync: true });

    const expected = ['effect'];
    const assertReceived = () => {
      expect(received).toHaveLength(expected.length);
      received.forEach((op, idx) => expect(op).toBe(expected[idx]));
    };
    assertReceived();

    triggerEffects();
    expected.push('cleanup', 'effect');
    assertReceived();

    triggerEffects();
    expected.push('cleanup', 'effect');
    assertReceived();
  });
});