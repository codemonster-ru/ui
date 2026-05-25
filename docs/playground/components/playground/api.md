# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `height?` | `string \| number` | — | Fixed height of playground container (number treated as px). |
| `theme?` | `'inherit' \| 'light' \| 'dark'` | `inherit` | Theme mode for rendering. |
| `initialTab?` | `'code' \| 'preview' \| 'console'` | — | Initial active tab on mount. |
| `tabsRenderer?` | `TabsRenderer` | — | Custom renderer component for tabs header. |
| `actionsRenderer?` | `ActionsRenderer` | — | Custom renderer component for sandbox actions area. |
| `filesRenderer?` | `FilesRenderer` | — | Custom renderer component for file tabs/picker. |
| `mode?` | `'sandbox'` | `sandbox` | Selects playground runtime mode (`sandbox` or `component`). |
| `files` | `PlaygroundFiles` | — | Virtual file map for sandbox runtime. |
| `entry` | `string` | — | Entry module path for sandbox runtime. |
| `framework?` | `'vanilla' \| 'vue' \| 'html'` | `vanilla` | Runtime adapter used in sandbox mode. |
| `autorun?` | `boolean` | `true` | Runs sandbox preview automatically on load. |
| `showCode?` | `boolean` | `true` | Shows the code panel in UI. |
| `resolveImport?` | `ResolveImportFn` | — | Custom import resolver for sandbox modules. |
| `bootstrapScript?` | `string` | — | Script injected before app execution. |
| `mode` | `'component'` | — | Selects playground runtime mode (`sandbox` or `component`). |
| `component` | `Component` | — | Vue component rendered in component mode. |
| `componentSource?` | `string` | — | Source string shown in code tab for component mode. |
| `componentSourceLanguage?` | `string` | — | Language id for component source highlighting. |
| `componentFiles?` | `PlaygroundFiles` | — | Virtual files for component mode source explorer. |
| `componentEntry?` | `string` | — | Entry file key used in component mode. |
| `componentPadding?` | `string \| number` | — | Padding applied around component preview. |
| `componentMinHeight?` | `string \| number` | — | Minimum height for component preview panel. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `run` | `—` | `void` | Emitted when sandbox run starts. |
| `error` | `PlaygroundError` | `void` | Emitted when runtime error is produced. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `layout` | `[scope: { activeTab: 'code' \| 'preview' \| 'console'; showCode: boolean; setActiveTab: (tab: 'code' \| 'preview' \| 'console') => void; fileNames: string[]; activeFile: string; setActiveFile: (file: string) => void; activeFileContent: string; codeLanguage: string; codeTheme: 'light' \| 'dark'; consoleOutput: string; isRunning: boolean; run: () => Promise<void>; isClient: boolean; bindPreviewIframe: (el: Element \| import('vue').ComponentPublicInstance \| null) => void }]` | `void` | full custom layout slot with runtime state/actions |

## Events

Native DOM events exposed by the component.

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `VfPlaygroundSharedProps` | `interface` | `—` | Shared props contract for both runtime modes. |
| `VfPlaygroundSandboxProps` | `interface` | `—` | Props contract for `sandbox` mode. |
| `VfPlaygroundComponentProps` | `interface` | `—` | Props contract for `component` mode. |

## Types

Exported utility and union types.

| Name | Values |
| --- | --- |
| `VfPlaygroundTab` | `'code' \| 'preview' \| 'console'` |
| `VfPlaygroundProps` | `VfPlaygroundSandboxProps \| VfPlaygroundComponentProps` |
