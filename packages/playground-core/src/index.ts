import { Emitter } from './events';
import { renderBrowserHtml, runInIframe } from './runtimes/browserRuntime';
import type {
  ConsoleEvent,
  CreatePlaygroundSessionOptions,
  PlaygroundError,
  PlaygroundFiles,
  PlaygroundSession,
  RunEvent
} from './types';

export type {
  ConsoleEvent,
  CreatePlaygroundSessionOptions,
  FrameworkType,
  ImportResolutionContext,
  ImportResolutionErrorCode,
  ImportResolutionResult,
  PlaygroundError,
  PlaygroundFiles,
  PlaygroundSession,
  RemoteRuntimeExecutor,
  RunEvent,
  RuntimeType
} from './types';

export function createPlaygroundSession(options: CreatePlaygroundSessionOptions): PlaygroundSession {
  let files: PlaygroundFiles = { ...options.files };
  let entry = options.entry;
  let disposed = false;

  const runEmitter = new Emitter<RunEvent>();
  const errorEmitter = new Emitter<PlaygroundError>();
  const consoleEmitter = new Emitter<ConsoleEvent>();

  const runtime = options.runtime ?? 'browser';

  const onMessage = (event: MessageEvent) => {
    const payload = event.data;
    if (!payload || payload.__cm_playground !== true) {
      return;
    }

    if (payload.type === 'console') {
      consoleEmitter.emit(payload.payload as ConsoleEvent);
      return;
    }

    if (payload.type === 'error') {
      errorEmitter.emit(payload.payload as PlaygroundError);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('message', onMessage);
  }

  async function run(): Promise<void> {
    if (disposed) {
      return;
    }

    runEmitter.emit({ entry, runtime, framework: options.framework });

    if (runtime === 'remote') {
      if (!options.remoteExecutor) {
        errorEmitter.emit({
          message: 'Remote runtime is selected but remoteExecutor is not provided.',
          source: 'internal'
        });
        return;
      }

      try {
        const result = await options.remoteExecutor.execute({
          files,
          entry,
          framework: options.framework
        });

        if (result.html && options.iframe) {
          runInIframe(options.iframe, result.html);
        }
      } catch (error) {
        errorEmitter.emit({
          message: error instanceof Error ? error.message : 'Remote runtime execution failed.',
          stack: error instanceof Error ? error.stack : undefined,
          source: 'runtime'
        });
      }

      return;
    }

    if (!options.iframe) {
      errorEmitter.emit({
        message: 'Browser runtime requires an iframe element.',
        source: 'internal'
      });
      return;
    }

    const rendered = renderBrowserHtml(files, entry, {
      framework: options.framework,
      resolveImport: options.resolveImport,
      bootstrapScript: options.bootstrapScript
    });

    if (rendered.error) {
      errorEmitter.emit(rendered.error);
    }

    runInIframe(options.iframe, rendered.html);
  }

  function updateFiles(nextFiles: PlaygroundFiles, nextEntry?: string): void {
    files = { ...nextFiles };
    if (nextEntry) {
      entry = nextEntry;
    }
  }

  function dispose(): void {
    disposed = true;
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', onMessage);
    }

    runEmitter.clear();
    errorEmitter.clear();
    consoleEmitter.clear();
  }

  return {
    run,
    dispose,
    updateFiles,
    onRun: (handler) => runEmitter.subscribe(handler),
    onError: (handler) => errorEmitter.subscribe(handler),
    onConsole: (handler) => consoleEmitter.subscribe(handler)
  };
}
