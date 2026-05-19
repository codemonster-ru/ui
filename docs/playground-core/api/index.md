---
title: "API"
description: "Public API reference for the playground-core package"
slug: "/vueforge/playground-core/api"
order: 3
---

# API

## Overview

Public API surface of `@codemonster-ru/vueforge-playground-core`.

## Main Factory

```ts
createPlaygroundSession(options: CreatePlaygroundSessionOptions): PlaygroundSession
```

Creates a session with file state, entrypoint, and runtime adapters.

## `CreatePlaygroundSessionOptions` (Key)

- `runtime?: 'browser' | 'remote'`
- `framework?: 'vanilla' | 'vue' | 'html'`
- `files: PlaygroundFiles`
- `entry: string`
- `iframe?: HTMLIFrameElement | null`
- `remoteExecutor?: RemoteRuntimeExecutor`
- `resolveImport?: (specifier, context) => ImportResolutionResult | null`
- `bootstrapScript?: string`

## Session API (`PlaygroundSession`)

- `run(): Promise<void>`: executes current entry with selected runtime.
- `updateFiles(nextFiles, nextEntry?): void`: updates in-memory files and optionally switches entry.
- `dispose(): void`: removes listeners and clears all subscribers.
- `onRun(handler): () => void`: subscribe/unsubscribe run events.
- `onError(handler): () => void`: subscribe/unsubscribe runtime/internal errors.
- `onConsole(handler): () => void`: subscribe/unsubscribe forwarded console events.

## Runtime Types

- `RuntimeType`: `'browser' | 'remote'`
- `FrameworkType`: `'vanilla' | 'vue' | 'html'`
- `PlaygroundFiles`: `Record<string, string>`
- `RemoteRuntimeExecutor`: remote execution contract returning optional html.

## Events and Errors

- `RunEvent`
- `ConsoleEvent`
- `PlaygroundError`

## Import Resolution Contracts

- `ImportResolutionContext`
- `ImportResolutionResult`
- `ImportResolutionErrorCode`
