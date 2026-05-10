export interface ConsoleEvent {
  level: string;
  args: unknown[];
}

export interface PlaygroundError {
  message: string;
  source?: string;
  stack?: string;
}

export function createPlaygroundSession() {
  return {
    run: async () => undefined,
    dispose: () => undefined,
    updateFiles: () => undefined,
    onRun: () => () => undefined,
    onConsole: () => () => undefined,
    onError: () => () => undefined
  };
}
