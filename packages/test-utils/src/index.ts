export function createMock<T>(overrides?: Partial<T>): T {
  return (overrides ?? {}) as T;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
