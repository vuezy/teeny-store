import { describe, expect, test, vi } from "vitest";
import { useEffectService } from "../src/useEffectService";
import { createTaskQueue } from "../src/queue";
import { createEffectProcessor } from "../src/effectProcessor";

const getEffectService = () => {
  const queue = createTaskQueue();
  const effectProcessor = createEffectProcessor({ queue });
  const { useEffect } = useEffectService(effectProcessor);
  return {
    useEffect,
    triggerEffects: effectProcessor.triggerEffects,
    flushQueue: () => queue.flush(),
  };
};

describe('useEffectService', () => {
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

  test('schedules effect execution', async () => {
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
    const calls: string[] = [];

    useEffect(() => {
      calls.push('effect');

      return () => {
        calls.push('cleanup');
      };
    }, undefined, { sync: true });

    expect(calls).toEqual(['effect']);

    calls.length = 0;
    triggerEffects();
    expect(calls).toEqual(['cleanup', 'effect']);

    calls.length = 0;
    triggerEffects();
    expect(calls).toEqual(['cleanup', 'effect']);
  });

  test('allows activating and deactivating the effect', () => {
    const { useEffect, triggerEffects } = getEffectService();

    const effectFn = vi.fn();
    const toggleEffectActive = useEffect(effectFn, undefined, { sync: true });
    expect(effectFn).toHaveBeenCalledOnce();

    toggleEffectActive();
    triggerEffects();
    expect(effectFn).toHaveBeenCalledOnce();
    
    toggleEffectActive();
    triggerEffects();
    expect(effectFn).toHaveBeenCalledTimes(2);

    toggleEffectActive();
    triggerEffects();
    expect(effectFn).toHaveBeenCalledTimes(2);
  });
});