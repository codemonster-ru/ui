# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `code?` | `string` | `''` | Source code string rendered in the block. |
| `language?` | `CodeBlockLanguage` | `plaintext` | Language id used for syntax highlighting. |
| `filename?` | `string` | `''` | Optional filename shown in header. |
| `showHeader?` | `boolean` | `true` | Shows code block header with filename/actions. |
| `showLineNumbers?` | `boolean` | `false` | Shows line numbers alongside code. |
| `copyable?` | `boolean` | `true` | Enables copy-to-clipboard action. |
| `copyLabel?` | `string` | `Copy` | Button label before copy action. |
| `copiedLabel?` | `string` | `Copied` | Button label after successful copy. |
| `copiedDuration?` | `number` | `1200` | Duration (ms) for copied state. |
| `theme?` | `'inherit' \| 'light' \| 'dark'` | `inherit` | Theme mode for rendering. |
| `wrap?` | `boolean` | `false` | Enables long-line wrapping. |
| `highlight?` | `boolean` | `true` | Enables syntax highlighting. |
| `minHeight?` | `string` | `''` | Minimum block height for the code area. |
| `maxHeight?` | `string` | `''` | Maximum block height before scrolling. |
| `ariaLabel?` | `string` | `Code block` | Accessible label for screen readers. |
| `allowedLanguages?` | `string[]` | `undefined` | Local allowlist override for this component instance. |
| `languageFallback?` | `'plaintext' \| 'text'` | `plaintext` | Fallback language when requested language is not in allowlist. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `copy` | `{ text: string }` | `void` | Emitted on `copy` interaction. |
| `ready` | `—` | `void` | Emitted once after the first completed code render cycle. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `actions` | `—` | `void` | custom controls in header action area |

## Events

Native DOM events exposed by the component.

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `CodeBlockProps` | `interface` | `—` | Public props contract for `VfCodeBlock`. |
| `CodeBlockCopyPayload` | `interface` | `—` | Payload emitted by `copy` event. |
| `CodeBlockPluginOptions` | `interface` | `—` | Plugin options for runtime theme vars and language loading policy. |
| `CodeBlockThemeVarOptions` | `interface` | `—` | Theme vars grouped into `base/light/dark` maps. |

## Types

Exported utility and union types.

| Name | Values |
| --- | --- |
| `CodeBlockTheme` | `'inherit' \| 'light' \| 'dark'` |
| `SupportedCodeBlockLanguage` | `'plaintext' \| 'text' \| 'txt' \| 'js' \| 'javascript' \| 'ts' \| 'typescript' \| 'vue' \| 'html' \| 'json' \| 'bash' \| 'shell' \| 'sh' \| 'css' \| 'scss' \| 'sass'` |
| `CodeBlockLanguage` | `SupportedCodeBlockLanguage \| string` |
