# API

## Props

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
| `maxHeight?` | `string` | `''` | Maximum block height before scrolling. |
| `ariaLabel?` | `string` | `Code block` | Accessible label for screen readers. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `copy` | `{ text: string }` | `void` | Emitted on `copy` interaction. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `actions` | `—` | `void` | custom controls in header action area |

## Events

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `CodeBlockProps` | `interface` | `—` | Public props contract for `VfCodeBlock`. |
| `CodeBlockCopyPayload` | `interface` | `—` | Payload emitted by `copy` event. |
| `CodeBlockPluginOptions` | `interface` | `—` | Plugin options for runtime theme variable injection. |
| `CodeBlockThemeVarOptions` | `interface` | `—` | Theme vars grouped into `base/light/dark` maps. |

## Types

| Name | Values |
| --- | --- |
| `CodeBlockTheme` | `'inherit' \| 'light' \| 'dark'` |
| `SupportedCodeBlockLanguage` | `'plaintext' \| 'text' \| 'txt' \| 'js' \| 'javascript' \| 'ts' \| 'typescript' \| 'vue' \| 'html' \| 'json' \| 'bash' \| 'shell' \| 'sh' \| 'css' \| 'scss' \| 'sass'` |
| `CodeBlockLanguage` | `SupportedCodeBlockLanguage \| string` |
