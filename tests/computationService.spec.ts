import { describe, expect, it } from "vitest";
import { createComputationService } from "../src/computationService";
import { createProcessorWithQueue } from "./helper";

const createComputationServiceWithProcessor = () => {
  const { processor, flushQueue } = createProcessorWithQueue();
  const { computed, compute } = createComputationService(processor);
  return {
    computed,
    compute,
    triggerRecomputation: processor.triggerEffects,
    flushQueue,
  };
};

describe('ComputationService', () => {
  it('performs a computation and keeps track of the computed value', () => {
    const { computed, compute } = createComputationServiceWithProcessor();
    const name = 'Alice';

    const { computed: greeting } = compute('greeting', () => `Hello ${name}`, () => [name]);

    expect(greeting).toBe('Hello Alice');
    expect(computed.greeting).toBe('Hello Alice');
  });

  it('updates the `computed` property when a computation is triggered and at least one of its dependencies changes', async () => {
    const { computed, compute, triggerRecomputation, flushQueue } = createComputationServiceWithProcessor();
    const user = {
      name: 'Alice',
      age: 25,
    };

    compute('greeting', () => `Hello ${user.name}`, () => [user.name]);
    
    user.name = 'Bob';
    expect(computed.greeting).toBe('Hello Alice');

    triggerRecomputation();
    await flushQueue();
    expect(computed.greeting).toBe('Hello Bob');

    user.age = 27;
    triggerRecomputation();
    await flushQueue();
    expect(computed.greeting).toBe('Hello Bob');
  });

  it('allows toggling the active state of a computation', () => {
    const { computed, compute, triggerRecomputation } = createComputationServiceWithProcessor();
    let name = 'Alice';

    const { toggleActive } = compute('greeting', () => `Hello ${name}`, () => [name], { sync: true });

    expect(computed.greeting).toBe('Hello Alice');

    toggleActive();
    name = 'Bob';
    triggerRecomputation();
    expect(computed.greeting).toBe('Hello Alice');

    toggleActive();
    triggerRecomputation();
    expect(computed.greeting).toBe('Hello Bob');
  });
});