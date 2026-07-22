# VueForge: итоговый аудит цветовой системы

Дата обновления: 2026-07-22. Статус: **Phase 1 завершена; palette values и component rendering сохранены**.

Связанные документы:

- [Инвентаризация цветов](./color-inventory.md)
- [Аудит цветовой доступности](./accessibility-colors.md)
- [Отчёт о реализации Phase 0](./phase-0-report.md)
- [Отчёт о реализации Phase 1](./phase-1-report.md)

## Executive summary

VueForge уже выглядит как аккуратная developer-oriented UI-библиотека: спокойная холодная neutral-база, узнаваемый синий primary, единый preset source of truth, token-based CSS без случайных HEX внутри core-компонентов и хороший базовый контраст основного/muted текста.

Исходный аудит выявил следующие архитектурные и визуальные противоречия; transport drift из пунктов 4–6 закрыт Phase 0, а role architecture из пунктов 1–2 введена Phase 1 без component migration:

1. Один chromatic token одновременно используется как текст/иконка и как solid background. В dark theme эти требования математически несовместимы; отсюда системные AA failures.
2. `colorBorder` одновременно является почти невидимым декоративным divider и единственной границей form control.
3. Focus ring имеет лишь 1.65:1 в light и 1.52:1 в dark.
4. Фактический preset, публичные TypeScript types, статический CSS и runtime CSS расходятся.
5. Full stylesheet и component entry CSS поддерживаются вручную в двух местах и уже дают разный cascade/geometry.
6. Scoped/local theme contract в CodeBlock/Playground и часть provider options визуально не выполняют обещанное поведение.
7. Shiki-палитры используются на чужом фоне, поэтому syntax highlighting не проходит AA.
8. Нет automated contrast, focus, scoped-theme или visual-regression gate.

Итог: текущую систему не следует «лечить» массовой заменой HEX. Сначала требуется нормализовать contract и роли, затем подобрать значения и только после этого мигрировать компоненты.

## Результат Phase 0

Phase 0 закрыла только contract/build/runtime drift, не меняя палитру и не переходя к новой semantic architecture:

- все 847 фактически поддерживаемых core tokens представлены в TypeScript contract; ранее отсутствовавшие 95 полей добавлены как optional для совместимости 1.x;
- static core CSS, runtime generation и layouts используют один алгоритм сериализации custom-property names;
- девять ошибочных fallback names заменены каноническими именами, а exhaustive parity tests не допускают их возврата;
- root fallback сохраняет компактные dark overrides, а scoped light/dark boundaries получают полный обратимый набор variables и `color-scheme`;
- full stylesheet теперь компонуется из тех же canonical component entries; отдельный parity gate проверяет отсутствие пропусков и дублей;
- fallback behavior для floating labels, Drawer и Command Palette восстановлен;
- ThemeProvider синхронизирует configured root aliases; CodeBlock и Playground разрешают тему по ближайшей валидной DOM boundary и сохраняют inherited component-token overrides; sandboxed Playground iframe получает resolved mode и `--vf-*` variables через проверяемый bridge;
- package CSS/export/consumer contracts и light/dark browser smoke покрывают затронутые пути.

Цветовые и accessibility-находки ниже остаются открытыми. Значения palette tokens, Shiki palette, contrast ratios и visual character в Phase 0 не менялись. Полный перечень решений и проверок приведён в [отчёте Phase 0](./phase-0-report.md).

## Результат Phase 1

Phase 1 создала целевое разделение token roles без миграции component CSS и без замены палитры:

- добавлены 29 primitive material tokens, содержащие только уже используемые HEX/black values;
- введён контракт из 77 semantic roles: background, text, icon, border, interaction и пять status families по восемь ролей;
- `colorFocusRing` входит и в сохранённый legacy contract, и в semantic set, поэтому новых semantic keys 76;
- все 847 legacy keys сохранены; built-in preset расширен до 952 keys;
- compatibility graph однонаправлен: semantic roles и текущие component aliases независимо разрешаются через legacy roots к primitives; component → semantic migration отложена до Phase 2;
- public name tuples/types, static/runtime maps, full/component-entry, scoped, fallback и custom-prefix paths используют один contract;
- foreground, solid background, subtle background, border и icon теперь являются разными public roles, даже когда их текущие material values совпадают;
- отдельная help scale сохранена из-за реального публичного API и набора потребителей;
- confirmed dead и ambiguous tokens только документированы как v2 candidates, но не удалены и не получили runtime warnings.

Phase 1 не исправляет перечисленные ниже contrast failures: компоненты пока продолжают читать прежние aliases, а target OKLCH values и state migration относятся к Phase 2. Полная архитектура и mapping опубликованы в [Color Tokens guide](../core/guides/color-tokens.md).

## Сильные стороны, которые нужно сохранить

- Фирменный характер: строгий, минималистичный, технический, спокойный, developer-oriented.
- Light canvas не ослепительно белый; dark text не чрезмерно яркий.
- Основной и muted text уверенно проходят AA.
- Все solid semantic buttons имеют контраст не ниже 5.04:1.
- Core component CSS почти полностью использует custom properties; случайных literal HEX/RGB/HSL в UI-правилах нет.
- Layouts, CodeBlock и Playground в основном наследуют core semantic layer.
- Иконки используют `currentColor`; black/white в SVG masks не являются видимой палитрой.
- Showcase широко покрывает компоненты и позволяет реальный light/dark проход без создания audit-page.
- Текущие geometry, CSS export и unit contracts дают хорошую основу для расширения проверок.

## Текущий визуальный характер

VueForge сейчас ближе всего к «сдержанной технической библиотеке для внутренних интерфейсов». Палитра прохладная, low-noise и достаточно профессиональная. Она не выглядит playful или consumer-oriented. При этом слабая elevation, почти незаметные borders/states и типовая GitHub syntax palette делают интерфейс менее узнаваемым и менее «дорогим», чем позволяет хорошая базовая геометрия.

Рекомендуемый вектор — не радикальный ребрендинг, а более точная иерархия того же характера: сохранить cool blue/blue-gray, повысить role clarity, дать dark foreground отдельные светлые stops и добавить очень умеренную elevation scale.

## Исходная оценка до Phase 0

Оценки ниже фиксируют исходное состояние и не пересчитаны после инфраструктурной Phase 0. Архитектурный drift из пунктов 4–6 устранён или сужен, но palette/semantic/accessibility debt намеренно не затрагивался.

| Аспект                  | Оценка | Обоснование                                                                                                     |
| ----------------------- | -----: | --------------------------------------------------------------------------------------------------------------- |
| Архитектура токенов     |   4/10 | Один preset source, но primitive layer отсутствует; 847 keys, 95 не типизированы; flat component aliases        |
| Гармоничность палитры   |   6/10 | Спокойная и цельная база, но status colors не построены как шкалы, температуры light surfaces расходятся        |
| Neutral palette         |   6/10 | Хороший text/muted; surface и borders слишком близки; roles disabled/placeholder не разделены                   |
| Primary/accent          |   5/10 | Узнаваемый restrained blue; dark foreground провален; отдельной accent-роли нет и пока не нужно                 |
| Семантические цвета     |   4/10 | Solid variants хороши, foreground/solid смешаны; soft statuses массово не проходят                              |
| Светлая тема            |   7/10 | Чистая и комфортная, но плоская; borders/focus и light warning/syntax требуют исправления                       |
| Тёмная тема             |   4/10 | Комфортные neutrals, но primary/error/help/status foreground и focus системно слишком тёмные                    |
| Состояния компонентов   |   5/10 | Покрытие широкое, но contrast, precedence, disabled/read-only/indeterminate и compound states непоследовательны |
| Accessibility           |   4/10 | Основной текст хорош; focus, controls, links, statuses и syntax содержат подтверждённые failures                |
| Консистентность         |   5/10 | Общий язык виден, но full/entry CSS, local theme и cross-component aliases уже расходятся                       |
| Визуальная уникальность |   5/10 | VueForge узнаваем по сдержанности, но palette/elevation/syntax пока обобщённые                                  |
| Премиальность           |   5/10 | Аккуратно, но слабая иерархия, недокументированные contracts и состояния снижают ощущение завершённости         |
| Масштабируемость        |   4/10 | Runtime engine полезен, но огромный ручной type/API surface и отсутствие schema создают drift                   |

## Главные проблемы по приоритету

### Critical

| Проблема                                                      | Файлы/компоненты                                                            | Последствие                                                    | Причина                                             | Решение                                                             | Риск                           | Проверка                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------- |
| Focus ring ниже 3:1                                           | `default-preset-source.ts`; все focusable core; CodeBlock copy              | Keyboard focus почти исчезает                                  | 32/42% primary mix; у CodeBlock outline отсутствует | отдельный `focus.ring`; общий focus recipe; добавить CodeBlock ring | Средний визуальный             | computed contrast + keyboard screenshots обеих тем |
| Control boundary ниже 3:1                                     | Field/Input/Textarea/Select/Checkbox/Radio/Switch                           | Пустой control трудно распознать                               | один `colorBorder` для divider и control            | `border.subtle/default/control`; control не ниже 3:1                | Средний, UI станет контрастнее | rendered boundary contrast на canvas/surface       |
| Chromatic role conflation                                     | links, errors, Badge, Tag, Alert icon, progress, selected states            | Dark primary/danger/help/status text 2.27–2.99:1               | один color для foreground и solid                   | `foreground/solid/on-solid/subtle/border/graphic` на tone           | Высокий охват                  | semantic pair tests + visual matrix                |
| Static/runtime token names расходятся — **закрыто в Phase 0** | `theme-css-artifacts.ts`, `theme/runtime.ts`, Field, Drawer, CommandPalette | fallback CSS ломал label transform, drawer motion, icon offset | два serializer algorithm                            | реализованы shared serializer + exhaustive parity test              | Низкий после fixture coverage  | fallback-only page, all-key parity                 |
| Syntax palette не проходит AA                                 | CodeBlock/Shiki                                                             | Мелкий code text 2.95–4.34:1                                   | GitHub token colors на VueForge background          | custom Shiki theme/syntax roles                                     | Средний визуальный             | каждый rendered syntax fg/background >=4.5         |

### High

| Проблема                                                                                  | Файлы/компоненты                                                          | Последствие                                                                                                                    | Рекомендуемое решение                                                                 | Риск/проверка                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 95 preset keys отсутствуют в public type — **закрыто в Phase 0**                          | `core/src/theme/default-preset*.ts`, `core/src/types/theme.ts`            | часть существующей темы нельзя было безопасно override через TS                                                                | 95 optional fields, `satisfies` и exact-key contract                                  | Низкий additive API; compile/type tests           |
| Scoped/local theme contract сломан — **закрыто в Phase 0**                                | ThemeProvider, CodeBlock, Playground/iframe                               | local dark оставался light или смешивал dark syntax с light surface                                                            | nearest resolved-theme contract и полный scoped variable map                          | Низкий после inverse/nested/iframe tests          |
| `prefix/rootSelector/attribute` допускают неработающие комбинации — **закрыто в Phase 0** | theme runtime/provider/docs                                               | configured roots и aliases синхронизированы; invalid selectors получают fallback; custom prefixes bridged к compiled CSS names | сохранить 1.x API; генерировать canonical `--vf-*` / `--vf-layout-*` aliases          | Низкий после configuration/custom-prefix fixtures |
| Два источника component CSS расходятся — **закрыто в Phase 0**                            | `components/*.css`, `entries/*.css`; Forms/NavMenu/CommandPalette/Stepper | full и standalone imports выглядели по-разному; Stepper тянул ~49 KB navigation CSS                                            | canonical entries + aggregate composition + parity gate                               | Низкий после packaging/consumer/smoke checks      |
| Compound-state precedence непоследовательна                                               | Select, Switch, disabled menus/Tabs/Stepper                               | invalid исчезает при open/focus; double opacity                                                                                | единая precedence `disabled > invalid > focus/open > hover > base`; state fixtures    | Средний visual; pairwise states                   |
| Нет browser a11y/visual gates                                                             | CI, Stylelint, Vitest                                                     | регрессии проходят 318 тестов                                                                                                  | contrast module, browser computed-style, keyboard, screenshots, fallback/scoped theme | Низкий; контролировать runtime CI                 |

### Medium

| Проблема                                                    | Влияние                                                                        | Решение                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Surface/elevation различаются на 1.04–1.24:1, `shadow:none` | Cards/layouts выглядят плоско; dark nesting теряется                           | `surface.subtle/elevated` + маленькая системная shadow scale после visual tuning              |
| 54 duplicate alias groups и cross-component aliases         | 53 tokens равны text, 38 primary; изменение NavMenu влияет на MenuBar/Dropdown | оставить component token только как реальную boundary; убрать зависимости компонент→компонент |
| Мёртвые публичные tokens                                    | 2 core color tokens, 20 Playground, 1 CodeBlock, 1 Layout token                | deprecation cycle; удалить только в major либо документировать extension point                |
| Opacity на subtree                                          | Disabled/Header/Stepper/Tabs зависят от background                             | explicit disabled fg/bg/border; opacity только там, где итог проверяем                        |
| Read-only/indeterminate/disabled gaps                       | Input/Textarea readonly неотличимы; Checkbox indeterminate отсутствует         | добавить модели и токены только там, где API действительно поддерживается                     |
| Shadow/backdrop и inverse roles неявны                      | raw black recipes; Layout header uses text as background                       | `overlay.backdrop`, `shadow.overlay`, `surface.inverse`, `fg.on-inverse`                      |
| Документация CodeBlock/Playground theming пустая            | десятки public vars без контракта                                              | сгенерированные token tables, scoped theme/contrast guarantees                                |
| Mobile `/core` имеет 441 px scrollWidth при viewport 390    | возможный overflow MenuBar/DataTable/upstream container                        | локализовать первый overflowing ancestor; не маскировать глобальным `overflow-x:hidden`       |

### Low

- Привести `warn` к `warning` в следующем major или документировать исключение.
- Решить, является ли `help` самостоятельным status; не превращать его неявно в accent.
- Переименовать неоднозначный `contrast/contrast-contrast` в inverse semantics в clean v2 contract.
- Документировать `#396fb6` как brand asset color либо развести/дедуплицировать два одинаковых demo-logo.
- Добавить icon showcase на 16/20/24 px и semantic surfaces.
- Унифицировать `color-mix` space и сократить 23 произвольных ratio до небольшой state scale.

## Компонентный вывод

Полная state matrix находится в инвентаризации; главные сквозные выводы:

- Button/IconButton геометрически цельные; solid tones читаемы, но focus и subtree opacity требуют исправления.
- Forms имеют системно слабую boundary; readonly отсутствует визуально; invalid compound states теряют danger cue.
- Checkbox/Radio/Switch нуждаются в более сильной unchecked boundary и non-color invalid cue; Checkbox не имеет indeterminate.
- Navigation покрывает много состояний, но dark primary/current indicators слабы, disabled ветки и full/entry CSS расходятся.
- Feedback body text обычно читаем; status foreground/icons/graphics и Badge/Tag требуют разделённых ролей.
- Overlays используют работающий float shadow, но schema elevation отсутствует; fallback Drawer tokens сломаны serializer-ом.
- CodeBlock требует собственной syntax palette и focus contract.
- Slider, DatePicker, Tree, Toast/Notification и standalone Pagination в текущем репозитории отсутствуют; им нельзя приписывать результаты аудита.

## Визуальная проверка

Проверен существующий playground/showcase без добавления audit-page:

- маршруты `/core`, `/layouts`, `/icons`, `/codeblock`, `/playground`;
- light и dark;
- desktop 1440×1000 и mobile 390×844;
- типовые композиции, формы, navigation, feedback, surfaces, dialogs/drawers и принудительный focus.

Наблюдения:

- Light выглядит чисто и спокойно, но surface/canvas и muted surface практически сливаются; hierarchy держится на слишком слабых borders.
- Dark не слепит и не имеет грязного hue cast, но nested surfaces и elevation почти исчезают.
- Dark blue/green/info/help/red foreground визуально «тонет»; вычисленные failures подтверждаются скриншотами.
- Focus ring присутствует в CSS, но почти не виден; проблема в contrast, а не в отсутствии правила (кроме CodeBlock copy).
- Solid actions выглядят наиболее завершённой частью текущей палитры.
- Layouts/icons/codeblock/playground на 390 px не создают document overflow; `/core` требует отдельной локализации overflow.
- Showcase полезен структурно, но не показывает swatches, обе темы рядом, locked pseudo-states, local inverse theme, contrast results или screenshot baselines.
- Опубликованный внешний docs-site не включён в screenshot-выводы: его HTML/маршруты были доступны для проверки структуры, но отдельный browser capture домена в окружении не завершился. Репозиторные docs и локальный showcase проверены полностью.

## Архитектура токенов после Phase 1

```text
Current 1.x component aliases ───────────┐
                                        ├─→ legacy color roots ─→ 29 primitives
77 public semantic roles ────────────────┘

Phase 2 target: component decisions ─→ semantic roles
```

### 1. Primitive layer

Добавлены sparse scales `paletteNeutral*`, `palettePrimary*`, `paletteSuccess*`, `paletteInfo*`, `paletteWarning*`, `paletteDanger*` и `paletteHelp*`. Они содержат только 28 прежних HEX и используемый `black`; неиспользуемые промежуточные stops не создавались. Runtime source остаётся в HEX, поэтому Phase 1 не вносит OKLCH conversion/rounding drift.

### 2. Semantic layer

Контракт содержит 11 background, шесть text, четыре icon, восемь border, восемь interactive и 40 status roles. Каждая из success/warning/danger/info/help families разделена на solid background/foreground, subtle background/foreground, border, icon, hover и active. `colorFocusRing` сохранён как единственное пересечение с legacy set.

Не добавлены accent и syntax roles: у accent нет отдельного product meaning, а Shiki migration относится к ecosystem/Phase 2+. Полный exact-name contract приведён в [Color Tokens guide](../core/guides/color-tokens.md).

### 3. Component layer

Component tokens остаются оправданными для Alert 8% primary subtle recipe, overlay composition, switch-specific composition и CodeBlock syntax adapter. Простые aliases `buttonText → colorTextPrimary` не являются основанием для нового public token. Массовая migration существующих component aliases отложена до Phase 2.

Canonical name tuples являются source of truth для TypeScript types и contract tests; build и runtime продолжают импортировать один serializer из Phase 0.

## Proposed target palette для Phase 2 — не реализована

Таблицы ниже остаются отдельным design proposal для будущей accessibility/OKLCH phase. Ни одно из этих новых значений не применено в Phase 1. Реализованные primitives сохраняют исходные HEX, перечисленные в публичном guide.

### Neutral roles

| Role             | Light                                | Dark                                 | Назначение                           |
| ---------------- | ------------------------------------ | ------------------------------------ | ------------------------------------ |
| Canvas           | `oklch(0.978 0.005 258)` / `#f6f8fb` | `oklch(0.214 0.010 268)` / `#17191e` | сохранить характер текущего page bg  |
| Surface          | `oklch(1 0 0)` / `#ffffff`           | `oklch(0.256 0.014 267)` / `#20232a` | базовая поверхность                  |
| Surface subtle   | `oklch(0.966 0.006 256)` / `#f1f4f8` | `oklch(0.288 0.016 264)` / `#272b33` | вложенный neutral слой               |
| Surface elevated | `#ffffff` + shadow                   | `oklch(0.309 0.017 266)` / `#2c3039` | overlays/cards, не default container |
| Foreground       | `oklch(0.271 0.025 261)` / `#202733` | `oklch(0.899 0.013 262)` / `#d9dee7` | основной текст                       |
| Muted            | `oklch(0.488 0.030 256)` / `#556171` | `oklch(0.745 0.018 259)` / `#a6adb8` | secondary text                       |
| Disabled         | `#7a8594`                            | `#747b86`                            | отдельная inactive роль              |
| Placeholder      | `#667085`                            | `#9da6b3`                            | не связывать с disabled              |
| Border subtle    | `#d7dde5`                            | `#363b46`                            | декоративные separators              |
| Border default   | `#b3bdc9`                            | `#4d5664`                            | структурные borders                  |
| Border control   | `#84909f`                            | `#687587`                            | 3.25:1 / 3.36:1 к surface            |
| Focus ring       | `oklch(0.530 0.136 247)` / `#0b70b5` | `oklch(0.756 0.117 241)` / `#65b9f3` | 5.25:1 / 7.33:1 к surface            |

Muted/surface: 6.30:1 light и 6.96:1 dark. Placeholder/surface: 4.97:1 и 6.40:1. Disabled остаётся слабее активного foreground и не должен дополнительно получать subtree opacity.

### Chromatic roles

| Tone    | Light foreground / solid / subtle | Dark foreground / solid / subtle  |
| ------- | --------------------------------- | --------------------------------- |
| Primary | `#0b67a3` / `#0b67a3` / `#e6f1f8` | `#6eb8ee` / `#24699e` / `#183247` |
| Success | `#2f7a3e` / `#2f7a3e` / `#e9f4eb` | `#79d18a` / `#347542` / `#203529` |
| Info    | `#00749b` / `#00749b` / `#e5f3f7` | `#6ac6eb` / `#19759b` / `#1e333d` |
| Warning | `#765f10` / `#d4ad46` / `#f8f0d8` | `#e2bd68` / `#b88e32` / `#39301f` |
| Danger  | `#bc3542` / `#bc3542` / `#f9e8ea` | `#ff818a` / `#b7434c` / `#3b252b` |
| Help    | `#6d4695` / `#6d4695` / `#f1eaf7` | `#c7a0ea` / `#764d93` / `#30283a` |

`on-solid` остаётся white, кроме warning (`#241a00` light, `#211700` dark). У предложенных пар foreground/subtle минимум 4.66:1 light и 5.90:1 dark; on-solid/solid минимум 5.17:1.

Изменения по смыслу:

- Primary сохраняет hue и сдержанность; dark foreground становится светлее, solid остаётся достаточно тёмным для white.
- Success/info/danger/help получают отдельные dark foreground stops и перестают тонуть на surface.
- Warning foreground затемняется в light, а solid остаётся светлым с тёмным on-solid.
- Neutral hierarchy становится явной без превращения интерфейса в тяжёлую сетку borders.

Перед внедрением необходимо зафиксировать browser-support contract OKLCH. Проект уже требует `color-mix()`, поэтому современная color pipeline допустима, но production CSS может сохранять проверенные sRGB fallbacks/fixtures.

## План изменений

Рекомендуемый путь — staged 1.x migration с clean v2 endpoint. Публичные legacy custom properties нельзя молча удалить в minor release.

### Phase 0 — contract correctness, без редизайна — **завершена**

Реализовано:

- единый serializer для runtime, core static build и layouts static build;
- exact preset/type/static/runtime contracts для 847 core и 124 layout tokens;
- канонические имена девяти fallback variables;
- полные обратимые scoped light/dark maps с `color-scheme`;
- рабочие configured `rootSelector`/`attribute` без изменения публичных сигнатур;
- custom-prefix compatibility bridge для Core и Layouts;
- синхронизация `data-theme`/`data-vf-theme`/configured attributes и deterministic invalid-selector fallback;
- canonical component-entry CSS и автоматическая full/entry composition parity;
- inherit/resolved marker split и nearest-boundary contract для CodeBlock/Playground, включая sandboxed iframe;
- regression tests и package CSS/export/consumer contracts.

Подробности: [отчёт о реализации Phase 0](./phase-0-report.md).

### Phase 1 — primitive/semantic architecture — **завершена**

Реализовано:

- canonical tuples/types для 29 primitives и 77 semantic roles;
- existing-value primitive palette без новых OKLCH/HEX values;
- 76 additive semantic keys и сохранённый semantic `colorFocusRing`;
- built-in preset 952 keys при полном сохранении 847-key legacy API;
- one-way compatibility mapping без undefined aliases и cycles;
- exact light/dark, runtime/static, custom-prefix и scoped-theme contracts;
- public naming, theming, migration и v2 deprecation documentation.

Подробности: [отчёт о реализации Phase 1](./phase-1-report.md).

### Phase 2 — core component states

Файлы:

- `packages/core/src/styles/entries/*.css` как предполагаемый canonical source;
- aggregate CSS generation/composition;
- Vue components и tests только для подтверждённых state/a11y gaps;
- showcase state matrix.

Действия: component migration на semantic roles; target OKLCH/light-dark values; focus/control/status/link mapping; state precedence; disabled/readonly/indeterminate; устранение color-only cues; reduced motion; full/subpath parity.

### Phase 3 — ecosystem

Файлы:

- layouts preset/mappings;
- CodeBlock tokens/CSS/Shiki theme;
- Playground host/iframe theme sync;
- docs/examples/logo decision.

Действия: optional provider-local wrapper boundary; SSR hint; syntax palette; inverse roles; dead token deprecations; elevation tuning.

### Phase 4 — gates и документация

Файлы:

- CI/scripts/tests;
- Stylelint/literal audit allowlist;
- `docs/**/theming.md` и showcase.

Действия: contrast/reference/parity checks, computed-style browser smoke, keyboard focus, screenshots light/dark 1440/390, fallback/local theme, forced colors, generated token documentation.

### Phase 5 — clean v2 (отдельное решение)

- удалить deprecated aliases и мёртвые public tokens;
- переименовать неоднозначные `warn`, `contrast` roles;
- сделать component API существенно меньше;
- опубликовать migration map и visual diffs.

## Migration risks

- Palette role split затрагивает почти все компоненты, но позволяет сохранить solid colors отдельно и уменьшает риск массовой регрессии.
- CSS custom properties фактически являются публичным API даже без TypeScript declaration; удалять их только через deprecation/major.
- Scoped theme исправление меняет specificity и SSR/hydration; нужна матрица nested providers.
- Custom Shiki theme изменит все code screenshots и может повлиять на payload.
- Canonical CSS source затрагивает package subpaths; обязательны export/consumer isolation tests.
- Более сильные control borders и elevation требуют design review на сложных layouts, чтобы не сделать UI тяжёлым.

## Проверка после каждой фазы

1. `npm run typecheck`, package tests и CSS contracts.
2. generated/runtime/type exact parity.
3. contrast fixtures и computed-style pairs обеих тем.
4. standalone CSS subpaths без full bundle и без runtime plugin.
5. root light/local dark, root dark/local light, nested provider, dynamic switch.
6. SSR/hydration и Playground iframe custom variables.
7. keyboard-only focus и accessible-name/relationship assertions.
8. screenshots 1440×1000 и 390×844.
9. no document overflow, hardcoded-color audit, bundle/export regression.
10. grayscale/color-vision review semantic statuses.

## Выполненная проверка исходного состояния

- Полный `npm test`: pass.
- Core: 187 tests pass; CSS contract, form geometry и 43 CSS export checks pass.
- CodeBlock: 37 tests pass; CSS export/consumer smoke pass.
- Playground: 24 tests pass; CSS export/consumer smoke pass.
- Layouts: 50 tests pass; CSS contract и 21 CSS export checks pass.
- Theme: 6 tests pass.
- Playground core/plugin: 14 tests pass.
- Icons build/render smoke pass.
- Всего Vitest: 318 tests pass, плюс package smoke/contract checks.

Эти результаты не опровергают аудит: существующие тесты проверяют DOM/строки/exports, но не serializer parity всех keys, computed contrast, focus rendering, scoped theme или visual parity.

## Проверка после Phase 0

- Полный workspace test suite: 365 Vitest tests, package smoke/contract checks и Icons render smoke проходят.
- TypeScript, ESLint и Stylelint проходят во всех workspace packages.
- Library build и production showcase/docs build проходят.
- Core static/runtime contract: 847 light variables, 53 root dark overrides и по 847 variables в scoped light/dark maps.
- Layouts static/runtime contract: 124 variables в light и каждом scoped mode; root dark сохраняет два overrides.
- Все 9 canonical fallback names присутствуют, все 9 прежних malformed names отсутствуют.
- Full stylesheet содержит каждый canonical component entry ровно один раз; standalone CSS export/consumer checks проходят.
- Browser smoke без runtime style подтвердил floating labels, Drawer и Command Palette в light/dark.
- Browser smoke scoped themes подтвердил CodeBlock и Playground, включая actual sandbox iframe preview, в light/dark; ошибок страницы не зафиксировано.

Phase 0 не вводила automated contrast/Axe/screenshot-diff gate: это остаётся задачей последующих palette/accessibility phases. Снимки текущего smoke использовались для ручной проверки и не добавлены как новые baseline assets.

## Проверка после Phase 1

- Public name contracts фиксируют 29 primitives и 77 semantic roles без duplicate names.
- Built-in preset/type/static/runtime maps содержат 952 keys: 847 legacy + 105 unique additions.
- Light/dark и scoped maps имеют одинаковый полный key set.
- Alias graph contract проверяет missing references, self-references и cycles.
- Custom-prefix contract проверяет requested namespace и canonical `--vf-*` bridge.
- Full stylesheet и component-entry paths продолжают использовать generated contract Phase 0.
- Legacy material values и 1.x token names сравниваются с зафиксированным baseline.

Итоговые workspace test/build/smoke команды и количественные результаты приведены в [отчёте Phase 1](./phase-1-report.md).

## Ограничения и решения после Phase 0

1. Совместимый 1.x слой выбран и реализован для Phase 0; clean v2 остаётся отдельным решением.
2. Scoped theme semantics зафиксированы на ближайшей валидной DOM light/dark boundary; Provider синхронизирует только configured roots.
3. Произвольный custom prefix сохранён; Core и Layouts runtime emit requested variables вместе с canonical compatibility aliases для существующего compiled component CSS.
4. Динамическая вставка/замена configured Provider root без изменения mode не отслеживается; это редкий edge case, не блокирующий Phase 0.
5. Изменение внешних stylesheets без DOM/attribute mutation не инициирует повторный snapshot Playground variables; mode/ancestor/reparenting cases покрыты.
6. `help` зафиксирован как отдельная semantic family из-за существующего публичного tone и реальных consumers; target OKLCH values, elevation tuning и `#396fb6` остаются решениями последующих фаз.
7. После будущих palette/semantic изменений потребуется новый visual pass опубликованного docs-site.

Phase 1 завершена. Target OKLCH-палитра, accessibility-коррекция значений и миграция компонентов не начинались и остаются scope Phase 2.
