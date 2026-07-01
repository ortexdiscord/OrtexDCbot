export const COMMAND_TIMEOUT_MS = 4_000;

export async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), COMMAND_TIMEOUT_MS)
    ),
  ]);
}
