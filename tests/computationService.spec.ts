import { describe, expect, test, vi } from "vitest";
import { createTaskQueue } from "../src/queue";
import { createComputationService } from "../src/computationService";
import { createEffectProcessor } from "../src/effectProcessor";

const getComputationService = () => {
  const queue = createTaskQueue();
  const effectProcessor = createEffectProcessor({ queue });
  const { computed, compute } = createComputationService(effectProcessor);
  return {
    computed,
    compute,
    triggerRecomputation: effectProcessor.triggerEffects,
    flushQueue: () => queue.flush(),
  };
};

describe('computationService', () => {
  test('tracks the computed property and computes it immediately', () => {
    const { computed, compute } = getComputationService();
    const name = 'Pete';

    const { computed: greeting } = compute('greeting', () => `Hello ${name}`, () => [name]);

    expect(greeting).toBe('Hello Pete');
    expect(computed.greeting).toBe('Hello Pete');
  });

  test('updates the computed property when triggered and at least one of its dependencies changes', async () => {
    const { computed, compute, triggerRecomputation, flushQueue } = getComputationService();
    let firstName = 'Pete';
    let lastName = 'James';

    compute('greeting', () => `Hello ${firstName} ${lastName}`, () => [firstName, lastName]);

    firstName = 'Jackson';
    lastName = 'Walker';
    await flushQueue();
    expect(computed.greeting).toBe('Hello Pete James');
    
    triggerRecomputation();
    await flushQueue();
    expect(computed.greeting).toBe('Hello Jackson Walker');

    firstName = 'Diana';
    triggerRecomputation();
    await flushQueue();
    expect(computed.greeting).toBe('Hello Diana Walker');
  });

  test('schedules recomputation', async () => {
    const { compute, triggerRecomputation, flushQueue } = getComputationService();
    let name = 'Pete';
    
    const computationFn = vi.fn();
    compute('result', computationFn, () => [name]);
    computationFn.mockClear();
    
    name = 'Jackson';
    triggerRecomputation();
    expect(computationFn).not.toHaveBeenCalled();
    await flushQueue();
    expect(computationFn).toHaveBeenCalledOnce();
  });

  test('batches recomputation', async () => {
    const { computed, compute, triggerRecomputation, flushQueue } = getComputationService();
    let name = 'Pete';
    
    const greetingFn = vi.fn(() => `Hello ${name}`);
    compute('greeting', greetingFn, () => [name]);
    greetingFn.mockClear();

    name = 'Jackson';
    triggerRecomputation();
    name = 'Diana';
    triggerRecomputation();
    name = 'Anna';
    triggerRecomputation();
    await flushQueue();
    expect(greetingFn).toHaveBeenCalledOnce();
    expect(computed.greeting).toBe('Hello Anna');
  });

  test('synchronously performs recomputation', () => {
    const { compute, triggerRecomputation } = getComputationService();
    let counter = 0;
    
    const computationFn = vi.fn();
    compute('result', computationFn, () => [counter], { sync: true });
    expect(computationFn).toHaveBeenCalledOnce();
    
    counter++;
    triggerRecomputation();
    expect(computationFn).toHaveBeenCalledTimes(2);
    
    counter++;
    triggerRecomputation();
    counter++;
    triggerRecomputation();
    expect(computationFn).toHaveBeenCalledTimes(4);
  });

  test('allows activating and deactivating the computation', () => {
    const { compute, triggerRecomputation } = getComputationService();
    let counter = 0;

    const computationFn = vi.fn();
    const { toggleActive } = compute('result', computationFn, () => [counter], { sync: true });
    expect(computationFn).toHaveBeenCalledOnce();

    toggleActive();
    counter++;
    triggerRecomputation();
    expect(computationFn).toHaveBeenCalledOnce();
    
    toggleActive();
    counter++;
    triggerRecomputation();
    expect(computationFn).toHaveBeenCalledTimes(2);

    toggleActive();
    counter++;
    triggerRecomputation();
    expect(computationFn).toHaveBeenCalledTimes(2);
  });
});