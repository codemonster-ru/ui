declare module '@codemonster-ru/vueforge-core' {
  import type { DefineComponent } from 'vue';

  export interface VfTabItem {
    value: string;
    label: string;
    disabled?: boolean;
  }

  export const VfTabs: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
}

declare module '@codemonster-ru/vueforge-codeblock/view' {
  import type { DefineComponent } from 'vue';

  export const VfCodeBlock: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
}

declare module '@codemonster-ru/vueforge-playground-core' {
  export type FrameworkType = 'vanilla' | 'vue' | 'html' | (string & {});
  export type PlaygroundFiles = Record<string, string>;
  export type ImportResolutionKind = 'module' | 'style';

  export interface ImportResolutionContext {
    fromFile: string;
    framework?: FrameworkType;
  }

  export interface ImportResolutionResult {
    kind: ImportResolutionKind;
    url: string;
  }

  export interface ConsoleEvent {
    level: string;
    args: unknown[];
  }

  export interface PlaygroundError {
    message: string;
    source?: string;
    stack?: string;
    code?: string;
    details?: {
      specifier?: string;
      fromFile?: string;
      reason?: string;
    };
  }

  export interface PlaygroundSession {
    onRun(callback: () => void): () => void;
    onConsole(callback: (event: ConsoleEvent) => void): () => void;
    onError(callback: (error: PlaygroundError) => void): () => void;
    updateFiles(files: PlaygroundFiles, entry: string): void;
    run(): Promise<void>;
    dispose(): void;
  }

  export interface CreatePlaygroundSessionOptions {
    runtime: 'browser' | string;
    framework: FrameworkType;
    iframe: HTMLIFrameElement;
    files: PlaygroundFiles;
    entry: string;
    resolveImport?: (specifier: string, context: ImportResolutionContext) => ImportResolutionResult | null;
    bootstrapScript?: string;
  }

  export function createPlaygroundSession(options: CreatePlaygroundSessionOptions): PlaygroundSession;
}
