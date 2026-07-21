# VueForge: отчёт о реализации Phase 0

Дата завершения: 2026-07-21. Статус: **завершена; переход к Phase 1 не выполнялся**.

## Scope и результат

Phase 0 устранила расхождения между публичным TypeScript contract, runtime theme generation, static CSS build, full stylesheet и component-entry CSS. Дополнительно восстановлены fallback и scoped-theme paths, непосредственно зависевшие от этих контрактов.

Вне scope остались semantic tokens, OKLCH/material palette, accessibility-коррекция цветов, новая Shiki palette, переработка component states и визуальный редизайн.

Итоговые инварианты:

- canonical core preset содержит 847 keys, и те же keys доступны через `VfThemeTokens`;
- static и runtime используют один serializer custom-property names;
- root fallback, scoped modes и runtime согласованы по именам и значениям;
- full CSS собирается из тех же canonical entries, которые публикуются как component subpaths;
- fallback-only и runtime-enabled consumers получают одинаковые имена variables;
- ближайшая валидная DOM theme boundary определяет CodeBlock и Playground, включая sandboxed preview;
- ни одно значение цветовой палитры не изменено.

## Причины исходных расхождений

| Расхождение                                        | Конкретная причина                                                                                                                                         | Проявление до Phase 0                                                                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 95 preset keys отсутствовали в TypeScript          | `defaultThemePresetSource` сначала выводился как untyped intermediate object и только затем присваивался typed export; excess-property check не срабатывал | built-in token существовал в CSS/runtime, но TypeScript запрещал безопасный override                                                    |
| Девять custom-property names различались           | static build и runtime содержали независимые camelCase → kebab-case regex algorithms                                                                       | static CSS создавал `...-ydefault`, `...-xrest`, `...-xleft`; runtime создавал канонические `...-y-default`, `...-x-rest`, `...-x-left` |
| Scoped light/dark были необратимыми                | root baseline и частичные dark overrides не задавали полный mode map на локальной boundary                                                                 | root dark/local light и nested inverse themes наследовали часть variables чужого mode                                                   |
| Layouts имели отдельную сериализацию               | layouts build поддерживал третий converter, включая локальную special-case замену `zindex`                                                                 | core/runtime/layouts могли расходиться при новых token shapes                                                                           |
| Full и entry CSS поддерживались вручную            | aggregate group files дублировали содержимое `entries/*.css`                                                                                               | Select geometry, Command Palette cascade, Stepper payload и transition guard различались                                                |
| Floating label, Drawer и Command fallback ломался  | consumers читали канонические names, которых не было в static fallback                                                                                     | runtime style скрывал дефект; без plugin терялись transform/motion/icon offset                                                          |
| Provider options применялись не к configured root  | provider всегда записывал mode на `document.documentElement` и только в один attribute                                                                     | `rootSelector`/engine attribute могли генерировать CSS, который provider фактически не активировал                                      |
| CodeBlock local theme зависела от root assumptions | component искал attributes раздельными проходами, token aliases объявлялись только на `:root`, explicit → inherit не пересчитывался                        | ближайшая boundary могла проигнорироваться; локальные aliases не переопределялись корректно                                             |
| Playground snapshot брал document root             | theme и variables копировались с `document.documentElement`; direct iframe access предполагал same-origin                                                  | nested theme не доходила до host/preview; `sandbox="allow-scripts"` создавал opaque origin                                              |
| Layouts emitted types расходились с runtime        | dependency shim описывал serializer/apply helpers уже, чем реальная реализация                                                                             | опубликованные declarations не соответствовали фактическим return values                                                                |

## Обязательные исправления

Следующие решения были необходимы для выполнения согласованных contract goals и реализованы без изменения palette values:

1. Один shared serializer в `packages/theme/src/css-vars.ts` для runtime, core build и layouts build.
2. Additive TypeScript contract для всех 847 built-in keys; 95 новых declarations оставлены optional для 1.x source compatibility.
3. `satisfies CompleteDefaultThemePreset` и exact-key compile-time regression test.
4. Полные scoped light/dark maps. Root path сохраняет baseline light declarations и только 53 core/two layout dark overrides, чтобы не менять прежнюю fallback модель.
5. Canonical component entries и build-time composition с dedupe/cycle detection.
6. Exact-map, serializer, fallback-name, CSS parity, export и consumer regression tests.
7. Nearest-boundary mode для CodeBlock/Playground и безопасная доставка computed `--vf-*` variables в sandbox iframe.

## Потенциально спорные решения и выбранный вариант

| Решение                                          | Выбранный вариант         | Почему                                                                                                                                                                                                            |
| ------------------------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Сделать 95 полей required или optional           | optional                  | required-поля сломали бы существующие complete custom presets VueForge 1.x; built-in preset отдельно проверяется как complete                                                                                     |
| Scoped mode как delta или полный map             | полный map                | только полный map гарантированно отменяет inherited opposite-mode values и сохраняет component aliases при nested inverse themes                                                                                  |
| Сохранить ошибочные static spellings как aliases | не сохранять              | эти девять names не были source/public tokens и отсутствовали в runtime; распространение accidental names во все paths закрепило бы drift. Их удаление из static artifact — целевое исправление fallback contract |
| Aggregate CSS или entries как canonical source   | entries                   | component subpath должен оставаться изолированным; aggregate manifests теперь только задают состав full bundle                                                                                                    |
| Добавить iframe `allow-same-origin`              | не добавлять              | это ослабило бы sandbox. Theme bridge работает при opaque origin и валидирует source, message type, mode и `--vf-*` payload                                                                                       |
| Сузить `prefix/rootSelector/attribute` API       | не делать breaking change | configured roots/attributes исправлены совместимо; при custom prefix Core и Layouts дополнительно генерируют канонические aliases для уже скомпилированного component CSS                                         |
| Менять token values для визуального выравнивания | не менять                 | Phase 0 ограничена доставкой существующего контракта; palette и accessibility требуют отдельного согласования                                                                                                     |

## Реализованные изменения

### Token/type/runtime/static contract

- Добавлен shared `serializeThemeTokensToCssVars()` с единым camelCase/digit behavior и `createScopedThemeModeSelector()`.
- Core static artifacts используют тот же serializer, что и runtime.
- Runtime и fallback CSS задают `color-scheme` на root и scoped mode boundaries.
- Runtime rule order фиксирован как root baseline → custom dark selector → scoped light → scoped dark, поэтому explicit local light отменяет внешний custom dark selector.
- При custom prefix Core и Layouts генерируют requested variables и канонические `--vf-*` / `--vf-layout-*` aliases, ссылающиеся на них.
- Assembled full stylesheet сохраняет root `color-scheme: dark`: поздний base rule одинаково распознаёт `data-theme` и `data-vf-theme`.
- Core root dark остаётся 53-key override; scoped light и dark содержат полные 847-key effective maps.
- Layouts сохраняет 124 light variables, два root dark overrides и полные 124-key scoped maps.
- Девять canonical fallback variables проверяются явно; девять прежних malformed spellings запрещены regression test.
- `VfThemeTokens` расширен 95 optional declarations; built-in preset и public keys сравниваются на уровне типов.
- Layouts public emitted declarations приведены к реальному `Record<string, string>` и `HTMLElement` return contract.

### Full stylesheet и component entries

- `entries/*.css` стали canonical component styles.
- Шесть group files в `styles/components/` стали import-only manifests.
- Новый CSS composer рекурсивно раскрывает local imports, обнаруживает cycle и включает каждый artifact один раз.
- Shared theme-transition guard одинаково попадает в full/base и standalone component CSS.
- Shared horizontal-scroller fragment используется MenuBar и Tabs без взаимного импорта больших bundles.
- Stepper больше не включает navigation bundle целиком.
- Исправлена подтверждённая standalone parity для Input, Textarea, Select, Dialog, Drawer, MenuBar, Tabs, Stepper и уже покрытых NavMenu/Command Palette rules.

### Fallback behavior

- Floating label читает существующие канонические `translate-y-default` variables и снова получает правильный transform без runtime plugin.
- Drawer получает канонические rest/side offsets и восстанавливает transition geometry во всех направлениях.
- Command Palette title icon получает канонический default Y offset.
- Switch root-dark rules одинаково распознают `data-theme="dark"` и `data-vf-theme="dark"`.
- Contracts запускают fallback artifact generation перед сравнением и проверяют отсутствие старых spellings.

### Scoped ThemeProvider, CodeBlock и Playground

- `VfThemeProvider` находит configured roots и при каждом обновлении записывает resolved mode в engine attribute, requested attribute, `data-theme` и `data-vf-theme`; конфликтующие aliases нормализуются.
- Initial mode сохраняет приоритет storage/requested/engine attributes и затем читает совместимые root aliases, поэтому SSR/fallback с единственным `data-theme` не сбрасывается при mount.
- В browser context невалидный `rootSelector` нормализуется к `:root`, а невалидный explicit `darkModeSelector` — к каноническому selector на нормализованном root. Валидный selector без текущих matches сохраняется.
- При `theme="inherit"` CodeBlock и Playground сохраняют на host `data-theme="inherit"` и `data-vf-theme="inherit"`, а effective mode публикуют через `data-vf-resolved-theme="light|dark"`; explicit modes по-прежнему записываются в оба theme attributes.
- CodeBlock и Playground определяют mode по ближайшей валидной DOM boundary на предках. Сам `VfThemeProvider` не создаёт wrapper/local boundary, а синхронизирует configured roots.
- Component token defaults объявляются на `:root` и реальных light/dark boundaries, но не на host с `inherit`; поэтому ancestor overrides `--vf-codeblock-*` / `--vf-playground-*` не перезаписываются self-boundary.
- Playground реагирует на relevant ancestor mutations/reparenting.
- В preview передаются только computed properties с prefix `--vf-`; устаревшие snapshot variables удаляются перед новым применением.
- Sandboxed iframe получает mode/variables через postMessage bridge без `allow-same-origin`; direct same-origin path оставлен как best-effort для интеграций и тестов.
- Bridge принимает сообщения только от parent, только типа `theme`, только с `light|dark` и строковыми `--vf-*` values.

## Contract matrix после Phase 0

| Path                    |                    Light |                         Dark |    Scoped light |     Scoped dark | Имена                  |
| ----------------------- | -----------------------: | ---------------------------: | --------------: | --------------: | ---------------------- |
| Core static fallback    |                      847 | 53 overrides / 847 effective |             847 |             847 | shared serializer      |
| Core runtime            |                      847 |                847 effective |             847 |             847 | shared serializer      |
| Layouts static fallback |                      124 |  2 overrides / 124 effective |             124 |             124 | shared serializer      |
| Layouts runtime         |                      124 |                124 effective |             124 |             124 | shared serializer      |
| Full core stylesheet    |    canonical entry union |        canonical entry union | тот же contract | тот же contract | no duplicate entry     |
| Component-entry CSS     | isolated canonical entry |     isolated canonical entry | тот же contract | тот же contract | export/consumer tested |

Ecosystem token surfaces не сокращены: CodeBlock сохраняет 55 custom properties, Playground — 48. Layout/core legacy tokens сохранены.

## Изменения, способные повлиять на внешний вид

Palette values и visual language не менялись. Внешне заметны только восстановления уже заявленного behavior и устранение full/entry различий:

- floating labels снова занимают активную позицию в fallback-only mode;
- Drawer снова использует заданные directional offsets и корректно входит/выходит без runtime theme plugin;
- Command Palette icon получает предусмотренный вертикальный offset;
- standalone Input/Textarea получают тот же block geometry, что full stylesheet;
- standalone Select получает те же floating sizes/padding, clear-button geometry и option foreground, что full stylesheet;
- standalone Dialog/Drawer получают те же close/action icon styles;
- standalone MenuBar/Tabs получают тот же horizontal-scroller behavior;
- scoped CodeBlock и Playground реально переключаются между существующими light/dark значениями;
- inherited CodeBlock/Playground больше не создают собственную light/dark boundary и сохраняют ancestor component-token overrides;
- Playground preview background/text и inherited variables соответствуют host scope;
- `color-scheme` синхронизирует browser-native controls внутри theme boundary;
- custom-prefix configurations теперь влияют на compiled Core/Layouts components через канонические compatibility aliases;
- root dark и Switch dark rules одинаково работают с обоими compatibility attributes;
- невалидная selector configuration получает безопасный канонический fallback вместо отсутствующего theme application;
- общий transition guard теперь действует одинаково при full и component imports.

Это parity/fallback fixes, а не новые design values. Полные scoped maps увеличивают размер generated CSS; это осознанный correctness trade-off и не меняет runtime token values.

## Публичный API и совместимость 1.x

- Ни один существующий source token или legacy token не удалён.
- Ни один публичный token не переименован.
- В `VfThemeTokens` добавлены только optional properties.
- Package export maps не менялись.
- Runtime function signatures сохранены.
- Существующий `setCodeBlockThemeVars` дополнительно re-exported из публичного `/view` entry; subpath и signature не менялись.
- Layouts `.d.ts` исправлены в соответствии с уже существующим runtime behavior. Это объективная contract correction; код, полагавшийся на прежний неверный return type, может получить более точный TypeScript inference.
- Девять malformed static-only names удалены из generated fallback CSS. Они не соответствовали source keys, CSS consumers или runtime output; канонические public names теперь одинаковы во всех paths.
- CodeBlock/Playground сохраняют оба совместимых theme attributes; для inherited mode их значение теперь `inherit`, а additive `data-vf-resolved-theme` отдельно отражает effective mode.

## Verification

Выполнены следующие проверки:

| Проверка                                             | Результат                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `npm test`                                           | pass; 365 Vitest tests плюс package smoke/contracts и Icons render smoke |
| `npm run typecheck`                                  | pass                                                                     |
| `npm run lint`                                       | pass                                                                     |
| `npm run lint:styles`                                | pass                                                                     |
| `npm run lint:md`                                    | pass                                                                     |
| `npm run lint:docs-imports`                          | pass                                                                     |
| `npm run build`                                      | pass для всех library workspaces                                         |
| `npm run build:demo`                                 | pass; production showcase/docs bundle собран                             |
| Core CSS contract/parity/form geometry               | pass                                                                     |
| Core CSS exports                                     | 43 CSS и 39 auto-CSS exports pass                                        |
| Layouts CSS/export contracts                         | 21 CSS и 17 JS exports pass                                              |
| CodeBlock/Playground CSS export и consumer isolation | pass                                                                     |
| Core static/runtime exact comparison                 | 847 light, 53 dark overrides, scoped 847/847 pass                        |
| Layouts static/runtime exact comparison              | 124 light, two dark overrides, scoped 124/124 pass                       |
| Canonical/malformed fallback names                   | 9/9 canonical present; 9/9 malformed absent                              |
| Full/component-entry composition                     | каждый canonical entry включён ровно один раз                            |

Ручной production browser smoke выполнен для light и dark без core runtime style injection:

- floating Input/Select/Textarea labels имеют непустые canonical transforms;
- Drawer открыт с ожидаемой geometry и identity transform;
- Command Palette отображается с ожидаемым icon offset;
- все девять malformed variables отсутствуют в computed styles;
- CodeBlock/Playground с `theme="inherit"` сохраняют inherit markers, публикуют корректный `data-vf-resolved-theme` и принимают ancestor component-token overrides;
- explicit light/dark paths и actual sandbox iframe preview используют прежние palette values и соответствующий `color-scheme`;
- browser page errors отсутствуют;
- 14 временных screenshots просмотрены вручную; clipping или очевидного full/entry/theme drift не обнаружено.

Screenshots и временный smoke script не добавлялись в репозиторий. Phase 0 добавляет автоматические contract tests, но не заявляет automated pixel-diff или contrast gate.

## Изменённые файлы

### Theme/core contract и build

- `packages/theme/src/css-vars.ts`
- `packages/theme/src/runtime.ts`
- `packages/theme/__tests__/runtime.spec.ts`
- `packages/core/build/theme-css-artifacts.ts`
- `packages/core/src/theme/default-preset-source.ts`
- `packages/core/src/theme/theme-contract.spec.ts`
- `packages/core/src/theme/theme.spec.ts`
- `packages/core/src/theme/utils.ts`
- `packages/core/src/types/theme.ts`
- `packages/layouts/build/layout-css-artifacts.ts`
- `packages/layouts/src/theme/utils.ts`
- `packages/layouts/src/types/deps-shim.d.ts`
- `packages/layouts/__tests__/layouts.spec.ts`
- `packages/layouts/scripts/smoke-css-export.mjs`

### CSS composition, entries и contracts

- `packages/core/build/css-imports.ts`
- `packages/core/vite.config.ts`
- `packages/core/package.json`
- `packages/core/scripts/check-css-contract.mjs`
- `packages/core/scripts/check-css-parity.mjs`
- `packages/core/scripts/check-form-geometry.mjs`
- `packages/core/scripts/smoke-consumer-auto-css.mjs`
- `packages/core/scripts/smoke-css-export.mjs`
- `packages/core/src/styles/component-entry-parity.spec.ts`
- `packages/core/src/styles/components/actions.css`
- `packages/core/src/styles/components/base.css`
- `packages/core/src/styles/components/feedback.css`
- `packages/core/src/styles/components/forms.css`
- `packages/core/src/styles/components/horizontal-scroller.css`
- `packages/core/src/styles/components/navigation.css`
- `packages/core/src/styles/components/overlay.css`
- `packages/core/src/styles/components/surfaces.css`
- `packages/core/src/styles/components/theme-transition-guard.css`
- `packages/core/src/styles/entries/dialog.css`
- `packages/core/src/styles/entries/drawer.css`
- `packages/core/src/styles/entries/input.css`
- `packages/core/src/styles/entries/menu-bar.css`
- `packages/core/src/styles/entries/select.css`
- `packages/core/src/styles/entries/stepper.css`
- `packages/core/src/styles/entries/switch.css`
- `packages/core/src/styles/entries/tabs.css`
- `packages/core/src/styles/entries/textarea.css`
- `packages/core/src/components/stepper/VfStepper.spec.ts`

### Provider, CodeBlock и Playground

- `packages/core/src/providers/VfThemeProvider.vue`
- `packages/core/src/providers/VfThemeProvider.spec.ts`
- `packages/core/src/__tests__/setup.ts`
- `packages/codeblock/src/codeblock.css`
- `packages/codeblock/src/index.ts`
- `packages/codeblock/src/tokens.css`
- `packages/codeblock/src/components/VfCodeBlock.vue`
- `packages/codeblock/src/components/__tests__/VfCodeBlock.test.ts`
- `packages/codeblock/src/__tests__/plugin.test.ts`
- `packages/codeblock/src/view.ts`
- `packages/codeblock/scripts/smoke-css-export.mjs`
- `packages/playground/src/VfPlayground.vue`
- `packages/playground/src/VfPlayground.spec.ts`
- `packages/playground/src/tokens.css`
- `packages/playground-core/src/runtimes/browserRuntime.ts`
- `packages/playground-core/__tests__/browserRuntime.test.ts`
- `examples/playground/src/sections/codeblock/CodeBlockShowcase.vue`

### Audit documents

- `docs/design-audit/color-audit-report.md`
- `docs/design-audit/color-inventory.md`
- `docs/design-audit/accessibility-colors.md`
- `docs/design-audit/phase-0-report.md`
- `docs/codeblock/guides/index.md`

## Осознанно отложено

- semantic role split, primitives и OKLCH palette;
- любые изменения HEX/color-mix values и contrast tuning;
- focus/control/status accessibility redesign;
- новая Shiki syntax palette;
- component state migration и color-only cue remediation;
- автоматическое обнаружение вставки/замены configured Provider root без mode change;
- автоматическое создание provider-local wrapper boundary: scoped mode задаётся явным DOM attribute boundary;
- перенос teleported overlays внутрь произвольной local boundary;
- повторный Playground variable snapshot при stylesheet-only mutation без DOM/attribute event;
- version bump и coordinated publish Theme/Core/Layouts; при релизе Core/Layouts должны требовать версию Theme с shared serializer;
- automated Axe/contrast/pixel-diff/forced-colors CI gates.

Phase 0 на этом завершена. Следующая фаза не начата.
