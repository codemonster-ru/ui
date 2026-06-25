# Theming

Component styling surface: available classes and design tokens.

## CSS Classes

Documented CSS classes and their intended usage.

| Class | Description |
| --- | --- |
| `.vf-setup-layout` | Root layout element. |
| `.vf-setup-layout--fill-viewport` | Modifier applied when viewport filling is enabled. |
| `.vf-setup-layout--with-brand` | Modifier applied when the brand slot is present. |
| `.vf-setup-layout--with-toolbar` | Modifier applied when the toolbar slot is present. |
| `.vf-setup-layout--with-aside` | Modifier applied when the aside slot is present. |
| `.vf-setup-layout--aside-left` | Modifier for left aside placement. |
| `.vf-setup-layout--aside-right` | Modifier for right aside placement. |
| `.vf-setup-layout__panel` | Setup panel grid. |
| `.vf-setup-layout__panel--surface` | Surface-styled setup panel. |
| `.vf-setup-layout__brand` | Brand slot wrapper. |
| `.vf-setup-layout__toolbar` | Toolbar slot wrapper. |
| `.vf-setup-layout__aside` | Aside slot wrapper. |
| `.vf-setup-layout__header` | Title and description region. |
| `.vf-setup-layout__heading` | Internal heading stack. |
| `.vf-setup-layout__title` | Title element. |
| `.vf-setup-layout__description` | Description element. |
| `.vf-setup-layout__main` | Main content and actions region. |
| `.vf-setup-layout__body` | Default slot wrapper. |
| `.vf-setup-layout__actions` | Actions slot wrapper. |
| `.vf-setup-layout__footer` | Footer slot wrapper. |

## Design Tokens

Available design tokens and corresponding CSS variables.

| Token | CSS Variable | Description |
| --- | --- | --- |
| `setupLayoutBackground` | `--vf-layout-setup-layout-background` | Root background. |
| `setupLayoutPaddingBlock` | `--vf-layout-setup-layout-padding-block` | Vertical root padding. |
| `setupLayoutPanelPadding` | `--vf-layout-setup-layout-panel-padding` | Panel padding. |
| `setupLayoutPanelPaddingCompact` | `--vf-layout-setup-layout-panel-padding-compact` | Compact panel padding below the `xs` breakpoint. |
| `setupLayoutPanelGap` | `--vf-layout-setup-layout-panel-gap` | Gap between stacked panel areas. |
| `setupLayoutPanelBackground` | `--vf-layout-setup-layout-panel-background` | Panel background. |
| `setupLayoutPanelBorder` | `--vf-layout-setup-layout-panel-border` | Panel border. |
| `setupLayoutContainerWidth` | `--vf-layout-setup-layout-container-width` | Container max width. |
| `setupLayoutAsideWidth` | `--vf-layout-setup-layout-aside-width` | Aside column width on medium and wider viewports. |
| `setupLayoutMainGap` | `--vf-layout-setup-layout-main-gap` | Gap between body and actions. |
| `setupLayoutHeaderGap` | `--vf-layout-setup-layout-header-gap` | Gap between title and description. |
| `setupLayoutTitleFontSize` | `--vf-layout-setup-layout-title-font-size` | Title font size. |
| `setupLayoutTitleLineHeight` | `--vf-layout-setup-layout-title-line-height` | Title line height. |
| `setupLayoutDescriptionColor` | `--vf-layout-setup-layout-description-color` | Description and footer text color. |
| `setupLayoutDescriptionLineHeight` | `--vf-layout-setup-layout-description-line-height` | Description and footer line height. |
| `setupLayoutDividerWidth` | `--vf-layout-setup-layout-divider-width` | Desktop divider width between aside and main areas. |
| `setupLayoutDividerColor` | `--vf-layout-setup-layout-divider-color` | Desktop divider color between aside and main areas. |
