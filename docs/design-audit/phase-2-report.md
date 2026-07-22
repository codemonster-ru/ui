# VueForge: отчёт о реализации Phase 2

Дата подготовки: 2026-07-22. Статус: **Phase 2 завершена; целевая color architecture, component migration,
contract-проверки и visual regression выполнены**.

Исторические значения взяты из Phase 0/1 audit-документов, а итоговые значения — из текущей canonical schema.
Phase 0 и Phase 1 не переписываются задним числом.

## 1. Цели и границы Phase 2

Phase 2 намеренно меняет цветовой облик VueForge: вводит целевую OKLCH-палитру, разделяет light/dark semantic
materials, исправляет подтверждённые contrast failures и переводит built-in component mappings на semantic roles.

В scope вошли:

- семь perceptually tuned primitive scales;
- самостоятельные surface, link, selected, hover и active materials;
- WCAG 2.2 contrast matrix только для поддерживаемых semantic pairings;
- semantic-first component mappings с VueForge 1.x fallback;
- state precedence для disabled, invalid, selected/checked, hover/active, focus-visible и read-only;
- собственные согласованные light/dark Shiki themes для CodeBlock;
- Playground theme bridge для зависимостей semantic CSS variables;
- color-system showcase и воспроизводимый desktop/mobile/CVD smoke script;
- regression policy для primitive usage и hardcoded colors.

Вне scope остались geometry, spacing, typography, DOM redesign, удаление legacy tokens и другие breaking changes
VueForge 2. Phase 2 не копирует палитру другой UI-библиотеки и не добавляет отдельный `accent` без продуктового
сценария.

## 2. Палитра до и после

```text
Phase 1
component CSS ───────────────→ legacy/component aliases ─→ 29 sparse HEX primitives
77 semantic roles ───────────→ legacy color roots ────────┘

Phase 2
component CSS → existing component customization token → 85 semantic roles → 66 OKLCH primitives
                                                      └→ VueForge 1.x legacy fallback
```

| Contract                        |        До: Phase 1 |     После: Phase 2 |
| ------------------------------- | -----------------: | -----------------: |
| Primitive tokens                |             **29** |             **66** |
| Semantic roles                  |             **77** |             **85** |
| Additive semantic keys          |             **76** |             **84** |
| Сохранённые legacy keys         |            **847** |            **847** |
| Полный built-in preset          |            **952** |            **997** |
| Root dark overrides             |             **53** |            **137** |
| Canonical alias depth limit     |              **4** |              **5** |
| Custom-prefix alias depth limit |              **9** |             **11** |
| Authoring format                | Existing-value HEX | In-gamut `oklch()` |

`colorFocusRing` остаётся единственным пересечением legacy и semantic sets. Поэтому итоговый preset содержит
`847 + 66 + 84 = 997` уникальных keys. Все 847 ключей VueForge 1.x сохранены; изменение `952 → 997` состоит из
37 новых primitive stops и восьми новых semantic roles.

## 3. Primitive values до и после

### Phase 1 baseline

| Family  | Baseline material values                                                                                                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neutral | `0 #fff`, `50 #f6f8fb`, `100 #f3f3f3`, `200 #d9dde3`, `250 #d7d7d7`, `300 #d4d4d4`, `400 #9da0a6`, `500 #616773`, `600 #363b46`, `700 #272b33`, `750 #252526`, `800 #20232a`, `850 #1f232b`, `900 #17191e`, `950 #111827`, `1000 #000` |
| Primary | `500 #276cb5`, `600 #0e639c`                                                                                                                                                                                                           |
| Success | `500 #2e7d32`, `600 #37783e`                                                                                                                                                                                                           |
| Info    | `500 #0077a3`, `600 #1a739f`                                                                                                                                                                                                           |
| Warning | `400 #b79a63`, `500 #a1841f`, `950 #1f1300`                                                                                                                                                                                            |
| Danger  | `500 #bf3f3f`, `600 #c72e39`                                                                                                                                                                                                           |
| Help    | `500 #7b4c96`, `600 #6e43a2`                                                                                                                                                                                                           |

Эти 29 materials сохраняли исходный rendered output, но не образовывали полноценных state scales. Один и тот же
chromatic material часто использовался и как solid background, и как foreground.

### Phase 2 neutral scale

Neutral использует hue `260` и низкую chroma. Крайние stops не являются абсолютными white/black; surface hierarchy
строится lightness, а не случайным blue cast.

| Step | OKLCH                    | Назначение                           |
| ---: | ------------------------ | ------------------------------------ |
|    0 | `oklch(99.5% 0.002 260)` | light surface и light on-solid       |
|   50 | `oklch(97.8% 0.005 260)` | light canvas                         |
|  100 | `oklch(95.8% 0.007 260)` | light subtle/hover/disabled          |
|  200 | `oklch(90% 0.012 260)`   | light divider; dark primary text     |
|  250 | `oklch(84% 0.016 260)`   | light default border                 |
|  300 | `oklch(74.5% 0.020 260)` | dark secondary text                  |
|  400 | `oklch(65% 0.026 260)`   | light interactive border; dark muted |
|  500 | `oklch(55% 0.032 260)`   | light muted; dark interactive border |
|  600 | `oklch(48.8% 0.030 260)` | light secondary; dark default border |
|  700 | `oklch(40.5% 0.025 260)` | dark subtle border/divider           |
|  750 | `oklch(33% 0.020 260)`   | dark elevated/active surface         |
|  800 | `oklch(29% 0.018 260)`   | dark subtle/hover surface            |
|  850 | `oklch(25.6% 0.014 260)` | light primary text; dark surface     |
|  900 | `oklch(21.4% 0.010 260)` | dark canvas                          |
|  950 | `oklch(16.5% 0.008 260)` | dark on-bright/inverse text          |
| 1000 | `oklch(11.5% 0.006 260)` | backdrop/shadow material             |

### Phase 2 chromatic scales

Chroma вручную возрастает к полезным средним stops и снижается на концах. Scales mode-independent; light/dark
semantic maps выбирают разные stops, поэтому dark theme не является механической инверсией light.

| Family  | Hue | Steps: `lightness/chroma`                                                                                                                         |
| ------- | --: | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary | 247 | `100 95.5/.020`, `200 89/.050`, `300 76/.110`, `400 65/.140`, `500 55.7/.144`, `600 50/.130`, `700 45/.115`, `800 38.5/.090`, `900 30.5/.055`     |
| Success | 148 | `100 95.5/.020`, `300 79/.125`, `400 68/.145`, `500 59/.135`, `600 51.5/.115`, `700 45.5/.105`, `800 38.5/.080`, `900 30.5/.040`                  |
| Info    | 230 | `100 95.5/.018`, `300 78.5/.105`, `400 68/.130`, `500 60/.118`, `600 52.5/.103`, `700 46.5/.091`, `800 39.5/.075`, `900 30.5/.038`                |
| Warning |  88 | `100 96/.035`, `300 81.5/.115`, `400 76/.130`, `500 68.5/.125`, `600 61.5/.115`, `700 54/.105`, `800 47.5/.095`, `900 31.5/.035`, `950 21.5/.043` |
| Danger  |  20 | `100 95.5/.020`, `300 76/.142`, `400 66.5/.180`, `500 60.5/.180`, `600 53.5/.170`, `700 47.5/.150`, `800 40.5/.120`, `900 30/.050`                |
| Help    | 307 | `100 95.5/.020`, `300 77/.115`, `400 67/.145`, `500 60/.150`, `600 52/.130`, `700 44.5/.115`, `800 38/.090`, `900 29.5/.045`                      |

`help` сохраняется отдельной violet family: это существующий public tone для actions, feedback и progress. Все 66
authored values находятся внутри sRGB gamut, что защищает contrast расчёты от browser gamut mapping.

## 4. Semantic values до и после

В Phase 1 большинство ролей были aliases к 36 legacy color sources; hover/active/selected частично вычислялись через
multi-source `color-mix`. В Phase 2 light и dark получают полные самостоятельные 85-role maps.

Восемь новых ролей:

- `colorBackgroundSurfaceSelectedHover`;
- `colorBackgroundSurfaceSelectedActive`;
- `colorBackgroundInverseHover`;
- `colorBackgroundInverseActive`;
- `colorTextLink`;
- `colorTextLinkHover`;
- `colorTextLinkActive`;
- `colorInteractivePrimarySubtleForeground`.

| Role group                       | Phase 1                              | Phase 2 light      | Phase 2 dark       |
| -------------------------------- | ------------------------------------ | ------------------ | ------------------ |
| canvas / surface / subtle        | existing N50 / N0 / N100             | N50 / N0 / N100    | N900 / N850 / N800 |
| elevated                         | surface alias                        | N0                 | N750               |
| hover / active                   | text mix `6% / 10%`                  | N100 / N200        | N800 / N750        |
| selected / hover / active        | primary mix `20%`; no compound roles | P100 / P200 / P300 | P900 / P800 / P700 |
| inverse / hover / active         | legacy contrast; no compound roles   | N850 / N800 / N750 | N200 / N300 / N400 |
| text primary / secondary / muted | legacy text/muted aliases            | N850 / N600 / N500 | N200 / N300 / N400 |
| disabled / placeholder           | both inherited muted                 | N400 / N500        | N500 / N400        |
| link default / hover / active    | overloaded primary                   | P700 / P800 / P900 | P300 / P200 / P400 |
| border subtle / default          | one legacy border                    | N200 / N250        | N700 / N600        |
| border strong / interactive      | one legacy border                    | N400 / N400        | N500 / N500        |
| focus border / ring              | weak primary mixes                   | P600 / P600        | P300 / P300        |
| primary solid / hover / active   | one base material                    | P600 / P700 / P800 | P500 / P600 / P700 |
| primary subtle bg / fg           | soft mix / primary                   | P100 / P700        | P900 / P300        |

Status roles остаются восемью независимыми decisions для каждой из success, warning, danger, info и help:

| Status material          | Phase 1            | Phase 2 light                | Phase 2 dark       |
| ------------------------ | ------------------ | ---------------------------- | ------------------ |
| solid                    | legacy base        | 600; warning 400             | 500                |
| on-solid                 | legacy contrast    | N0; warning N950             | N950; warning N950 |
| hover / active           | same base material | 700 / 800; warning 500 / 600 | 400 / 300          |
| subtle background        | 12% color mix      | 100                          | 900                |
| subtle foreground / icon | overloaded base    | 700; warning 800             | 300                |
| border                   | soft mix           | 500; warning 700             | 400                |

Opaque interactive materials дают одинаковый итог на canvas, surface и elevated containers. Прозрачность сохранена
только для композиционных backdrop/shadow сценариев.

## 5. Контрастность до и после

Baseline использует исторические computed sRGB ratios. Итоговые ratios рассчитаны из canonical OKLCH values той же
WCAG 2.2 luminance формулой, которую использует regression test.

| Pairing                                        |                                  До light / dark | После light / dark | Минимум |
| ---------------------------------------------- | -----------------------------------------------: | -----------------: | ------: |
| Primary text / surface                         |                                  `15.75 / 10.61` |    `15.50 / 11.67` |     4.5 |
| Muted text / canvas                            |                                    `5.34 / 6.71` |      `4.55 / 5.43` |     4.5 |
| Primary/link foreground / surface              |                                    `6.40 / 2.92` |      `7.30 / 7.39` |     4.5 |
| Danger foreground / surface                    |                                    `5.41 / 2.99` |      `7.13 / 6.89` |     4.5 |
| Help foreground / surface                      |                                    `7.03 / 2.48` |      `7.91 / 7.29` |     4.5 |
| Warning foreground / surface                   |                                    `3.60 / 5.85` |      `6.62 / 8.83` |     4.5 |
| Interactive control border / surface           |                                    `1.36 / 1.40` |      `3.19 / 3.24` |     3.0 |
| Focus ring / surface                           |                                    `1.65 / 1.52` |      `5.89 / 7.39` |     3.0 |
| Selected foreground / strongest selected state |                                    `4.73 / 2.42` |      `4.59 / 5.35` |     4.5 |
| Status subtle foreground / background, minimum |                                    `3.16 / 2.27` |      `5.98 / 6.10` |     4.5 |
| Status border / subtle background, minimum     | прежние soft-border recipes не гарантировали 3:1 |      `3.38 / 4.19` |     3.0 |
| CodeBlock syntax foreground, minimum           |                                    `3.15 / 2.95` |      `5.59 / 6.18` |     4.5 |

Supported matrix также проверяет primary/on-solid, inverse, placeholder, links, status solid/hover/active, meaningful
icons, borders и progress materials. Это конечный список реальных pairings, а не бессмысленный Cartesian product.

## 6. Исправленные WCAG-нарушения

На уровне built-in semantic contract исправлены:

- focus ring и focus border, ранее не достигавшие 3:1;
- interactive boundaries Input/Select/Checkbox/Radio/Switch;
- dark primary/link, danger и help foregrounds;
- light warning foreground;
- status foreground/icon/border на subtle surfaces;
- dark selected/current foreground и отдельные selected + hover/active states;
- CodeBlock syntax tokens, editor background pairing, selection и copy-button focus;
- secondary, muted и placeholder pairings без повторного subtree opacity;
- primary/status solids и их independently authored on-solid foregrounds;
- invalid + checked/open/focus precedence, при котором danger boundary больше не исчезает.

Disabled roles намеренно не доводятся до уровня активного текста: unavailable controls исключены из соответствующих
WCAG criteria, но получают явные fg/bg/border/cursor materials и больше не ослабляются повторным opacity там, где CSS
был мигрирован.

## 7. Осознанные исключения и CVD/non-color cues

Цветовая матрица гарантирует luminance contrast, но не доказывает передачу смысла без hue. В showcase зафиксированы
существующие non-color cues: Alert icons, Checkbox/Radio marks, selected indicator/position/weight и focus geometry.
Visual script подготавливает отдельные protanopia, deuteranopia, tritanopia и achromatopsia captures для обеих тем.
Все восемь CVD captures проверены вручную. Alert/status labels и icons, control marks, focus geometry и selected
position/weight сохраняют читаемую структуру в обеих темах. При achromatopsia chromatic materials закономерно теряют
hue distinction, но встроенные showcase-сценарии не полагаются только на неё. Перечисленные ниже API-исключения
остаются осознанными ограничениями.

Осознанно остаются продуктовые/API исключения:

- `Alert` может лишиться второго сигнала при `hideIcon`; consumer должен сохранить понятный title/text;
- `Badge` и `Tag` tone не добавляют иконку автоматически;
- `ProgressBar` и `ProgressSpinner` tone по-прежнему требует внешней label/context semantics;
- выбранный option в `VfSelect` имеет ARIA/state semantics, но внутри открытого списка визуально различается в основном
  цветом selected material;
- invalid control без supporting message/icon может сообщать ошибку только boundary hue;
- custom content может удалить встроенные shape/label cues;
- disabled content имеет intentionally lower contrast и должен определяться также cursor/behavior/ARIA semantics.

Phase 2 не меняет component props или DOM ради автоматической вставки cue: это было бы отдельным public API решением.
Ни одно syntax role не требует пониженного text-contrast исключения: package fallbacks рассчитаны минимум на 4.5:1.

## 8. Мигрированные компоненты и состояния

Built-in component-token defaults теперь semantic-first, а CSS сохраняет legacy/component fallback. Миграция охватывает:

| Группа        | Компоненты/области                                                                                       | Основные изменения                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Foundations   | root, prose, inline code, text utilities, HorizontalScroller, Divider                                    | canvas/text/link/divider/focus roles                                      |
| Actions       | Button, IconButton, Link                                                                                 | independent solid hover/active, 3:1 secondary boundary, disabled/focus    |
| Forms         | Field, Fieldset, Input, Textarea, Select, Checkbox, Radio, Switch                                        | 3:1 boundaries, read-only, invalid/open/checked/focus precedence          |
| Navigation    | Accordion, Breadcrumbs, Dropdown, MenuBar, NavMenu, Tabs, TableOfContents, Stepper                       | selected + hover/active roles, disabled suppression, link/indicator roles |
| Overlays      | Dialog, Drawer, CommandPalette; preset mappings for Popover/Tooltip                                      | elevated/inverse/backdrop/border/focus roles                              |
| Feedback/data | Alert, Avatar, Badge, Tag, ProgressBar, ProgressSpinner, Skeleton, Card, Panel, Table/DataTable mappings | separate status fg/bg/border/icon and surface hierarchy                   |
| Layouts       | AdminLayout/Shell, AppShell, Auth/Document/Error/Setup layouts                                           | semantic-first canvas/surface/text roots with legacy fallback             |
| Ecosystem     | CodeBlock, Playground, sandbox runtime                                                                   | scoped semantic adapters and full dependency propagation                  |

`Alert`, `DataTable` и `Fieldset` продолжают обращаться к собственным component tokens, когда это реальная
customization boundary; их default values теперь semantic. Primitive references в component CSS запрещены.

### Compound states

Новая precedence model:

1. disabled suppresses hover/active и применяет собственные fg/bg/border roles;
2. invalid boundary остаётся поверх checked/open, а focus добавляет ring и не стирает invalid;
3. selected/checked задаёт base material;
4. selected + hover и selected + active используют отдельные opaque roles;
5. обычные hover/active применяются только без более приоритетного состояния;
6. focus-visible добавляется, не заменяя selected/checked/open;
7. read-only использует subtle surface, но invalid сохраняет danger boundary.

`VfSwitch static` остаётся интерактивным visual variant: он удерживает static track recipe, но сохраняет hover и
focus-visible cues и не использует disabled semantics.

Button/IconButton больше не используют `brightness()` для built-in state colors. Legacy filter hooks
`--vf-button-solid-hover-filter` и `--vf-button-solid-active-filter` сохранены; их built-in default теперь `none`, поэтому
существующая custom CSS может продолжить использовать hook без возврата фильтра в стандартную палитру.

### CodeBlock и Shiki

`github-light`/`github-dark` больше не смешиваются с VueForge background. Lazy highlighter создаёт package-owned
`vueforge-light`/`vueforge-dark` CSS-variable themes, где syntax background, foreground, comments, strings, constants,
keywords, parameters, functions, diff/ANSI roles и selection согласованы с semantic palette. Добавлена `diff` language,
copy focus outline и единый editor/code background. Standalone OKLCH fallbacks — документированное исключение из
hardcoded-color policy и проверяются отдельным gamut/contrast contract. Exact Shiki adapters закреплены по каждой syntax
variable; default Core semantic resolutions отдельно проверяются на фактическом neutral-subtle editor surface.

Публичный `--vf-codeblock-disabled-opacity` остаётся рабочим VueForge 1.x hook. Его built-in default изменён с `0.6` на
`1`, чтобы disabled state не снижал контраст всего syntax subtree; явный consumer override продолжает применяться, а
disabled copy action не раскрывается и не получает hover/focus treatment.

## 9. Legacy tokens как compatibility layer

Все **847** pre-Phase-1 keys сохранены, ни один legacy token не удалён и не переименован. Существующие component-token
overrides остаются customization boundary:

```text
component CSS
  → --vf-input-border-color
  → --vf-color-border-interactive
  → var(--vf-color-border) compatibility fallback
```

Primitive и semantic fields остаются optional в `VfThemeTokens`, поэтому complete VueForge 1.x preset продолжает
type-check. Custom prefix runtime/static paths должны создавать canonical `--vf-*` aliases, как в Phase 0/1.

Совместимость не означает прежнее fan-out поведение: например, `colorDanger` теперь остаётся solid compatibility root и
не обязан одновременно определять subtle text, icon, border, hover и active. Это намеренное устранение перегруженной
семантики; для полной custom scale нужны соответствующие semantic overrides.

## 10. Изменённые файлы

Список отражает Phase 2 working tree на момент подготовки отчёта; generated `dist`/build artifacts не включены.

### Theme и Core color contract

- `packages/theme/src/color-token-contract.ts`
- `packages/theme/__tests__/runtime.spec.ts`
- `packages/core/src/theme/color-token-schema.ts`
- `packages/core/src/theme/color-token-schema.spec.ts`
- `packages/core/src/theme/color-contrast.spec.ts`
- `packages/core/src/theme/default-preset-source.ts`
- `packages/core/src/theme/theme-contract.spec.ts`
- `packages/core/src/theme/theme.spec.ts`

### Core component migration и policy

- `packages/core/src/styles/components/base.css`
- `packages/core/src/styles/components/horizontal-scroller.css`
- `packages/core/src/styles/entries/breadcrumbs.css`
- `packages/core/src/styles/entries/button.css`
- `packages/core/src/styles/entries/checkbox.css`
- `packages/core/src/styles/entries/command-palette.css`
- `packages/core/src/styles/entries/dialog.css`
- `packages/core/src/styles/entries/drawer.css`
- `packages/core/src/styles/entries/dropdown.css`
- `packages/core/src/styles/entries/field.css`
- `packages/core/src/styles/entries/icon-button.css`
- `packages/core/src/styles/entries/input.css`
- `packages/core/src/styles/entries/link.css`
- `packages/core/src/styles/entries/menu-bar.css`
- `packages/core/src/styles/entries/nav-menu.css`
- `packages/core/src/styles/entries/progress-bar.css`
- `packages/core/src/styles/entries/progress-spinner.css`
- `packages/core/src/styles/entries/radio.css`
- `packages/core/src/styles/entries/select.css`
- `packages/core/src/styles/entries/stepper.css`
- `packages/core/src/styles/entries/switch.css`
- `packages/core/src/styles/entries/table-of-contents.css`
- `packages/core/src/styles/entries/tabs.css`
- `packages/core/src/styles/entries/textarea.css`
- `packages/core/src/components/stepper/VfStepper.spec.ts`
- `packages/core/src/styles/component-palette-contract.spec.ts`
- `packages/core/src/styles/component-entry-parity.spec.ts`
- `packages/core/src/styles/prose-contract.spec.ts`
- `packages/core/scripts/check-css-parity.mjs`
- `packages/core/scripts/check-form-geometry.mjs`
- `packages/core/scripts/smoke-css-export.mjs`

### CodeBlock и Playground

- `packages/codeblock/src/themes/vueforge.ts`
- `packages/codeblock/src/themes/vueforge.test.ts`
- `packages/codeblock/src/services/code-highlight.ts`
- `packages/codeblock/src/tokens.css`
- `packages/codeblock/src/codeblock.css`
- `packages/codeblock/src/types.ts`
- `packages/codeblock/src/components/__tests__/VfCodeBlock.test.ts`
- `packages/playground/src/tokens.css`
- `packages/playground/src/playground.css`
- `packages/playground/src/VfPlayground.vue`
- `packages/playground/src/VfPlayground.spec.ts`
- `packages/playground-core/src/runtimes/browserRuntime.ts`
- `packages/playground-core/__tests__/browserRuntime.test.ts`

### Layouts semantic roots

- `packages/layouts/src/style-entries/admin-layout.css`
- `packages/layouts/src/style-entries/admin-shell.css`
- `packages/layouts/src/style-entries/app-shell.css`
- `packages/layouts/src/style-entries/auth-layout.css`
- `packages/layouts/src/style-entries/document-layout.css`
- `packages/layouts/src/style-entries/error-layout.css`
- `packages/layouts/src/style-entries/setup-layout.css`
- `packages/layouts/src/style-parts/shell.css`

### Showcase, visual automation и documentation

- `examples/playground/src/App.vue`
- `examples/playground/src/sections/colors/ColorSystemShowcase.vue`
- `examples/playground/src/sections/colors/color-system-showcase.css`
- `examples/playground/vite.config.ts`
- `scripts/visual/phase-2-color-smoke.mjs`
- `package.json`
- `docs/core/guides/color-tokens.md`
- `packages/core/docs/theme-api.md`
- `docs/codeblock/components/code-block/theming.md`
- `docs/playground/components/playground/theming.md`
- `docs/design-audit/phase-2-report.md`
- `docs/design-audit/color-inventory.md` — только historical banner
- `docs/design-audit/accessibility-colors.md` — только historical banner
- `docs/design-audit/color-audit-report.md` — только historical banner
- `packages/core/docs/visual-baseline.md` — только historical banner

## 11. Публичные изменения

Additive public contract:

- Theme/Core name tuples и derived types содержат 37 новых primitive names и восемь semantic names;
- `VfThemeTokens` принимает новые optional fields;
- CSS contract публикует те же 997 names в runtime/static/full/foundation + component/scoped/custom-prefix paths;
- `diff` добавлен в `SUPPORTED_CODE_BLOCK_LANGUAGES`;
- CodeBlock получает новые syntax/selection/copy-focus CSS customization variables;
- `/colors` добавлен только в repository showcase, не в library runtime API.

Не изменены component props, events, slots, DOM contracts, CSS export paths и signatures theme runtime. Public constants
`SHIKI_LIGHT_THEME`/`SHIKI_DARK_THEME` сохранены для source compatibility, хотя built-in highlighter теперь использует
package-owned themes.

Intentional behavioral changes:

- built-in palette и rendered colors меняются;
- built-in runtime CSS требует browser support для `oklch()` наряду с уже используемым `color-mix()`;
- raw custom-property values могут быть OKLCH/aliases вместо прежних HEX/recipes;
- перегруженный legacy root больше не управляет всеми semantic descendants автоматически;
- compound selected hover/active roles имеют приоритет над одним base component override.
- secondary Button/IconButton используют validated interactive border вместо decorative default border;
- neutral ProgressBar label использует semantic inverse-text role вместо background role;
- built-in `--vf-codeblock-disabled-opacity` равен `1` вместо `0.6`; hook остаётся активным, disabled copy не раскрывается.

## 12. Риски для custom themes

1. **Partial root override.** Изменение только `colorPrimary` или status root больше не задаёт всю scale. Нужны semantic
   solid/subtle/foreground/border/hover/active overrides.
2. **Compound states.** `tabsTabActiveBackground` и аналогичный 1.x component token сохраняют base selected fallback, но
   selected + hover/active используют новые semantic roles.
3. **OKLCH support.** Built-in preset не дублирует каждую runtime variable вторым sRGB declaration, иначе разойдутся
   static/runtime/scoped/custom-prefix maps. Старый browser matrix требует custom sRGB preset.
4. **Custom prefix.** Ручной CSS с нестандартным prefix без canonical aliases не подходит compiled component CSS;
   используйте VueForge runtime/static builder.
5. **CodeBlock.** Third-party Shiki colors должны проектироваться вместе с фактическим CodeBlock background. Подмена
   отдельных inline token colors без background contract снова создаст прежний mismatch.
6. **Filter hooks.** Existing custom Button/IconButton filters продолжают применяться; сочетание custom filter с новыми
   authored state colors требует визуальной перепроверки.
7. **Raw-value introspection.** Код, сравнивающий строки из `getPropertyValue()` вместо computed rendered color, увидит
   новые OKLCH/`var()` representations.
8. **CodeBlock disabled opacity.** Built-in block больше не ослабляет весь syntax subtree. Если прежнее визуальное
   затемнение было частью custom theme, задайте `--vf-codeblock-disabled-opacity` явно и перепроверьте syntax contrast.

## 13. Migration notes

Для custom preset VueForge 1.x:

1. Сохраните legacy/component overrides, которые являются локальной customization boundary.
2. Перенесите общие решения в semantic roles; не используйте primitives непосредственно в component CSS.
3. Для primary задайте solid, hover, active, subtle background/foreground, border и selected roles независимо.
4. Для каждого status задайте восемь roles, особенно отдельные solid и subtle foreground.
5. Для selected recipe настройте base, selected-hover и selected-active вместе.
6. Проверьте light и dark независимо, включая root dark/local light и root light/local dark.
7. Проверьте supported contrast matrix; не считайте любой произвольный foreground/background поддерживаемой парой.
8. При собственном CodeBlock/Shiki adapter синхронизируйте editor background, syntax foregrounds, selection и focus.
9. Если нужен pre-OKLCH browser support, поставьте собственные sRGB token values через тот же public theme contract.
10. Не удаляйте `colorWarn*` и другие legacy names до VueForge 2.
11. Если custom theme полагалась на прежний CodeBlock disabled fade, задайте `--vf-codeblock-disabled-opacity: 0.6`
    явно; built-in default теперь `1`, а сам hook не удалён.

## 14. Результаты тестов и сборок

Итоговые проверки выполнены после стабилизации working tree.

| Проверка                                       | Команда/contract                     | Результат                                                      |
| ---------------------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| Полный workspace suite                         | `npm test`                           | **PASS** — 420 Vitest tests и package smoke contracts          |
| TypeScript                                     | `npm run typecheck`                  | **PASS** во всех workspaces                                    |
| ESLint, Stylelint, HTML, Markdown, data        | `npm run lint:all`                   | **PASS**, включая 286 Markdown files                           |
| Library packages                               | `npm run build`                      | **PASS** — восемь library packages                             |
| Demo/docs production build                     | `npm run build:demo`                 | **PASS**; только Vite warning о размере production chunk       |
| Clean install и CI-like полный gate            | `npm run verify`                     | **PASS**, включая clean install, checks, no-dist tests и build |
| Packed consumers и type contracts              | Core/package consumer smokes         | **PASS**                                                       |
| CSS exports/full/component-entry               | Core CSS export/parity contracts     | **PASS**                                                       |
| Runtime/static/scoped/custom-prefix/fallback   | Theme/Core exact-map contracts       | **PASS** — одинаковые 997 names                                |
| Semantic contrast matrix и in-gamut primitives | `color-contrast.spec.ts`             | **PASS** — 66 primitives и 15 supported-pairing tests          |
| Hardcoded color/primitive usage policy         | `component-palette-contract.spec.ts` | **PASS**                                                       |
| CodeBlock Shiki gamut/contrast/theme adapter   | `vueforge.test.ts` + CodeBlock suite | **PASS** — exact syntax map, 51 package tests                  |
| Production browser console/network errors      | `npm run visual:phase2`              | **PASS** — 0 browser errors и 0 network failures               |

Implemented contracts проверяют 66/85/997 counts, 847 legacy keys, 137 dark overrides, alias graph, supported semantic
pairings, реальные Alert/Badge/Tag/Field/Progress/CodeBlock combinations, standalone CodeBlock fallbacks, exact Shiki
adapter roles, semantic-first legacy fallback shape и запрет новых raw colors/primitives в package component CSS.
Разрешённый literal exception ограничен шестью standalone CodeBlock OKLCH fallbacks; composition keywords
`transparent`/`currentColor` не являются palette materials. Единственное прямое primitive mapping — документированный
composited `overlayFloatShadow` с двумя alpha-levels Neutral 1000.

## 15. Visual regression summary

Добавлена команда `npm run visual:phase2`. Script проверяет четыре routes (`/colors`, `/core`, `/codeblock`,
`/playground`) в light/dark на desktop `1440×1100` и mobile `390×844`:

- **16** обычных screenshots;
- **8** CVD screenshots: protanopia, deuteranopia, tritanopia и achromatopsia × light/dark;
- rendered primitives/statuses/semantic surfaces и scoped light/dark panels;
- visible focus, control boundary и invalid states;
- browser-computed cascade для invalid + focus/open, disabled Dropdown/navigation/Select hover, secondary action boundary
  и selected + hover/active через `CSS.forcePseudoState`;
- CodeBlock Shiki tokens, matching editor background, selection/copy focus и resolved scope;
- Playground surface, border, content/iframe и resolved scope;
- horizontal overflow, browser/runtime/console errors, HTTP failures и `Network.loadingFailed` для local assets.

При `VUEFORGE_VISUAL_BASELINE_DIR` script требует точного совпадения bytes с предоставленным baseline; без переменной
создаёт manifest с SHA-256 для ручного before/after review.

Фактический production browser run завершён: получены **16** обычных и **8** CVD screenshots. Manifest сохранён в
`/private/tmp/vueforge-phase2/manifest.json`; `browserErrors` и `networkErrors` пусты. Все desktop/mobile captures
проверены вручную: document-level horizontal overflow отсутствует, а внутренний horizontal scroll длинного CodeBlock
является ожидаемым поведением.

Before/after выполнен относительно заново собранного commit Phase 1 `dc2b333` на одинаковых desktop routes Core,
CodeBlock и Playground в light/dark. Exact byte comparison не применялся: Phase 2 намеренно меняет палитру, state
showcase и добавляет новый `/colors` route, поэтому pixel identity не является корректным acceptance criterion.
Ручное сравнение не выявило изменений geometry, typography или document structure.

Наблюдаемые намеренные визуальные изменения:

- neutral canvas/surface hierarchy стала менее случайно синей и лучше разделяется borders в обеих темах;
- primary/status foregrounds, solids, subtle materials и state colors получили новую OKLCH-палитру;
- focus, control и secondary action boundaries стали заметнее;
- CodeBlock syntax и editor background теперь образуют одну light/dark theme pair;
- Playground использует те же editor/surface roles, что CodeBlock и Core;
- disabled CodeBlock больше не ослабляет весь syntax subtree built-in opacity `0.6`.

Все восемь CVD captures проверены для light/dark. Status labels/icons, focus outline и structural selected cues остаются
видимыми; известные случаи, где consumer может убрать non-color cue или selected option остаётся преимущественно
цветовым, перечислены в разделе 7.

## 16. Оценка цветовой системы до и после

Baseline scores сохранены из исходного аудита. Итоговые scores учитывают architecture/contracts, contrast matrix и
ручную оценку desktop/mobile/CVD captures из раздела 15.

| Область               | До Phase 0 | После Phase 2 | Обоснование                                                    |
| --------------------- | ---------: | ------------: | -------------------------------------------------------------- |
| Архитектура токенов   |       4/10 |          9/10 | canonical OKLCH scales, mode maps, semantic component boundary |
| Гармоничность палитры |       6/10 |          8/10 | coherent hue/chroma progression подтверждена visual review     |
| Neutral palette       |       6/10 |          8/10 | separate surface hierarchy, text and boundary steps            |
| Primary               |       5/10 |          8/10 | independent solid/link/subtle/selected states                  |
| Semantic colors       |       4/10 |          9/10 | independent status fg/bg/border/icon/interaction roles         |
| Light theme           |       7/10 |          8/10 | stronger hierarchy/focus without heavy borders                 |
| Dark theme            |       4/10 |          8/10 | separately authored surfaces and chromatic foregrounds         |
| Component states      |       5/10 |          8/10 | documented compound precedence and semantic-first migration    |
| Accessibility         |       4/10 |          9/10 | supported text/UI/syntax matrix и CVD review проходят criteria |
| Consistency           |       5/10 |          8/10 | shared roles across Core, CodeBlock and Playground             |
| Visual uniqueness     |       5/10 |          7/10 | restrained VueForge character retained after visual review     |
| Scalability           |       4/10 |          9/10 | machine-readable names, graph/contrast/policy/export contracts |

## 17. Что остаётся для следующей фазы

После Phase 2 остаются:

- решения public API для non-color cues Badge/Tag/Progress и invalid controls, если automatic cue действительно нужен;
- дальнейшая semantic migration оставшихся ecosystem-specific component mappings, не затронутых текущим diff;
- persistent reviewed screenshot baselines и CI pixel-diff policy вместо только локального script;
- forced-colors/high-contrast и Axe/browser-level accessibility gates;
- visited-link policy и дополнительные pairings только при появлении реального сценария;
- расширение browser matrix sRGB fallback preset, если product support выйдет за modern `oklch()` browsers;
- дальнейший reduced-motion/motion-state audit, который не относится напрямую к цветовой палитре;
- документированная deprecation/migration cycle и удаление legacy bridge только в VueForge 2.

Phase 2 не удаляет legacy tokens и не начинает breaking cleanup VueForge 2.
Работа остановлена на границе Phase 2; перечисленные пункты не реализовывались в этом commit.
