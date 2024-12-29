type Result<T> = [T, null] | [null, Error];

export async function safeTry<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const value = await promise;
    return [value, null];
  } catch (error) {
    return [null, error as Error];
  }
}

export function safeTrySync<T>(fn: () => T): Result<T> {
  try {
    const value = fn();
    return [value, null];
  } catch (error) {
    return [null, error as Error];
  }
}
