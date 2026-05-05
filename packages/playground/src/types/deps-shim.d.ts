declare module '@codemonster-ru/vueforge-core' {
  import type { DefineComponent } from 'vue';

  export interface VfTabItem {
    value: string;
    label: string;
    disabled?: boolean;
  }

  export const VfTabs: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
}

declare module '@codemonster-ru/vueforge-codeblock' {
  import type { DefineComponent } from 'vue';

  export const VfCodeBlock: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
}

declare module '@codemonster-ru/vueforge-playground-core' {
  export type FrameworkType = 'vanilla' | 'vue' | (string & {});
  export type PlaygroundFiles = Record<string, string>;

  export interface ConsoleEvent {
    level: string;
    args: unknown[];
  }

  export interface PlaygroundError {
    message: string;
    source?: string;
    stack?: string;
  }

  export interface PlaygroundSession {
    onRun(callback: () => void): () => void;
    onConsole(callback: (event: ConsoleEvent) => void): () => void;
    onError(callback: (error: PlaygroundError) => void): () => void;
    updateFiles(files: PlaygroundFiles, entry: string): void;
    run(): Promise<void>;
    dispose(): void;
  }

  export function createPlaygroundSession(options: {
    runtime: 'browser' | string;
    framework: FrameworkType;
    iframe: HTMLIFrameElement;
    files: PlaygroundFiles;
    entry: string;
  }): PlaygroundSession;
}
