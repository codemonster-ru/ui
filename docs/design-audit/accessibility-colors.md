# VueForge: аудит цветовой доступности

> **Historical baseline.** Ratios и findings ниже относятся к палитре до Phase 2 и сохранены для before/after
> сравнения. Текущая remediation matrix приведена в [отчёте Phase 2](./phase-2-report.md).

Дата аудита: 2026-07-21. Статус: **contrast baseline сохранён; Phase 0 не меняла палитру**.

Этот документ фиксирует результаты read-only проверки исходного пресета VueForge. Phase 0 устранила transport/scoping/fallback drift, но не изменила ни одного значения palette token, Shiki theme или contrast recipe. Поэтому все численные результаты и accessibility-находки ниже остаются актуальными и открытыми. Технические результаты приведены в [отчёте Phase 0](./phase-0-report.md).

## Методика

- Контраст рассчитан по относительной яркости sRGB и формуле WCAG 2.2.
- Непрозрачные `color-mix(in srgb, ...)` сведены к фактическому итоговому sRGB-цвету.
- Обычный текст проверяется против 4.5:1, крупный текст и значимые графические/интерактивные границы — против 3:1.
- Disabled-контент формально может быть исключён из части требований WCAG, но проверен на читаемость и на риск восприниматься активным.
- Результаты сопоставлены с computed styles и фактическим рендерингом showcase в Chrome, в light/dark и на ширинах 1440 и 390 px.
- Для полупрозрачных состояний итог зависит от подложки. В таблицах указана стандартная поверхность пресета; пользовательские поверхности требуют повторного расчёта.

Источники палитры: `packages/core/src/theme/default-preset-source.ts:512-546,867-903`.

## Ключевые сочетания

| Сочетание                                |      Light |       Dark |                           Требование | Статус                              | Основные потребители                       |
| ---------------------------------------- | ---------: | ---------: | -----------------------------------: | ----------------------------------- | ------------------------------------------ |
| Основной текст / surface                 |    15.75:1 |    10.61:1 |                                4.5:1 | Pass                                | body, headings, inputs, alerts             |
| Основной текст / page background         |    14.80:1 |    11.86:1 |                                4.5:1 | Pass                                | page copy                                  |
| Muted / surface                          |     5.68:1 |     6.00:1 |                                4.5:1 | Pass                                | descriptions, inactive navigation          |
| Muted / page background                  |     5.34:1 |     6.71:1 |                                4.5:1 | Pass                                | secondary page copy                        |
| Placeholder/disabled / muted surface     |     5.12:1 |     5.42:1 |                     4.5:1 для текста | Pass по контрасту; роль перегружена | fields, disabled, loading                  |
| Primary foreground / surface             |     6.40:1 | **2.92:1** |                                4.5:1 | **Dark fail**                       | links, selected labels, current navigation |
| Danger foreground / surface              |     5.41:1 | **2.99:1** |                                4.5:1 | **Dark fail**                       | error messages, invalid labels             |
| Help foreground / surface                |     7.03:1 | **2.48:1** |                                4.5:1 | **Dark fail**                       | help status text/icons                     |
| Warning foreground / surface             | **3.60:1** |     5.85:1 |                                4.5:1 | **Light fail**                      | warning Tag/text                           |
| Default border / surface                 | **1.36:1** | **1.40:1** | 3:1, если граница распознаёт control | **Fail**                            | inputs, unchecked controls, dividers       |
| Field hover border / surface             | **1.91:1** | **2.17:1** |                                  3:1 | **Fail**                            | Input, Textarea, Select                    |
| Focus ring / surface                     | **1.65:1** | **1.52:1** |                                  3:1 | **Fail**                            | почти все интерактивные компоненты         |
| Primary selected text / 20% primary-soft |     4.73:1 | **2.42:1** |                                4.5:1 | **Dark fail**                       | Select option, navigation states           |
| Surface / canvas                         |     1.06:1 |     1.12:1 |            информационный показатель | Очень слабая иерархия               | cards, panels, docs layout                 |
| Surface-muted / canvas                   |     1.04:1 |     1.24:1 |            информационный показатель | Light почти неразличим              | code, headers, nested surfaces             |

### Почему один semantic status color не может работать везде

В dark theme текущий chromatic token одновременно используется как:

1. foreground на `#20232a`;
2. solid background с белым текстом.

Для AA с белым текстом относительная яркость solid-цвета должна быть не выше `0.1833`. Для AA этого же цвета как текста на `#20232a` она должна быть не ниже `0.2504`. Диапазоны не пересекаются. Следовательно, проблему нельзя исправить одним «более светлым» или «более тёмным» оттенком: роли `foreground` и `solid` необходимо разделить.

## Solid semantic backgrounds

Текущие solid-кнопки с contrast text проходят AA. Это важно сохранить при миграции.

| Tone                    |   Light |    Dark | Статус |
| ----------------------- | ------: | ------: | ------ |
| Primary / white         |  6.40:1 |  5.39:1 | Pass   |
| Success / white         |  5.13:1 |  5.36:1 | Pass   |
| Info / white            |  5.04:1 |  5.25:1 | Pass   |
| Warning / dark on-solid |  5.07:1 |  6.79:1 | Pass   |
| Help / white            |  7.03:1 |  6.33:1 | Pass   |
| Danger / white          |  5.41:1 |  5.25:1 | Pass   |
| Contrast / inverse      | 15.31:1 | 12.33:1 | Pass   |

Вывод: нельзя переопределять текущий base status одним новым foreground-цветом — это сломает solid actions. Нужны отдельные `solid` и `on-solid`.

## Status foreground на soft background

Badge использует обычный текст около 0.875rem; к нему применяется порог 4.5:1. Для Alert icon применяется минимум 3:1 как к meaningful graphic.

| Tone     |      Light |       Dark | Текущий статус        |
| -------- | ---------: | ---------: | --------------------- |
| Primary  |     5.34:1 | **2.62:1** | Dark fail             |
| Success  | **4.36:1** | **2.64:1** | Fail                  |
| Info     | **4.28:1** | **2.68:1** | Fail                  |
| Warning  | **3.16:1** |     4.83:1 | Light fail для текста |
| Help     |     5.85:1 | **2.27:1** | Dark fail             |
| Danger   |     4.50:1 | **2.75:1** | Dark fail             |
| Contrast |    12.61:1 |     8.54:1 | Pass                  |

Затронуты Badge, Tag, Alert icons, Select options, Stepper current marker, ProgressBar, ProgressSpinner и часть navigation states.

## Syntax highlighting

CodeBlock использует `github-light`/`github-dark` Shiki и выводит их цвета inline, но фон берёт из VueForge. Палитра подсветки поэтому проверена на фактическом `surface-muted`, а не на GitHub background.

| Тема и роль        | Foreground | Background |   Контраст | Статус |
| ------------------ | ---------- | ---------- | ---------: | ------ |
| Light orange token | `#e36209`  | `#f3f3f3`  | **3.15:1** | Fail   |
| Light red token    | `#d73a49`  | `#f3f3f3`  | **4.12:1** | Fail   |
| Light green token  | `#22863a`  | `#f3f3f3`  | **4.17:1** | Fail   |
| Light comment      | `#6a737d`  | `#f3f3f3`  | **4.34:1** | Fail   |
| Dark comment       | `#6a737d`  | `#272b33`  | **2.95:1** | Fail   |

Источник: `packages/codeblock/src/services/code-highlight.ts:21-27,196-218`. Требуется VueForge-specific Shiki theme или семантическая syntax palette, рассчитанная вместе с реальным фоном.

## Focus и interactive boundaries

### Focus

`--vf-color-focus-ring` формируется как 32% primary на surface в light и 42% в dark. При ширине 3 px кольцо геометрически заметно, но его контраст 1.65:1/1.52:1. Визуальная проверка с принудительным `:focus-visible` подтвердила: кольцо почти исчезает на поверхности.

Затронуты Button, IconButton, Link, Input, Textarea, Select, Checkbox, Radio, Switch, Tabs, menus, Stepper, overlay items, HorizontalScroller и ThemeSwitch.

Отдельный дефект: `.vf-codeblock__copy` после `all: unset` не получает ни outline, ни box-shadow; focus-visible меняет только цвет маленькой иконки (`packages/codeblock/src/codeblock.css:56-87,115-124`).

### Control boundaries

Один `colorBorder` одновременно используется как декоративный divider и как единственный контур control. Для декоративного separator низкий контраст допустим, для Input/Select/unchecked Checkbox/Radio/Switch — нет. Нужны разные роли как минимум `border.subtle` и `border.control`.

## Состояния компонентов

| Группа            | Подтверждённая проблема                                                | Рекомендуемая роль/исправление                           |
| ----------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Links/prose       | Dark primary 2.92:1; нет независимых active/visited/disabled           | `link.default/hover/active/visited/focus`                |
| Fields            | boundary и hover ниже 3:1; danger supporting text в dark 2.99:1        | `border.control`, `status.danger.foreground`             |
| Select            | invalid+open перезаписывается primary; dark selected 2.42:1            | формальная precedence states + status/selection roles    |
| Checkbox/Radio    | unchecked boundary ниже 3:1; invalid может быть только цветом          | strong boundary + message/icon cue                       |
| Switch            | invalid теряется в checked-hover/focus; primary graphic слаб в dark    | precedence + `primary.graphic`                           |
| Tabs              | dark indicator 2.92:1; disabled получает двойное ослабление            | `selection.indicator`, убрать double opacity             |
| Badge/Tag         | semantic small text не проходит; tone только цветом                    | status foreground + опциональный icon/label contract     |
| Alert             | body читаем, status icon слаб; при hideIcon tone только цветом         | `status.graphic`, не скрывать единственный non-color cue |
| Progress/Spinner  | dark semantic strokes около/ниже 3:1                                   | `status.graphic` с 3:1 минимум                           |
| Stepper           | current marker слаб; nested opacity перемножается                      | selection/status graphic + единая disabled formula       |
| Menu/Nav/Dropdown | current/active часто опираются на dark primary; disabled ветки неполны | selection foreground/indicator + disabled semantics      |
| Card/Panel/Table  | surface/border hierarchy 1.04–1.40:1                                   | subtle/default/elevated layers; controls отдельно        |
| CodeBlock         | syntax failures; copy focus отсутствует                                | syntax roles + общий focus contract                      |

## Цвет как единственный сигнал

Системно зависят от hue без гарантированного второго признака:

- invalid control без supporting error text/icon;
- Badge и Tag tone;
- ProgressBar и ProgressSpinner tone;
- default active item Dropdown;
- Alert tone при `hideIcon`.

Alert по умолчанию использует различные иконки — это хороший non-color cue. Checked controls, selected Tabs, Stepper и active navigation дополнительно используют форму, позицию, weight или indicator, однако их графический контраст всё равно должен быть исправлен.

Для protanopia/deuteranopia нельзя полагаться на различие success green и danger red. Для tritanopia — только на blue/yellow. В target-системе status должен подтверждаться текстом, icon shape или структурой. Для achromatopsia состояние должно оставаться понятным по lightness/shape без hue.

## Disabled, opacity и motion

- `colorMuted` одновременно служит secondary, placeholder и disabled. Это мешает отдельно настроить читаемость и inactive hierarchy.
- Button, CodeBlock, Tabs, Stepper и breadcrumbs применяют opacity к целому subtree; итог зависит от неизвестного background.
- Tabs сначала смешивает disabled foreground до 50%, затем применяет ещё `opacity: .5`.
- Stepper применяет opacity и к trigger, и к descendants, фактически перемножая её.
- Disabled content не следует искусственно делать контрастнее активного. Рекомендуется отдельный `fg.disabled` плюс явное отключённое поведение/курсор, без каскадного opacity.
- `prefers-reduced-motion` сейчас покрывает только striped ProgressBar; spinner, skeleton, indeterminate progress и theme transition требуют общей policy. Это не цветовой contrast-дефект, но влияет на безопасное восприятие состояний.

## Целевые гарантии

После согласования палитры автоматические проверки должны гарантировать:

1. обычный foreground на каждой допустимой surface — не ниже 4.5:1;
2. status foreground на status subtle — не ниже 4.5:1;
3. focus indicator и control boundary — не ниже 3:1 к смежным цветам;
4. meaningful status/selection graphics — не ниже 3:1;
5. `on-solid` для всех tones — не ниже 4.5:1;
6. каждый syntax foreground на фактическом code background — не ниже 4.5:1;
7. root light/local dark и root dark/local light проходят ту же матрицу;
8. состояния остаются понятными в grayscale и без различения красного/зелёного.

## Пробел автоматизации после Phase 0

Phase 0 добавила exhaustive token/static/runtime parity, full/component-entry parity, nested scoped-theme tests и ручной browser smoke light/dark для fallback, CodeBlock и Playground iframe. Эти проверки защищают доставку правильных variables, но не вычисляют итоговые цвета, контраст, focus rendering или screenshot-diff parity. В CI по-прежнему отсутствуют Axe, browser contrast assertions и visual regression. Literal-color regex также не покрывает `oklch()`, `lab()`, `lch()`, `color()`, все named colors и произвольные color functions.

Нужны лёгкие проверки без тяжёлой новой инфраструктуры:

- общий JS-модуль расчёта WCAG и fixtures semantic pairs;
- browser smoke для computed styles обеих тем;
- keyboard focus assertions;
- light/dark screenshots на 1440 и 390 px;
- автоматизированный fallback-only browser case без runtime plugin;
- постоянный browser gate для scoped/nested theme и iframe cases;
- forced-colors smoke.
