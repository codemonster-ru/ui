import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('transpileTypeScript', () => {
  it('does not create a worker for an empty batch', async () => {
    const workerConstructor = vi.fn();
    vi.stubGlobal('Worker', workerConstructor);
    const { transpileTypeScript } = await import('../src/typescriptWorkerClient');

    await expect(transpileTypeScript([])).resolves.toEqual([]);
    expect(workerConstructor).not.toHaveBeenCalled();
  });

  it('propagates compiler errors returned by the worker', async () => {
    class CompilerErrorWorker {
      private messageListener: ((event: MessageEvent) => void) | null = null;

      addEventListener(type: string, listener: (event: MessageEvent) => void): void {
        if (type === 'message') {
          this.messageListener = listener;
        }
      }

      postMessage(request: { id: number }): void {
        queueMicrotask(() => {
          this.messageListener?.({
            data: { type: 'error', id: request.id, message: 'Invalid TypeScript source.' },
          } as MessageEvent);
        });
      }

      terminate(): void {}
    }

    vi.stubGlobal('Worker', CompilerErrorWorker);
    const { transpileTypeScript } = await import('../src/typescriptWorkerClient');

    await expect(transpileTypeScript(['broken source'])).rejects.toThrow('Invalid TypeScript source.');
  });

  it('rejects pending work and terminates a failed worker', async () => {
    const terminate = vi.fn();

    class FailedWorker {
      private errorListener: (() => void) | null = null;

      addEventListener(type: string, listener: () => void): void {
        if (type === 'error') {
          this.errorListener = listener;
        }
      }

      postMessage(): void {
        queueMicrotask(() => this.errorListener?.());
      }

      terminate = terminate;
    }

    vi.stubGlobal('Worker', FailedWorker);
    const { transpileTypeScript } = await import('../src/typescriptWorkerClient');

    await expect(transpileTypeScript(['const value: number = 1;'])).rejects.toThrow(
      'TypeScript compiler worker failed.',
    );
    expect(terminate).toHaveBeenCalledOnce();
  });
});
