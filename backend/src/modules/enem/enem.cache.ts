type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

// Cache simples em memória com TTL.
// MVP: evita hits repetidos na enem.dev e reduz risco de 429.
export class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxItems = 500,
  ) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T) {
    // Proteção simples contra crescimento infinito.
    if (this.store.size >= this.maxItems) {
      const firstKey = this.store.keys().next().value as string | undefined;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}
