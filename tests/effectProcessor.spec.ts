import { describe, expect, it, vi } from "vitest";
import { EffectEntry } from "../src/effectProcessor";
import { createProcessorWithQueue } from "./helper";

describe('EffectProcessor', () => {
  it('defines and tracks an effect', () => {
    const { processor } = createProcessorWithQueue();

    const effectFn = () => {};
    const effectEntry = processor.trackEffect(Symbol('effect'), effectFn);

    expect(effectEntry.effect).toEqual(effectFn);
  });

  it('immediately runs an effect after its registration', () => {
    const { processor } = createProcessorWithQueue();

    const effectFn = vi.fn();
    processor.trackEffect(Symbol('effect'), effectFn);

    expect(effectFn).toHaveBeenCalled();
  });

  it('does not immediately run an effect after registration when the `immediate` option is disabled', () => {
    const { processor } = createProcessorWithQueue();

    const effectFn = vi.fn();
    processor.trackEffect(Symbol('effect'), effectFn, undefined, { immediate: false });

    expect(effectFn).not.toHaveBeenCalled();
  });

  it('triggers all registered effects in the order they are defined', async () => {
    const { processor, flushQueue } = createProcessorWithQueue();
    const names: string[] = [];

    processor.trackEffect(Symbol('effect'), () => names.push('Alice'), undefined, { immediate: false });
    processor.trackEffect(Symbol('effect'), () => names.push('Charlie'), undefined, { immediate: false });
    processor.trackEffect(Symbol('effect'), () => names.push('Bob'), undefined, { immediate: false });

    processor.triggerEffects();
    await flushQueue();

    expect(names).toEqual(['Alice', 'Charlie', 'Bob']);
  });

  it('schedules effect execution', async () => {
    const { processor, flushQueue } = createProcessorWithQueue();

    const effectFn = vi.fn();
    processor.trackEffect(Symbol('effect'), effectFn, undefined, { immediate: false });

    processor.triggerEffects();

    expect(effectFn).not.toHaveBeenCalled();
    await flushQueue();
    expect(effectFn).toHaveBeenCalled();
  });

  it('batches effect execution', async () => {
    const { processor, flushQueue } = createProcessorWithQueue();
    const names: string[] = [];
    let name = 'Alice';

    const effectFn = vi.fn(() => {
      names.push(name);
    });
    processor.trackEffect(Symbol('effect'), effectFn, undefined, { immediate: false });
    
    processor.triggerEffects();
    name = 'Bob';
    processor.triggerEffects();
    name = 'Charlie';
    processor.triggerEffects();
    await flushQueue();

    expect(effectFn).toHaveBeenCalledOnce();
    expect(names).toEqual(['Charlie']);
  });

  it('runs an effect synchronously when it is defined with the `sync` option enabled', () => {
    const { processor } = createProcessorWithQueue();

    const effectFn = vi.fn();
    processor.trackEffect(Symbol('effect'), effectFn, undefined, { sync: true, immediate: false });

    processor.triggerEffects();
    expect(effectFn).toHaveBeenCalled();
  });

  it('runs an effect only once when it is defined with the `once` option enabled', async () => {
    const { processor, flushQueue } = createProcessorWithQueue();

    const effectFn = vi.fn();
    processor.trackEffect(Symbol('effect'), effectFn, undefined, { once: true });

    expect(effectFn).toHaveBeenCalledOnce();

    processor.triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  it('runs an effect only once when its dependency is an empty array', async () => {
    const { processor, flushQueue } = createProcessorWithQueue();

    const effectFn = vi.fn();
    processor.trackEffect(Symbol('effect'), effectFn, () => [], { immediate: false });

    processor.triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();

    processor.triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();
  });

  it('re-runs an effect when triggered and at least one of its dependencies changes', async () => {
    const { processor, flushQueue } = createProcessorWithQueue();
    let name = 'Alice';
    let age = 25;

    const effectFn = vi.fn();
    processor.trackEffect(Symbol('effect'), effectFn, () => [name, age], { immediate: false });

    processor.triggerEffects();
    await flushQueue();
    expect(effectFn).not.toHaveBeenCalled();

    name = 'Bob';
    expect(effectFn).not.toHaveBeenCalled();
    
    processor.triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();

    age = 27;
    processor.triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  it('re-runs an effect that depends on another effect within the same update cycle', async () => {
    const { processor, flushQueue } = createProcessorWithQueue();
    let counter = 0;

    const effectFn = vi.fn();
    processor.trackEffect(Symbol('effect'), () => counter++, undefined, { immediate: false });
    processor.trackEffect(Symbol('effect'), effectFn, () => [counter], { immediate: false });

    processor.triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalled();
  });

  it('allows toggling the active state of an effect', async () => {
    const { processor, flushQueue } = createProcessorWithQueue();

    const effectFn = vi.fn();
    const effectEntry = processor.trackEffect(Symbol('effect'), effectFn);
    expect(effectFn).toHaveBeenCalledOnce();

    processor.toggleActive(effectEntry);

    processor.triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledOnce();

    processor.toggleActive(effectEntry);

    processor.triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  it('allows controlling how an effect should be run via the `runner` option', async () => {
    const { processor, flushQueue } = createProcessorWithQueue();
    let counter = 0;

    const effectFn = vi.fn(() => counter + 1);
    const effectRunner = vi.fn((effectEntry: EffectEntry) => {
      const result = effectEntry.effect();
      if (typeof result == 'number') {
        counter += result;
      }
    });
    processor.trackEffect(Symbol('effect'), effectFn, undefined, { runner: effectRunner });

    expect(counter).toBe(1);
    expect(effectRunner).toHaveBeenCalledOnce();
    expect(effectFn).toHaveBeenCalledOnce();

    processor.triggerEffects();
    await flushQueue();

    expect(counter).toBe(3);
    expect(effectRunner).toHaveBeenCalledTimes(2);
    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  it('allows directly modifying the behavior of an effect via its `EffectEntry` instance', async () => {
    const { processor, flushQueue } = createProcessorWithQueue();

    const effectFn = vi.fn();
    const effectEntry = processor.trackEffect(Symbol('effect'), effectFn, undefined, { once: true });

    expect(effectFn).toHaveBeenCalledOnce();

    effectEntry.hasRun = false;
    processor.triggerEffects();
    await flushQueue();
    expect(effectFn).toHaveBeenCalledTimes(2);

    effectEntry.once = false;
    effectEntry.sync = true;
    processor.triggerEffects();
    expect(effectFn).toHaveBeenCalledTimes(3);
  });
});