import { describe, expect, it, vi } from "vitest";
import { createEffectService } from "../src/effectService";
import { createProcessorWithQueue } from "./helper";

const createEffectServiceWithProcessor = () => {
  const { processor, flushQueue } = createProcessorWithQueue();
  const { useEffect } = createEffectService(processor);
  return {
    useEffect,
    triggerEffects: processor.triggerEffects,
    flushQueue,
  };
};

describe('EffectService', () => {
  it('defines an effect and immediately runs it', () => {
    const { useEffect } = createEffectServiceWithProcessor();

    const effectFn = vi.fn();
    useEffect(effectFn);

    expect(effectFn).toHaveBeenCalled();
  });

  it('re-runs an effect when triggered and at least one of its dependencies changes', async () => {
    const { useEffect, triggerEffects, flushQueue } = createEffectServiceWithProcessor();
    let name = 'Alice';

    const effectFn = vi.fn();
    useEffect(effectFn, () => [name], { immediate: false });

    triggerEffects();
    await flushQueue();
    expect(effectFn).not.toHaveBeenCalled();

    name = 'Bob';
    expect(effectFn).not.toHaveBeenCalled();
    
    triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  it('allows toggling the active state of an effect', () => {
    const { useEffect, triggerEffects } = createEffectServiceWithProcessor();

    const effectFn = vi.fn();
    const toggleActive = useEffect(effectFn, undefined, { sync: true });

    expect(effectFn).toHaveBeenCalledOnce();

    toggleActive();
    triggerEffects();
    expect(effectFn).toHaveBeenCalledOnce();

    toggleActive();
    triggerEffects();
    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  it('runs the effect cleanup function before each effect re-execution', () => {
    const { useEffect, triggerEffects } = createEffectServiceWithProcessor();
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
});