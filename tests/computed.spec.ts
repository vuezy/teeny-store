import { describe, expect, test, vi } from "vitest";
import { createTaskQueue } from "../src/queue";
import { useComputationService } from "../src/useComputationService";

describe('useComputationService', () => {
  const getComputationService = () => {
    const queue = createTaskQueue();
    const { computed, compute, triggerRecomputation } = useComputationService({ queue: queue });
    return {
      computed,
      compute,
      triggerRecomputation,
      flushQueue: () => queue.flush(),
    };
  };

  test('tracks the computed property and computes it immediately', () => {
    const { computed, compute } = getComputationService();
    const name = 'Pete';

    const greeting = compute('greeting', () => `Hello ${name}`, () => [name]);

    expect(greeting).toBe('Hello Pete');
    expect(computed.greeting).toBe('Hello Pete');
  });

  test('updates the computed property when triggered and at least one of its dependencies change', async () => {
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

  test('schedules recomputation in a microtask', async () => {
    const { compute, triggerRecomputation, flushQueue } = getComputationService();
    let name = 'Pete';
    
    const computationFn = vi.fn();
    compute('result', computationFn, () => [name]);
    expect(computationFn).toHaveBeenCalledOnce();
    
    name = 'Jackson';
    triggerRecomputation();
    expect(computationFn).toHaveBeenCalledOnce();
    await flushQueue();
    expect(computationFn).toHaveBeenCalledTimes(2);
  });

  test('batches recomputation', async () => {
    const { computed, compute, triggerRecomputation, flushQueue } = getComputationService();
    let name = 'Pete';
    
    const greetingFn = vi.fn(() => `Hello ${name}`);
    compute('greeting', greetingFn, () => [name]);
    expect(greetingFn).toHaveBeenCalledOnce();

    name = 'Jackson';
    triggerRecomputation();
    name = 'Diana';
    triggerRecomputation();
    name = 'Anna';
    triggerRecomputation();
    await flushQueue();
    expect(greetingFn).toHaveBeenCalledTimes(2);
    expect(computed.greeting).toBe('Hello Anna');
  });

  test('synchronously performs recomputation', () => {
    const { compute, triggerRecomputation } = getComputationService();
    let name = 'Pete';
    
    const computationFn = vi.fn();
    compute('result', computationFn, () => [name], { sync: true });
    expect(computationFn).toHaveBeenCalledOnce();
    
    name = 'Jackson';
    triggerRecomputation();
    expect(computationFn).toHaveBeenCalledTimes(2);
    
    name = 'Diana';
    triggerRecomputation();
    name = 'Anna';
    triggerRecomputation();
    expect(computationFn).toHaveBeenCalledTimes(4);
  });
});