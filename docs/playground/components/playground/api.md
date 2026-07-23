# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name                       | Type                                                                                                                                                 | Default    | Description                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `minHeight?`               | `string \| number`                                                                                                                                   | —          | Minimum height of playground container (number treated as px).                                                                         |
| `height?`                  | `string \| number`                                                                                                                                   | —          | Fixed height of playground container (number treated as px).                                                                           |
| `heightMode?`              | `'fixed' \| 'auto-preview' \| 'auto'`                                                                                                                | `fixed`    | Uses the configured height, content height only on preview, or content height on every tab.                                            |
| `theme?`                   | `'inherit' \| 'light' \| 'dark'`                                                                                                                     | `inherit`  | Theme mode for rendering.                                                                                                              |
| `initialTab?`              | `'code' \| 'preview' \| 'console'`                                                                                                                   | mode-aware | Initial active tab on mount. Defaults to `code` when source is visible and `preview` otherwise.                                        |
| `tabsRenderer?`            | `Component`                                                                                                                                          | —          | Custom renderer component for the main tabs header.                                                                                    |
| `actionsRenderer?`         | `Component`                                                                                                                                          | —          | Custom renderer component for the sandbox actions area.                                                                                |
| `filesRenderer?`           | `Component`                                                                                                                                          | —          | Custom renderer component for the file tabs/picker.                                                                                    |
| `mode?`                    | `'sandbox' \| 'component'`                                                                                                                           | `sandbox`  | Selects the runtime mode. It is required with the literal value `component` for component-mode props.                                  |
| `files`                    | `PlaygroundFiles`                                                                                                                                    | —          | Virtual file map for sandbox runtime.                                                                                                  |
| `entry`                    | `string`                                                                                                                                             | —          | Entry module path for sandbox runtime.                                                                                                 |
| `framework?`               | `'vanilla' \| 'vue' \| 'html'`                                                                                                                       | `vanilla`  | Runtime adapter used in sandbox mode.                                                                                                  |
| `autorun?`                 | `boolean`                                                                                                                                            | `true`     | Runs sandbox preview automatically on load.                                                                                            |
| `showCode?`                | `boolean`                                                                                                                                            | `true`     | Shows the code panel in UI.                                                                                                            |
| `resolveImport?`           | `(specifier: string, context: { fromFile: string; framework?: 'vanilla' \| 'vue' \| 'html' }) => { kind: 'module' \| 'style'; url: string } \| null` | —          | Synchronous fallback for imports not resolved from the virtual file map. Return `null` to keep the import unresolved/default-resolved. |
| `bootstrapScript?`         | `string`                                                                                                                                             | —          | Script injected before app execution.                                                                                                  |
| `component`                | `Component`                                                                                                                                          | —          | Vue component rendered in component mode.                                                                                              |
| `componentSource?`         | `string`                                                                                                                                             | `''`       | Source string shown in code tab for component mode.                                                                                    |
| `componentSourceLanguage?` | `string`                                                                                                                                             | `vue`      | Fallback language id when the active component file has no extension.                                                                  |
| `componentFiles?`          | `PlaygroundFiles`                                                                                                                                    | —          | Virtual files for component mode source explorer.                                                                                      |
| `componentEntry?`          | `string`                                                                                                                                             | —          | Entry file key used in component mode.                                                                                                 |
| `componentPadding?`        | `string \| number`                                                                                                                                   | —          | Padding applied around component preview.                                                                                              |
| `componentMinHeight?`      | `string \| number`                                                                                                                                   | —          | Minimum height for component preview panel.                                                                                            |

## Emits

Emitted component events and their payload shapes.

| Name            | Parameters        | ReturnType | Description                                                                                  |
| --------------- | ----------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `run`           | `—`               | `void`     | Emitted when sandbox run starts.                                                             |
| `error`         | `PlaygroundError` | `void`     | Emitted when runtime error is produced.                                                      |
| `preview-ready` | `—`               | `void`     | Emitted when preview is ready (component preview mounted or sandbox iframe preview updated). |
| `ready`         | `—`               | `void`     | Emitted once when playground reaches first ready state.                                      |

## Slots

Available slots and their slot props.

| Name     | Parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ReturnType | Description                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------- |
| `layout` | `[scope: { activeTab: 'code' \| 'preview' \| 'console'; showCode: boolean; setActiveTab: (tab: 'code' \| 'preview' \| 'console') => void; fileNames: string[]; activeFile: string; setActiveFile: (file: string) => void; activeFileContent: string; codeLanguage: string; codeTheme: 'light' \| 'dark'; consoleOutput: string; isRunning: boolean; run: () => Promise<void>; isClient: boolean; bindPreviewIframe: (el: Element \| import('vue').ComponentPublicInstance \| null) => void }]` | `void`     | full custom layout slot with runtime state/actions |

## Custom Renderer Props

Renderer components receive the following props:

| Renderer          | Props                                                                                             | Availability                                 |
| ----------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `tabsRenderer`    | `{ activeTab: VfPlaygroundTab; showCode: boolean; setActiveTab: (tab: VfPlaygroundTab) => void }` | Both modes.                                  |
| `actionsRenderer` | `{ isRunning: boolean; run: () => Promise<void> }`                                                | Sandbox mode only.                           |
| `filesRenderer`   | `{ files: string[]; activeFile: string; setActiveFile: (file: string) => void }`                  | When more than one source file is available. |

`setActiveTab` and `setActiveFile` validate the requested value before changing internal state.
The `run` callback returns `Promise<void>`.

## Events

Native DOM events exposed by the component.

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| `—`  | `—`  | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name                         | Type        | Default | Description                                   |
| ---------------------------- | ----------- | ------- | --------------------------------------------- |
| `VfPlaygroundSharedProps`    | `interface` | `—`     | Shared props contract for both runtime modes. |
| `VfPlaygroundSandboxProps`   | `interface` | `—`     | Props contract for `sandbox` mode.            |
| `VfPlaygroundComponentProps` | `interface` | `—`     | Props contract for `component` mode.          |

## Types

Exported utility and union types.

| Name                     | Values                                                   |
| ------------------------ | -------------------------------------------------------- |
| `VfPlaygroundTab`        | `'code' \| 'preview' \| 'console'`                       |
| `VfPlaygroundHeightMode` | `'fixed' \| 'auto-preview' \| 'auto'`                    |
| `VfPlaygroundProps`      | `VfPlaygroundSandboxProps \| VfPlaygroundComponentProps` |
