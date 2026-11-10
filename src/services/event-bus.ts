type Listener = () => void;

class SimpleEventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(event: string, callback: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb();
        } catch {
          /* ignore callback errors */
        }
      });
    }
  }
}

export const appEvents = new SimpleEventBus();
export const EVENT_TRANSACTIONS_CHANGED = 'transactions-changed';
export const EVENT_BALANCE_CHANGED = 'balance-changed';
export const EVENT_CATEGORIES_CHANGED = 'categories-changed';

