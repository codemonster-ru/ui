import type { Component } from 'vue';
import type {
  CreatePlaygroundSessionOptions,
  FrameworkType,
  PlaygroundFiles
} from '@codemonster-ru/vueforge-playground-core';

export type VfPlaygroundTab = 'code' | 'preview' | 'console';

export interface VfPlaygroundSharedProps {
  height?: number | string;
  theme?: 'light' | 'dark' | 'inherit';
  initialTab?: VfPlaygroundTab;
  tabsRenderer?: Component;
  actionsRenderer?: Component;
  filesRenderer?: Component;
}

export interface VfPlaygroundSandboxProps extends VfPlaygroundSharedProps {
  mode?: 'sandbox';
  files: PlaygroundFiles;
  entry: string;
  framework?: FrameworkType;
  autorun?: boolean;
  showCode?: boolean;
  resolveImport?: CreatePlaygroundSessionOptions['resolveImport'];
  bootstrapScript?: string;
}

export interface VfPlaygroundComponentProps extends VfPlaygroundSharedProps {
  mode: 'component';
  component: Component;
  componentSource?: string;
  componentSourceLanguage?: string;
  componentFiles?: Record<string, string>;
  componentEntry?: string;
  componentPadding?: string | number;
  componentMinHeight?: string | number;
}

export type VfPlaygroundProps = VfPlaygroundSandboxProps | VfPlaygroundComponentProps;
