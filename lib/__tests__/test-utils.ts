export function setupStorageMock(type: 'sessionStorage' | 'localStorage'): Record<string, string> {
  const store: Record<string, string> = {};

  beforeAll(() => {
    Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
    Object.defineProperty(global, type, {
      value: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
      },
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  });

  return store;
}
