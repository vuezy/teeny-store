export interface TeenyStore<T> {
  getState: () => T;
  setState: (newState: T) => T;
  watch: (effect: () => void) => void;
};

export function createStore<T>(state: T): TeenyStore<T> {
  let currentState = state;
  const effects = new Set<() => void>();

  const store: TeenyStore<T> = {
    getState: () => currentState,
    
    setState: (newState: T): T => {
      const prevState = currentState;
      currentState = newState;
      
      if (prevState !== newState) {
        for (const effect of effects) {
          effect();
        }
      }

      return currentState;
    },

    watch: (effect: () => void) => {
      effects.add(effect);
    },
  };

  return store;
};