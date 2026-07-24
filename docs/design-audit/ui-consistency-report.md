# VueForge 2 — финальный аудит UI consistency

Дата аудита: 2026-07-24.

## Область и ограничения

Проверены публичные интерактивные компоненты VueForge Core перед релизом 2.0: их состояния,
геометрия, semantic state tokens, переходы, focus treatment и поведение в светлой и тёмной темах.
Изменения ограничены подтверждёнными визуальными несогласованностями. Архитектура, public API,
props, exports, accessibility contracts, SSR, package structure, build pipeline, палитра OKLCH и
набор design tokens не менялись.

Фактические публичные границы отличаются от части формулировок исходного задания:

- `VfTooltipPlacement` поддерживает только `top | bottom`; `left` и `right` не добавлялись, поскольку
  это изменило бы public API;
- `VfNavMenu` поддерживает `default | pills | sidebar`; вариантов `filled` и `soft` нет;
- отдельного публичного `VfToggle` и отдельного `VfMenu` нет; проверены `VfSwitch`,
  `VfThemeSwitch` и `VfMenuBar`;
- `VfBadge` рендерится неинтерактивным `span` и не имеет interactive props.

## Найденные проблемы и исправления

### Button и IconButton

Причина незаметного hover у `secondary`: базовый `surface-subtle` и semantic hover surface
разрешались в одинаковый цвет в обеих темах. Базовый фон переведён на существующий
`--vf-color-background-surface`. Hover и active продолжают использовать существующие
`surface-hover` и `surface-active` через component aliases. Primary остаётся визуально сильнее.

Одинаковое исправление внесено в `VfButton` и `VfIconButton`, поскольку варианты разделяют один
interaction contract. Focus-visible, disabled и loading не менялись: loading у `VfButton`
по-прежнему приводит control к нативному disabled-state и сохраняет spinner.

### Tooltip

Стрелка `top` использовала separated offset, а `bottom` — overlap offset. При одинаковом квадрате
10 px и повороте 45 градусов наружу выступало примерно 8.29 px сверху против 6.56 px снизу, из-за
чего верхняя стрелка читалась как ромб. Обе публичные стороны теперь используют существующий
overlap offset `-1px`.

После исправления измеренный выступ составляет примерно 6.30 px для `top` и 6.57 px для `bottom`;
остаточная разница 0.27 px обусловлена subpixel rasterization. Transformed bounds одинаковы
(примерно 14.14 px), rotation и border geometry симметричны в light/dark.

Также устранено обрезание leave-transition: Vue удалял Tooltip через fast duration, хотя CSS
анимация floating surface использовала normal duration. Lifecycle теперь совпадает с существующим
CSS motion token. Общий дизайн Tooltip не менялся.

### Tabs

Tab button имел нулевой radius в покое, но получал `control-tight` только при focus-visible. Поэтому
hover, active и focus имели разную геометрию. Существующий `--vf-radius-control-tight` перенесён в
базовый tab button. Tab list и scroll controls оставлены квадратными; underline tabs не превращены
в pills.

Внешний focus shadow обрезался overflow-контейнером scroller. Для tab buttons и scroll controls
использован inset focus ring той же ширины и того же semantic цвета. Для unselected tab добавлен
отсутствовавший press-state на `surface-active`; selected hover/active продолжают использовать
dedicated selected roles.

### NavMenu

Предполагаемый постоянный фон обычных пунктов не воспроизвёлся: default item уже был прозрачным,
а постоянный background принадлежал только current/disabled состояниям. Это поведение сохранено.

Реальным пропуском был press-state у невыбранных пунктов. Он добавлен через существующий
`surface-active`, с исключениями для disabled и current items. Проверены `default`, `pills` и
`sidebar`: sidebar hover остаётся прозрачным там, где это задано вариантом, физическое нажатие
получает краткий neutral feedback, а current/ancestor rail и selected states сохраняют приоритет.

### Checkbox, Radio и Switch

У checked Checkbox и Radio отсутствовал hover feedback, у всех трёх binary controls отсутствовал
отдельный press-state, а active у Switch совпадал с hover. Добавлены существующие semantic роли:

- unchecked active — `surface-active`;
- checked hover — `primary-hover`;
- checked active — `primary-active`;
- static Switch сохраняет static background и меняет только предусмотренный border cue.

Одновременно исправлен cascade compound states. Invalid border теперь остаётся danger-boundary для
checked/unchecked hover и active, а disabled подавляет invalid и interaction states. В частности,
`static + invalid + disabled` Switch больше не сохраняет danger-border вместо disabled-border.

### Dropdown, MenuBar и Select

У невыбранных пунктов был hover, но отсутствовал более сильный press-state. Добавлен
`surface-active` с сохранением variant-specific foreground и исключениями для selected, open и
disabled элементов. Для Select добавлен отдельный поздний selector: его собственный hover-rule
иначе перекрывал общий Dropdown press-state.

Selected/current hover и active, focus-visible, disabled, Dropdown variants, Select trigger,
padding, radius и overlay shadows проверены и не менялись.

### Popover и floating overlays

Popover программно фокусирует content surface, но получал нативный browser outline вместо
semantic focus treatment. Добавлен focus-visible ring, который сохраняет существующий float shadow.
Для Windows forced-colors предусмотрен отдельный системный двухпиксельный `Highlight` outline,
поскольку box-shadow в этом режиме подавляется.

Dropdown, Popover, Select и Tooltip использовали normal CSS transition, но Vue lifecycle завершал
их по fast duration. Все четыре lifecycle duration синхронизированы с уже существующим normal
motion token; значения tokens и сама анимация не менялись.

## Проверенные компоненты и состояния

| Компонент | Проверенные состояния | Результат |
| --- | --- | --- |
| Button | hover, active, focus-visible, disabled, loading, variants | Исправлен secondary base/hover contrast |
| IconButton | hover, active, focus-visible, disabled, variants | Синхронизирован secondary с Button |
| Tabs | hover, active, selected, selected-hover, selected-active, focus-visible, disabled | Исправлены radius, press и clipped focus |
| NavMenu | default, pills, sidebar, hover, pressed, current, ancestor, focus-visible, disabled | Исправлен только missing press-state |
| Tooltip | top, bottom, open/close motion, light/dark | Исправлены arrow offset и lifecycle |
| Dropdown | default, pills, hover, pressed, selected, focus-visible, disabled, open/close | Исправлены press и lifecycle |
| MenuBar | default, pills, hover, pressed, current, ancestor, open, focus-visible, disabled | Исправлен press-state |
| Popover | trigger/content focus, open/close, arrow/surface, forced-colors | Исправлены focus treatment и lifecycle |
| Select | trigger, option hover/pressed/selected/disabled, invalid/open/focus, clear, lifecycle | Исправлены option press и lifecycle |
| Checkbox | checked/unchecked, hover, active, focus-visible, invalid, disabled | Исправлены hover/press и precedence |
| Radio | checked/unchecked, hover, active, focus-visible, invalid, disabled | Исправлены hover/press и precedence |
| Switch | checked/unchecked, hover, active, static, focus-visible, invalid, disabled | Исправлены press и precedence |
| Badge | tones и разметка | Изменения не нужны: компонент неинтерактивен |
| ThemeSwitch | switch и button representations | Использует уже проверенные Switch/Button/IconButton |

## Почему остальные области не изменялись

- Primary, status, contrast и ghost Button/IconButton уже имели различимые hover/active roles и
  корректный disabled precedence.
- NavMenu default уже соответствовал требуемой модели transparent → hover → current.
- Selected/current Dropdown, MenuBar, NavMenu, Select и Tabs уже использовали dedicated
  selected-hover/selected-active roles.
- Focus ring width, transitions, shadows, padding и control geometry в остальных проверенных
  компонентах совпадали с существующими tokens.
- Light/dark различия происходят только из theme-scoped semantic values; случайных hardcoded
  theme overrides в затронутых стилях не добавлено.
- Badge не имеет интерактивного контракта. Loading существует только у Button среди перечисленных
  компонентов и корректно наследует disabled treatment.
- Документационные showcase examples соответствуют фактическим public variants и успешно проходят
  production build и automated documentation example checks.

## Visual verification

Production Chromium проверен на чистом профиле:

- light и dark;
- desktop 1440 × 1100 и mobile 390 × 844;
- 16 route snapshots и 8 CVD snapshots существующего `visual:phase2`;
- Core, Colors, CodeBlock и Playground routes;
- browser console/network errors и horizontal overflow;
- отдельная CDP computed-state matrix для hover, active, focus-visible, selected, invalid, disabled
  и forced-colors;
- отдельные screenshots и DOM measurements Tooltip `top`/`bottom`.

Existing visual smoke прошёл полностью. Baseline directory для byte-for-byte image comparison не
был настроен, поэтому результат оценивался штатными DOM/computed-state assertions и визуальным
просмотром новых production screenshots. Новая source contract suite фиксирует semantic mappings,
точные selectors, state precedence, radius/focus geometry, arrow offset и overlay timing от
повторного drift.

## Verification matrix

| Команда | Результат |
| --- | --- |
| `npm test` | **PASS** — все workspace suites и migration tests |
| `npm run verify` | **PASS** — полный clean-install/release gate |
| `npm run typecheck` | **PASS** — все workspaces |
| `npm run lint:all` | **PASS** — source, styles, HTML, Markdown и data |
| `npm run build` | **PASS** — все восемь публикуемых packages |
| `npm run build:demo` | **PASS** — production showcase, 385 modules |
| `npm run prepublish:all` | **PASS** — build и dry-run pack восьми packages |
| `npm run visual:phase2` | **PASS** — 16 route snapshots, 8 CVD snapshots, state assertions |
| `git diff --check` | **PASS** |

## Риски и migration notes

Migration не требуется: public API и token surface не изменились. Потребители увидят только
исправленные визуальные состояния и завершённые floating transitions. Pixel-level screenshot
baselines в репозитории не настроены; текущий visual gate сочетает production screenshots,
computed-style assertions и browser/runtime validation.
