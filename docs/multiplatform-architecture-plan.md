# VueForge: план второй мультиплатформенной миграции

Статус: **план одобрен; выполнены M00–M10.1 (включая corrective M07.1 и M10.1)**. Дата анализа: 2026-09-08. Результаты M00/M01 — в приложении В, M02 — в приложении Г, M03/M04 — в приложении Д, M05 — в приложении Е, M06 — в приложении Ж, M07 — в приложении З, M07.1 — в приложении И, M08 — в приложении К, M09 — в приложении Л, M10 — в приложении М, M10.1 — в приложении Н; остальные milestones не начаты.

Единственная спецификация существующего продукта — коммит `fd793696f50d3be0fcd3788f0f8f751c63869963` (далее **reference**). Первая миграция исследована как исторический материал, преимущественно до локального `main` на `921ea7a7969b4510bfc356350eafb72a7a99466d`. Отдельно рассмотрена диагностическая ветка `feat/vueforge-reference-oracle` на `b55b69d96510e3ef68738ef2200ef1c6abd1eac8`; её изменения не следует считать содержимым `main`.

## 1. Executive summary

Нужно сохранить VueForge и последовательно выделить из него общие части. Начинать новую линейку компонентов с заново написанных контрактов нельзя: это повторяет основной механизм расхождения первой попытки. Правило работы — **NO REWRITE UNLESS EXTRACTION IS IMPOSSIBLE**. Исторические Vue API, CSS, DOM hooks, поведение, темы и showcase остаются обязательным условием каждого шага.

Предлагается сохранить существующие npm-пакеты, имена `Vf*`, классы `.vf-*`, переменные `--vf-*` и пути импорта. `packages/core` уже означает Vue-библиотеку `@codemonster-ru/vueforge-core`; превращать этот каталог в нейтральный core при сохранении прежнего package name было бы неоднозначно. Для извлекаемых чистых функций достаточно нового `packages/shared-core`, для существующего общего CSS — `packages/styles`. Существующий `packages/theme` уже не зависит от Vue и остаётся владельцем theme serialization и общих token definitions. Vue-компоненты остаются в своих текущих пакетах.

Razor — PHP-шаблонизатор Annabel. Он получает собственные PHP-компоненты, шаблоны и небольшие browser controllers. Vue использует свои templates/lifecycle и чистые функции shared core; Razor browser controllers используют те же функции. PHP не исполняет TypeScript: для необходимых SSR-вычислений допустимы небольшие PHP-эквиваленты с общими входными/выходными тестовыми данными.

Исторический `examples/playground` сохраняется целиком. Рядом добавляется самостоятельный Razor showcase, использующий тот же каталог проверочных примеров и данные. Сопоставление строится по `caseId`, теме и viewport, через одинаковые URL-параметры и автоматические captures. Универсальный renderer и общий runtime для двух adapters не нужны.

Первый полноценный срез — `VfInput`. Он достаточно содержателен для проверки extraction: native attributes, conditional wrapper, adornments, clear/password actions, сохранение выделения текста, field integration, размеры и floating label. Полный `VfField` или `VfIconButton` не требуется мигрировать одновременно: их существующие Vue-реализации сохраняются; переносится CSS dependency closure и создаются небольшие внутренние Razor helpers для действий и SVG.

Успех среза требует одновременно трёх сравнений: **reference Vue → новый Vue**, **reference Vue → Razor**, **новый Vue → Razor**. Совпадение новых adapters между собой не доказывает сохранение VueForge.

## 2. Состояние Git, границы и доказательства анализа

При начале работы HEAD уже был detached на reference. Отслеживаемых изменений не было. Git показывал неотслеживаемые каталоги `examples/razor/` и `packages/razor/`; они сохранены. Поскольку target commit совпадал с HEAD, создание ветки не требовало замены файлов рабочего дерева. Создана и выбрана `refactor/multiplatform-v2` непосредственно от reference. Предыдущие ветки, коммиты и второй worktree `ui-vueforge` не изменены.

В этом этапе единственное добавление в проект — данный документ. Нет implementation commits, обновления зависимостей, изменений source/CSS/config, переноса компонентов или удаления файлов. Названия каталогов ниже, которых нет на reference, обозначают предложение, а не выполненную работу.

Исследованы дерево reference, manifests, export barrels, исходники компонентов и их тесты, CSS и theme generation, showcase, `git log`, `git show`, структурные и адресные `git diff`, история отдельных путей. Диапазон `reference..main` содержит 733 коммита; существенные этапы сгруппированы ниже. Это архитектурный анализ исходников и истории, а не повторный запуск всех исторических CI-проверок или построчный аудит каждого из 733 patches.

Ссылки вида `commit:path` — воспроизводимые адреса объектов Git: `git show <commit>:<path>`. Для доступных текущих файлов даны пути от корня. Коммиты зафиксированы локально; обновление remote refs не выполнялось. Утверждения о поведении кода отделены от результатов старых запусков. Новые скриншоты, сборки reference/current и browser interaction runs в этом этапе не выполнялись; визуальный PASS здесь не объявляется.

## 3. Historical architecture на reference

### 3.1. Реальная структура и зависимости

Root — private npm workspace `vueforge`, `packages/*` и `examples/*`, `packageManager: npm@11.9.0`, root Node policy `>=24.15.0`. Опубликованные пакеты имеют собственные версии и часть manifests ещё допускает Node `>=18`; это существующая разница требований, которую нельзя молча «исправить» при extraction. Источники: `package.json`, `ARCHITECTURE.md`, manifests соответствующих пакетов.

| Каталог | Публичный пакет и версия reference | Фактическая ответственность |
| --- | --- | --- |
| `packages/core` | `@codemonster-ru/vueforge-core` 2.4.0 | Vue controls, providers, composables, presets, foundation, component CSS; Vue peer, theme/icons/floater dependencies |
| `packages/layouts` | `@codemonster-ru/vueforge-layouts` 2.1.2 | 17 Vue primitives/shells/regions, responsive APIs, собственные presets и CSS; core/Vue peers, theme dependency |
| `packages/theme` | `@codemonster-ru/vueforge-theme` 2.0.1 | Types, motion/breakpoints/color contracts, preset resolution, CSS serialization и явные DOM apply functions; без Vue dependency |
| `packages/icons` | `@codemonster-ru/vueforge-icons` 3.2.0 | VueIconify, именованные glyph modules и registry/metadata, собственный CSS; glyph modules не являются отдельными публичными named exports |
| `packages/codeblock` | `@codemonster-ru/vueforge-codeblock` 4.0.1 | Vue code presentation, copy/highlight/runtime loading; Vue peer и icons dependency |
| `packages/playground-core` | `@codemonster-ru/vueforge-playground-core` 2.1.0 | Sessions/events, TypeScript worker и browser execution; без Vue peer, но со своей предметной областью |
| `packages/playground` | `@codemonster-ru/vueforge-playground` 3.0.1 | Vue playground UI; зависимости на playground-core/codeblock/core |
| `packages/playground-vite-plugin` | `@codemonster-ru/vueforge-playground-vite-plugin` 1.0.0 | Vite integration; не слой UI-компонентов |

Название `playground-core` не делает его кандидатом в общий UI core: execution sessions и workers относятся к playground. Аналогично `core/src/foundation` смешивает чистые breakpoint definitions и Vue composables; переносить эту папку целиком нельзя.

### 3.2. Публичный Vue-контракт шире component props

`packages/core/src/index.ts` экспортирует 47 компонентов: 46 из component barrel и дополнительно `VfThemeProvider`, а также plugin API (`VueForgeCore`, `createVueForgeCore`, default), composables, foundation/theme/async functions и типы. `packages/layouts/src/index.ts` экспортирует 17 компонентов, plugins, theme APIs, responsive functions и публичные slot/exposed types для AdminLayout. Полный компонентный каталог приведён в приложении.

Нужно сохранить root exports, существующие component subpaths, `.css` subpaths, `/foundation`, `/theme`, `/async`, ESM/CJS/SSR поведение, Vue peer range и CSS side effects. `core/package.json` различает browser auto-CSS entry и Node entry: простой перенос SFC в новый пакет не сохраняет этот контракт автоматически. `layouts/src/index.ts` сам импортирует `styles.css`; это тоже observable packaging behavior.

У CodeBlock публичный component entry — `/view`, у Playground — `/ui` с `VfPlayground` и `VfPlaygroundAsync`; package-root import у этих двух пакетов отсутствует. `/highlight` и `/runtime` имеют собственную ответственность. Наличие `src/index.ts` не доказывает опубликованный root export: проверять нужно `package.json#exports`.

В `core/src/types/components.ts` уже есть необходимые union/types: `VfControlSize`, `VfButtonVariant`, `VfSelectOption`, `VfTabItem`, таблицы, navigation, labels. Например, variants Button включают `success`, `info`, `warn`, `help`, `contrast`, а не только primary/secondary/danger/ghost. `VfTabItem` допускает внешние `tabId`/`panelId`. DataTable labels содержат функции; превращение их в JSON-only API было бы breaking change.

### 3.3. Где действительно находятся стили и tokens

CSS core уже внешний: `core/src/styles/entries/*.css`, `components/*.css`, import manifests, foundation. В просмотренных core/layout SFC нет `<style>` blocks. Layout CSS отдельно в `layouts/src/style-entries`, `style-parts`, `styles.css`. Первая задача — переместить владение существующим CSS и сохранить его результирующую сборку, а не извлекать новый дизайн из templates.

Theme engine уже отделён, но defaults распределены: `core/src/theme/default-preset-source.ts`, `color-token-schema.ts`, `layouts/src/theme/default-preset.ts`, другие package presets. В core defaults есть прямые build-time imports из `../../../theme/src/*`; это существующая утечка границы, которую позже следует заменить публичным package entry. Сам `packages/theme/src/runtime.ts` содержит и чистые serializers, и `applyThemeConfig(s)` с `Document`; framework-independent не означает DOM-free.

`core/vite.config.ts` и `core/build/*` генерируют CSS artifacts, разворачивают breakpoint aliases, собирают standalone component CSS, сохраняют auto-CSS JS entries. Уже есть проверки CSS contracts/parity/form geometry и packed-consumer smoke tests. Эту работающую инфраструктуру нужно расширять адресно.

## 4. Historical showcase architecture

Reference showcase — `examples/playground`, а не пустая demo-оболочка. В `src` 20 файлов, в том числе 9 SFC. `main.ts`, `App.vue`, `PlaygroundShowcase.vue`, route helpers и section components собирают работающий Vue/Vite продукт. Основные разделы: Core, Layouts, Icons, CodeBlock, Playground, Colors. Навигация, responsive shell, активный раздел, обработка URL, theme controls и loading behavior входят в baseline.

`App.vue` лениво загружает шесть routes: `/core`, `/colors`, `/layouts`, `/icons`, `/codeblock`, `/playground`. Навигация использует native History API/`popstate`; неизвестный path открывает Core. Shell — `VfThemeProvider → VfAppShell`, navigation — `VfMenuBar`, theme control — `VfThemeSwitch`. `main.ts` устанавливает `VueForgeLayouts` с `defaultTheme: 'system'` и `themeStorageKey: 'codemonster-showcase-theme'`. Icon contexts проверяют light/dark × normal/compact; Colors — primitive scales, semantic swatches, scoped theme panels и состояния controls. Эти композиции должны остаться в каталоге и baseline.

`CoreShowcase.vue` содержит 2870 строк и использует 50 различных `Vf*` tags, включая композиции с layouts. `LayoutsShowcase.vue` — 1286 строк и 13 именованных demo sections. Это не количество публичных core-компонентов: число tags и число exports измеряют разные вещи. Примеры показывают variants/sizes, adorned и floating fields, menu/navigation, controlled state, overlays, таблицы с sorting/pagination/selection/resizing/reordering, async loading, responsive shells и scoped slots.

Источники: `examples/playground/src/sections/core/CoreShowcase.vue`, `core-showcase.css`, `sections/layouts/LayoutsShowcase.vue`, `layouts-showcase.css`, `sections/icons/*`, `sections/codeblock/*`, `sections/colors/*`, `PlaygroundShowcase.vue`, `components/ViteLikeDemoPreview.vue`, `vite.config.ts`.

Данные и Vue state живут рядом с примерами: `ref`, `computed`, callbacks, arrays, labels и local actions. Импорт компонентов и токенов проходит через существующие package entries/dev aliases. VitePress demo integration и interactive playground имеют собственную стоимость сборки; их нельзя превращать в обязательную зависимость Razor.

Текущий DX добавления примера — правка соответствующей section SFC, локальных данных, при необходимости CSS и документации. Крупные section files можно позже делить по компонентам, но только отдельными behavior-preserving изменениями после появления historical route/screenshot gates. Сейчас деление не является prerequisite для migration и не оправдывает удаление примеров.

## 5. Первая миграция: существенные этапы истории

| Этап / проверенные коммиты | Что произошло | Значение для второй попытки |
| --- | --- | --- |
| `2d0083b9` → `7eaf35c2` | Новый продукт CodeMonster UI, `Cm`/`cm-`, package boundaries, independently authored canonical HTML и новые API conventions | Подход был рассчитан на новый публичный продукт. По текущему заданию исходный VueForge имеет приоритет над новой canonical спецификацией |
| `af0b3f38` → `395bc7ac` | Новые tokens/CSS/utilities и инфраструктура contracts | Разделение CSS и framework code полезно; повторное определение token graph вместо точного переноса создало отдельную точку истины |
| `76b84095`, `592a3b63`, `edb54820`, `e54bbe9b`, `20259ed1`, `dabde134` | Отдельные Vue `Cm*` реализации, cohorts форм/navigation/advanced inputs/tables | Это создание adapters нового контракта, а не последовательное уменьшение старых SFC. Совместимость нельзя вывести из сходства названий |
| `bb053445` → `38ef9db2`, последующие PHP cohorts | PHP Razor components/slots/escaping/registry, CSS distribution и tests | Значительная полезная инфраструктура; движок остаётся внешним generic templater, конкретные UI components принадлежат adapter |
| `4e830431`, merge `10daa310` | Showcase переключён на новую линейку; patch удалил 5687 строк и добавил 604 | Демонстрации сократились раньше доказательства полноты. `03afa3fb`, `8a4d633f` затем возвращали каталог и frozen matrix |
| `4a10bf24` → `b5f04ae8` | Coverage inventories, maturity backlog, mappings/codemod, consumer/release checks; `Tag` superseded, shell wrappers/сложные части заменялись recipes | Диспозиция replaced/composed/manual/dropped полезна для отчёта, но не является доказательством API/visual parity |
| `ac41d79a`, `aa9b62a4`, `f7387f20`, `523d2578`, `b7bf169f` | Historical screenshots, exact comparison, cross-platform и interaction matrices | Верный вид проверок появился после масштабной замены. Во второй попытке он должен предшествовать extraction |
| `db0e0423` | Исправлен refresh workflow, копировавший current-adapter captures поверх reviewed reference baseline; уточнены неоднозначные Accordion selectors | Provenance должен проверять реальный источник captures; current output не обновляет historical baseline |
| `a20fbe7c`, `ff3c987b`, многочисленные input/group-box/table/showcase repairs | Исправлен порядок visual work; возвращены token aliases, geometry, icons, layout composition | Локальные поправки showcase маскировали необходимость вернуть общие CSS/tokens и реальные component semantics |
| `9144a9be`, `9ac0d5c0`, `6af7189b` | Demo переименовано в Vue, добавлено Dockerized Razor example, CI ускорено внутри существующих checks | Docker и isolated consumer checks можно использовать. Переименование исторического showcase не нужно для самого extraction |
| `0a6c19b6`, `81019258`, `3f6537e9`, `ca72a277` | Native Select/DatePicker первой попытки вновь заменены authored controls | Native control не обеспечил historical UX. Во второй попытке исходные custom Vue controls уже есть — их не нужно сначала удалять |
| `fffcb50e`, `5b9b65a4`, `73006d84`, `81640a0e` | Объявлено завершение M12, добавлены bundled fonts, уточнены visual measurements и reduced-motion literal | Старый PASS относится к конкретным cases/environment. Он не заменяет проверку всех нынешних API и маршрутов |
| `d304ed1e`, `195a8eb8`, `df23f7c2`, `dae64be9`, `c145773e` | Вынесены чистые rules, исправлено конкурирующее управление DOM из Vue и runtime | Чистые функции пригодны для повторного анализа; runtime hydration ownership требуется спроектировать до подключения Razor controllers |
| `574344aa`, `5aa6df14`, `895bee59` | Согласованы DOM comparators, раскрыты CI-only checks, добавлены guards на frozen showcase/controller coverage | Проверки должны доказывать реальное выполнение gate, а не наличие скрипта в package.json |
| `593a60f3` → `65137616`, `c20e5136`, `1771462a` | Layouts возвращены отдельной линейкой, theme стал подсистемой, icons перенесены как данные | Разделение данных icons полезно. Новые theme/scoped-slot решения являются API redesign и не должны переноситься как defaults |
| `19748e6c`, `eb0fdf83`, `921ea7a7` | Исторические пакеты/showcase/migration checks удалены из main; затем обогащены шесть demo и восстановлены части пяти layouts; последний commit прямо признаёт оставшиеся потери SetupLayout brand/toolbar/aside permutations | Reference нельзя объявить ненужным после достижения узкой matrix. В новой ветке он остаётся живым oracle |
| `fb2e4501`, `b55b69d9` в отдельной ветке | Возвращён reference renderer для новых cases, diagnostic report/ratchet workflow | Использовать идею сравнения с историческим кодом; устранить ограничения fonts, report-only и неполной matrix до принятия как gate |

## 6. Подтверждённые regressions и их причины

| Наблюдение по исходникам / истории | Почему возникло | Как предотвратить |
| --- | --- | --- |
| `Vf*`/`vueforge-*`/`.vf-*` заменены `Cm*`/`ui-*`/`.cm-*` | Rebranding и новый contract стали частью migration | Сохранить единственную существующую публичную систему имён; никаких rename codemods для этой задачи |
| `main:packages/vue/src/components/input/CmInput.vue` больше не имеет `leadingIcon`/`trailingIcon`; `type` ограничен шестью text-like values, тогда как reference передаёт native `type` через attrs | Компонент заново реализован по сокращённому contract | Compile/runtime cases для прежних props и native attrs до extraction; не нормализовать `number`, `date` и другие исторически допустимые attrs в `text` |
| Input меняет target consumer `class`/`style`: при adornments reference ставит их на wrapper; main — на input. Удалены field injection и `data-vf-filled`; clear меняет emission и структуру empty-state; password restore потерял direction и дополнительный animation frame | Универсальные root-attribute rules и новая реализация не описывали исключения reference | Сохранить per-component forwarding, event traces, conditional DOM и selection behavior; testing отдельно plain/adorned/empty/floating |
| `main:packages/vue/src/components/tabs/CmTabs.vue` требует id, вводит новый value format, `valueChange` вместо `change`, именованные по value slots вместо `tab`/`panel`, удаляет external panel IDs, меняет lifecycle panels | Независимый canonical HTML и удобство сериализуемых fixtures стали ограничениями Vue API | Извлечь rules из существующего VfTabs, оставить slots/id/lifecycle в Vue, описать отдельный PHP способ предоставить content |
| ThemeSwitch стал трёхпозиционным subsystem control с иным persistence; AppShell scoped slots заменены DOM attributes; пять region wrappers исключены | Ограничения нового Razor API перенесены на Vue; продуктовая переработка смешана с миграцией | PHP composition может отличаться, Vue API остаётся прежним; subsystem redesign — отдельное предложение |
| `4e830431` сократил showcase; `19748e6c` удалил историческую app | Coverage/«migration complete» подменили проверку реальной полноты | Route/example inventories и historical reference остаются gate до и после rollout |
| `ff3c987b` возвращает `textLabel`/`textBody` token indirections; `81640a0e` возвращает `0.01ms` вместо `0ms` | При переносе сохранены похожие числовые значения, но изменены связи/семантика tokens | Сравнивать token graph, resolved values, overrides, theme selectors, media rules и timing |
| `c145773e` фиксирует одновременное изменение aria/hidden/tabindex Vue и runtime controller | Canonical DOM требовал controller hooks даже у Vue; runtime мог менять controlled state вопреки parent | С самого начала Razor-only mount roots; Vue вообще не получает auto-activation marker |
| `main:examples/razor/public/index.php` подключает CSS, но не browser JS; пример содержит закрытый Accordion с button triggers | Наличие controller source/SSR tests не обеспечило его реальную доставку в app | Проверять installed/browser example: открыть страницу, нажать trigger, увидеть изменение; scripts/assets должны входить в delivery contract |
| `1f2dee35` поздно добавляет CSS peer в Vue manifest; несколько commits синхронизируют Razor CSS | Dependency/distribution contract был слабее source contract | Packed consumer + CSS dependency checks; единственная generated asset source и проверка hash/version |

Источники различий ThemeSwitch/AppShell также прямо перечислены в `main:docs/codemonster-ui-2.0-release-notes.md`. Этот документ одновременно продолжает ссылаться на уже удалённый `examples/vue`; это пример устаревшего описания, поэтому статус roadmap/release notes нельзя считать более сильным доказательством, чем дерево соответствующего коммита.

Не подтверждено, что первая попытка имела единый универсальный production renderer или Vue imports внутри её чистого behavior core. В поздней реализации rendering действительно раздельный, а `runtime/src/core` — полезное направление. Проблема прежде всего в происхождении контракта, изменённых Vue APIs, ownership и неполных acceptance gates. Все заявленные визуальные эффекты, не доказанные новым capture, остаются рисками для проверки, а не измеренными сейчас pixel regressions.

## 7. Что сохранить из первой попытки

Переиспользование означает перенос минимальной подходящей части после проверки против reference; не wholesale cherry-pick feature ветки.

| Часть | Решение и условие |
| --- | --- |
| Shared CSS/token ownership | Сохранить принцип; исходные значения, selectors и dependency graph брать из reference |
| `runtime/src/core` rules и unit tests | Перечитать как кандидатов: Tabs/Input/disclosure/calendar/table helpers полезны, если не навязывают новое default/validation поведение |
| PHP provider/templates/attribute escaping/slots | Использовать integration pattern и security tests; рендерить reference-derived markup/API mapping |
| Significant DOM comparator | Сохранить normalization boolean attrs, class ordering, ID relationships, comments; ослабления только адресные и обоснованные |
| Shared PHP/JS conformance cases | Использовать для небольшой двойной SSR/browser реализации правил; тесты должны содержать неудобные historical values, а не только happy path |
| Visual capture и frozen reference provenance | Перенести минимальный воспроизводимый harness с проверкой environment/fonts и двумя real adapters |
| Browser accessibility/interaction tests | Сохранить подход; заменить ожидания нового API историческими expectations и проверить реальные bootstrap paths |
| Packed npm/Composer consumers, SSR/auto-CSS/tree-shaking tests | Дополнить existing baseline tools; не переносить запрет `Vf*`/VueForge imports |
| Dockerized PHP workflow | Сохранить воспроизводимый PHP/Composer запуск в изолированной fixture |
| Icon data extraction (`1771462a`) | Сохранить идею одного набора SVG data без второго renderer; проверить glyph/viewBox/stroke/size и прежний Vue API |
| CI coverage/ownership guards | Проверять факт запуска, required matrix и отсутствие адаптерных циклов; не создавать job для гипотетических adapters |

## 8. Что отбросить или заменить

Отбросить новую canonical спецификацию как источник истины для существующего VueForge; она может быть справочным материалом, но не основанием изменить baseline. Не переносить `Cm` rename, новые mandatory IDs, value regex, сокращённые variants, slot/event renames, arbitrary normalization или новый theme persistence в прежний Vue API.

Не переносить native Select/DatePicker как упрощённую замену, blanket policy «все behavior rules ровно один раз на TypeScript» для PHP SSR, controller markers на Vue roots, schema-driven universal renderers, generic component state machines и contract DSL. Не нужны заранее зарезервированные React/Angular/Web Components packages, utilities package ради нового utility CSS или общая orchestration app для двух frameworks.

Не переносить migration codemods/removal gates, которые измеряют исчезновение VueForge imports: в новой задаче эти импорты должны сохраниться. Не принимать замену компонента recipe, `dropped` или решение «остаётся в старом продукте» как эквивалентность API. Прежний компонент может оставаться Vue-only во время rollout, но должен оставаться доступным и проверяемым.

Убрать из нового подхода локальные compensating offsets showcase и тестовые DOM fixtures, которые рисуют более удачную реализацию, чем реальный adapter. CSS artifacts для Composer могут быть copies при публикации; независимые редактируемые копии CSS не допускаются.

## 9. Proposed target architecture и package responsibilities

Сохранение существующих каталогов уменьшает diff и риск consumer regressions. Ни `apps/`, ни `packages/vue` не являются обязательными для правильного направления зависимостей.

```text
packages/
  theme/                 существующий theme engine + извлечённые neutral defaults
  shared-core/           новые pure rules и действительно общие TS contracts
  styles/                существующий CSS, transferred без redesign
  core/                  существующий Vue adapter, прежний vueforge-core API
  layouts/               существующие Vue layouts, прежний API
  icons/                 существующий Vue icons API
  codeblock/             существующий Vue codeblock API
  playground-core/       существующий execution/session package
  playground/            существующий Vue playground API
  playground-vite-plugin/
  razor/                 PHP rendering + собственный browser enhancement
contracts/               обычные case data и описания historical semantics
examples/
  playground/            исходный Vue showcase
  razor/                 отдельный PHP showcase
  shared/                данные/examples index, без renderer/framework imports
```

`shared-core` имеет узкий scope: types/value rules, используемые реальными Vue и Razor browser implementations. Он не содержит DOM, Vue, PHP, rendering, configuration registry, plugin lifecycle или автоматическую регистрацию всех компонентов. Статическому Card core module не нужен. Public surface состоит из используемых функций; внутренний helper без второго потребителя остаётся рядом с компонентом.

`theme` остаётся владельцем serializers, token definitions и preset resolution; чистые функции и browser apply effects разделены по modules/entries, сохраняя прежние exports. Перенос package-specific presets выполняется только при появлении shared CSS потребителя, без Vue type imports в neutral definitions. Storage/matchMedia/reactivity интеграции Vue остаются в Vue.

`styles` владеет foundation, existing component/region CSS и его import graph. Оно получает tokens от theme, не зависит от adapters и не знает о Vue lifecycle. `core` и `layouts` сохраняют свои CSS exports, собирая их из единственного shared source. Это продолжение существующего distribution API, не вторая implementation или compatibility renderer.

`razor` — один Composer package с PHP source/templates и собственным browser entry. Небольшая JS build configuration внутри него оправдана первым interactive component; отдельный generic runtime npm package до появления внешнего потребителя не нужен. Если browser entry позже необходимо публиковать независимо, выделение рассматривается отдельно по реальной delivery потребности.

`icons` пока остаётся Vue package. Для Razor нужны neutral SVG data без Vue dependency; их можно выделить в узкий data module/package при реализации icon support. Нельзя импортировать Vue icons renderer в shared core. `codeblock` и `playground` сохраняются работающими Vue-пакетами и в showcase; перенос их execution infrastructure не входит в первый UI срез.

Рабочие имена новых npm packages: `@codemonster-ru/vueforge-shared-core`, `@codemonster-ru/vueforge-styles`; Composer adapter — `codemonster-ru/vueforge-razor`. Это предложение имён, без проверки registry availability и без публикации. Существующие имена и версии не меняются в рамках установления boundaries.

## 10. Package dependency graph

В диаграмме стрелка означает **«зависит от»**. Пунктир — build/test/data artifact dependency, а не PHP import JavaScript.

```mermaid
flowchart TD
  Vue[core: существующий Vue adapter] --> Shared[shared-core: чистые rules/types]
  Vue --> Styles[styles: общий CSS]
  Vue --> Theme[theme: tokens/presets]
  Layouts[layouts: Vue composition] --> Vue
  Layouts --> Styles
  Layouts --> Theme
  RazorBrowser[razor/browser: DOM controllers] --> Shared
  RazorPHP[razor: PHP rendering] -. test vectors .-> Contracts[contracts: historical cases]
  Shared -. conformance tests .-> Contracts
  RazorPHP -. packaged CSS .-> Styles
  Styles --> Theme
  VueShowcase[examples/playground] --> Vue
  VueShowcase --> Layouts
  RazorShowcase[examples/razor] --> RazorPHP
  RazorShowcase --> RazorBrowser
  VueShowcase -. example data .-> Cases[shared cases]
  RazorShowcase -. example data .-> Cases
```

Ни styles, ни theme, ни shared-core не импортируют Vue adapter или Razor. Razor не зависит от `core`/`layouts`/Vue runtime. Vue не зависит от Razor bootstrap. `layouts → core` допустим: оба относятся к существующему Vue adapter. В source/build scripts также проверяются escape imports вида `../core/src`; корректный runtime graph не оправдывает обратную build dependency.

Composer не устанавливает npm dependencies автоматически. CSS/JS/data artifacts готовятся при сборке release из pinned shared packages; host PHP page получает готовые assets без Node server. Для development build нужны локальные workspace packages; для published consumer — semver dependencies, проверенный архив и manifest. Порядок будущей сборки: theme/shared-core → styles → Vue и Razor browser/assets → layouts/остальные зависимые пакеты → examples/consumers.

Тестовые vectors принадлежат `contracts`, а не опубликованному behavior runtime. Если PHP понадобится generated constant data из shared-core/theme, это отдельный build artifact dependency с source hash; PHP не импортирует TS module. Shared cases showcase используют эти contract cases или ссылаются на них, не создавая вторую семантическую спецификацию.

## 11. Component contract model

Контракт сначала извлекается из reference source, exports, tests, showcase и observable behavior. Он не проектируется независимо, чтобы затем переделать под него Vue. Если baseline имеет accessibility defect или противоречие в docs, записать его отдельно; не исправлять молча вместе с extraction. Улучшение возможно отдельным reviewed change после доказательства совместимости.

| Часть контракта | Представление | Что проверяется |
| --- | --- | --- |
| Props, enums, sizes, defaults | Existing TS types и небольшой обычный object для shared facts | Optionality, absent/null/empty semantics, native attrs, invalid input behavior reference |
| Events | Vue signatures + описание semantic outcome и PHP/browser mapping | Payload, order, count, controlled/uncontrolled behavior; одинаковое имя во всех frameworks не требуется |
| Slots/content | Vue slot names/scopes сохраняются; PHP named/default content описывается отдельно | Placement, fallback, escaping, смысл content; callbacks/refs не сериализуются |
| States/interactions | Prose + обычные executable test functions | Transition, disabled/readonly/loading, focus, keyboard, selection, close reasons |
| CSS/DOM | Перечень contractual hooks, selectors и небольшие focused fixtures | Root/attrs target, relationships, classes, wrapper conditions, theme inheritance |
| Accessibility | Accessible name, roles, label/description IDs, keyboard/focus | Browser output и реальный user flow, а не только HTML strings |
| Shared rules | Pure functions + simple JSON input/output vectors | Одинаковые результаты JS/PHP там, где SSR обязан вычислять те же значения |
| Example data | Plain serializable objects/JSON | Stable caseId, fixture inputs, expected capability; без templates/functions внутри JSON |

Минимальный illustrative contract fragment, не новый DSL и не код реализации:

```ts
export type VfControlSize = 'sm' | 'md' | 'lg';

export const inputContract = {
  reference: 'fd793696f50d3be0fcd3788f0f8f751c63869963',
  sizes: ['sm', 'md', 'lg'],
  defaults: {
    modelValue: '', size: 'md', invalid: false,
    clearable: false, passwordReveal: false,
  },
  slots: ['leading', 'trailing'],
  vueEvents: ['update:modelValue'],
} as const;
```

Этот object не заменяет контракт attrs, icon props, field injection или selection behavior. Не нужно описывать TypeScript type system заново в JSON Schema. PHP потребляет JSON test vectors и явные render inputs; небольшая build-time выгрузка данных допустима лишь при реальном потребителе. Она не генерирует component templates или component classes.

Validation переносится только вместе с существующей семантикой: отсутствие исторической runtime validation не разрешает ввести новые throwing checks, required ids или regex на values. Browser native validation и server application validation остаются разными слоями. Labels/formatting callbacks Vue остаются функциями; PHP может получить строки или собственные callbacks, не вынуждая Vue перейти на меньший API.

## 12. CSS architecture

Сначала зафиксировать reference token graph и flattened CSS, включая order/specificity/media/selector dependencies. Затем перемещать существующие файлы с минимальными import edits; не переименовывать классы, custom properties, semantic tokens, theme attributes или presets. Tailwind не используется.

Сохранить одновременно полный stylesheet и standalone component CSS, foundations/reset, reduced-motion/forced-colors, auto-CSS subpaths и Node SSR entries. Общий CSS может быть одним из главных shared implementation layers именно потому, что baseline уже построен на global `.vf-*` selectors. Изменять DOM, пока selectors требуют прежних siblings/ancestors, нельзя.

Для Input dependency closure начинается с `input.css → field.css + icon-button.css` и их собственных imports/tokens. Floating selectors зависят от положения label относительно input/wrapper и `.vf-field--floating-in`/других modes; извлечение только `.vf-input` rules потеряет поведение. CSS supporting components можно вынести без миграции их Vue source/API.

Theme comparison проверяет не только итоговый цвет: primitive → semantic → component aliases, dimensions, typography, line-height, borders, shadows, motion, breakpoint expansion, root font scaling, scoped presets и custom overrides. `var(--vf-text-label-font-size)` не заменять числовым эквивалентом: иначе consumer override перестанет распространяться. Сохранить `data-vf-theme`, storage semantics и существующие provider APIs.

Adapter-specific CSS допустим для доказуемого framework lifecycle hook, например уже существующих Vue transition classes. Он остаётся малым и colocated; базовые размеры/отступы/палитра/иконки не должны различаться между adapters. Первому Input срезу не нужна вторая Razor skin. Стили рамки showcase принадлежат showcase; любые поправки, компенсирующие component mismatch, исправляются в общих styles/contract.

Для Composer выпускать generated CSS artifacts с version/hash/source provenance. Сравнивать их с output shared styles; запрещать ручные правки копий. Проверить CSS-only PHP consumer без Vue JS и Vue packed consumer с прежними import paths. Fonts фиксировать как часть capture environment; добавление нового bundled font в продукт — отдельное изменение, если reference фактически использовал другую face.

## 13. Vue adapter architecture

Существующий SFC остаётся implementation. Последовательность для компонента: historical characterization → unchanged CSS ownership transfer → извлечение реально общих pure calculations → types/contracts из существующего API → Razor implementation. Компонент становится меньше только там, где это получилось без изменения результата.

В Vue остаются `ref/computed/watch`, `inject/provide`, slot functions/scopes, `useAttrs`, `useSlots`, `useId`, component refs, `nextTick`, transitions/Teleport, focus scheduling, observers и cleanup. Shared core возвращает данные, Vue сам применяет их declaratively. В Vue не монтируется Razor browser controller.

При Input extraction сохранить строковый `modelValue`, local currentValue/watch, точную проверку boolean attrs, forwarding исключений, clear emission, ref focus, password selection direction и animation-frame restore, `vfFieldContextKey` и cleanup. Pure calculations получают plain values: clear eligibility, derived adornment state и password action metadata. Вынос Vue context или универсального «field state service» не нужен.

Сохранить plugin registration, public types/composables, all export conditions и CSS side effects. Типы можно re-export из shared module под прежними именами; нельзя превращать root package в dual `Vf`/`Cm` API или менять import paths. Consumer fixture использует неизменённый код reference, а не автоматически переписанный codemod результат.

## 14. Razor adapter architecture

Доступен настоящий PHP source: `/Users/kolesnikov_k_a/Projects/Codemonster/PHP/annabel/packages/razor`; рассмотрен checkout Annabel `f037701378fc92ec311f29f30f7130711f3471a7`. В первой UI миграции adapter использует `codemonster-ru/razor ^2.1`, `codemonster-ru/view ^2.0`, PHP `>=8.2`. Это локально проверенная integration capability, не предположение об ASP.NET.

Generic Razor engine владеет parsing/compilation, registry/provider/resolver, prop и slot mechanics, render context, escaping/trusted markup и diagnostics. UI adapter владеет конкретными `vf-*` tags, defaults/attribute mappings, template markup, component content и browser assets. В UI repo не копируется compiler и не добавляется собственная template language.

Каждый PHP component render получает props и native content, формирует безопасные template parameters и рендерит обычный HTML через engine. Default/named slots остаются idiomatic Razor content. Vue scoped slots с callback не нужно буквально воспроизводить: PHP предоставляет данные своему template/render call или заранее готовый content соответствующего смысла. Это различие синтаксиса и lifecycle, не повод удалить scoped slot в Vue.

Attributes требуют component-specific mapping: например, `clear-label` ↔ `clearLabel` был отдельно исправлен в `59ad9f59`. В Razor template допустима lowercase/kebab запись; camelCase может быть ключом programmatic PHP render call, если adapter поддерживает такой alias. Проверить mapping, collisions и precedence, не обещая camelCase syntax в шаблоне. Quoted literals остаются строками, `:prop="$expression"` вычисляет PHP expression, bare boolean attribute означает true. Не путать HTML boolean attribute presence с PHP truthiness строки `"false"`. Простые строки экранируются; `RenderedHtml::fromTrustedString` обозначает уже доверенный HTML и не является sanitizer. Проверить attribute injection, unsafe URLs, nested slots, repeated IDs и ошибочные props существующими безопасными patterns.

Shared TS behavior напрямую используется только Razor browser entry. PHP SSR может повторить минимальное вычисление initial state; например, первая попытка уже имела `CmAccordion.php::openItems` и `resolveAccordionOpenItems` в TS. Для двух языков общими становятся спецификация и vectors, а не runtime. Не нужны PHP→Node bridge, transpiler TS→PHP, JSON interpreter или серверный Vue renderer.

Browser controller получает explicit Razor root, attaches только необходимые listeners, вызывает shared pure rules и владеет DOM своего subtree. Lifecycle — `mount`/`destroy` при реальной замене subtree; идемпотентность и cleanup проверяются. Vue roots не имеют Razor activation marker. Mixed page допускается: bootstrapping ограничен Razor containers, без MutationObserver auto-discovery всего документа. Поздняя оптимизация возможна при конкретном host requirement.

SSR Input остаётся нативным `<input>` с name/value/type/required/disabled/readonly и label relationships. Без JS доступен ввод и submit; enhancement actions появляются/становятся доступны после bootstrap, без ложного обещания работающих clear/reveal controls. Полный no-JS эквивалент сложного combobox/dialog не обещается: для каждого будущего компонента фиксируется честный fallback. Его отсутствие нельзя использовать как повод обеднить исходный Vue control.

Floating label требует отдельной no-JS стратегии: historical CSS удерживает label через `:focus-within` или `.vf-field__control--filled`, который обновляет Vue. У статического PHP field после ввода и blur filled state сам не изменится. Поэтому до enhancement использовать обычную nonfloating label composition, затем включать точный floating state через packaged bridge. No-JS suite проверяет `type → blur`, label/value overlap и submit, а не только первый SSR frame.

Поставка — Composer PHP/templates + versioned built CSS и browser assets; явный documented asset entry. Dev showcase может собирать browser JS локально, production PHP не требует Node. Проверка должна открыть реальную PHP-страницу и воспользоваться interactive control: PHPUnit render assertions отдельно не закрывают browser functionality.

## 15. Showcase: рассмотренные варианты и выбор

| Вариант | Польза | Стоимость/риск | Вывод |
| --- | --- | --- | --- |
| Одна Vue app переключает renderer | Общая navigation chrome | PHP требует отдельный server/iframe/fetch HTML, bootstrap и teardown; смешение DOM/CSS ownership | Не выбирать для первого среза |
| Две полностью независимые apps/examples | Нативный lifecycle | Дублирование данных, потеря сопоставимости, разъезд coverage | Недостаточно без общего case index |
| Две native apps + plain shared example data/specifications | Сохраняет historical app, простой PHP, одинаковые inputs, независимые lifecycle | Два небольших mapping/render слоя, что неизбежно для разных platforms | **Выбрать** |
| Универсальный schema renderer | Автоматическая demo matrix | Новый framework/DSL, неполный Vue slot API, проверка synthetic implementation | Отклонить |
| Пара страниц в iframe | Быстрое visual сопоставление без смешения DOM | Нужны два servers, одинаковый viewport и отдельный standalone run overlays | Только необязательное средство ручного сравнения после среза |

Исторический Vue showcase не заменяется минимальным новым каталогом. Его routes, navigation, shell, examples, данные и interactive demos остаются baseline. Shared index добавляет адресуемые cases поверх него. Исторические большие demonstrations сохраняются как product-level coverage; маленькие isolated cases дополняют их для точного поиска причины расхождения.

`examples/shared` содержит case IDs, описания, serializable data, viewport/theme metadata и ожидаемую поддержку. Vue examples продолжают писать обычными Vue templates; PHP — обычными Razor templates. Не переносить callback/slot/render expressions в JSON. Для сложного scoped example общий contract задаёт пользовательский сценарий и данные, а каждая app реализует его native способом.

В каталогах видны все baseline components. Пока Razor implementation отсутствует, отображается статус «Vue; Razor ещё не реализован» и reference example; компонент не исчезает из navigation и не считается parity-supported. Новые компоненты без reference могут иметь отдельную секцию, не уменьшая frozen catalog.

DX нового case: добавить stable ID и общие данные, добавить native render example Vue и Razor при заявленной поддержке, зарегистрировать checks. На первом Input достаточно explicit map из нескольких case IDs; generic component factory не нужен. Разделение больших historical SFC — позже, отдельным проверяемым шагом без изменения screenshot output.

## 16. Демонстрация parity в showcase

Обе apps получают одинаковые `component`, `case`, `theme`, `viewport` параметры или эквивалентные стабильные routes. Из Vue case доступна ссылка на тот же Razor case и обратно. Переключение платформы выполняет навигацию между приложениями; оно не встраивает PHP renderer в Vue lifecycle.

Первый Input каталог показывает plain/adorned/clear/password/floating варианты, все размеры, initial/filled/empty/invalid/disabled/readonly, keyboard focus и восстановление cursor. Данные, labels, locale и ширина контейнера совпадают. В отдельном reference server тот же case рендерит исходный `VfInput` без совместного импорта нового CSS.

Для ручной проверки достаточно двух URL и generated contact sheet/overlay из тех же captures. Если later side-by-side view полезен, он открывает isolated frames фиксированного внутреннего viewport; это отдельная tooling page, не новая showcase architecture. Overlays/Teleport и responsive layouts обязательно проверяются также в standalone document.

Не принимать parity из screenshot одного default Button. Проверяется реальная Vue app и реальная PHP app с теми scripts/styles, которые получит consumer. Historical full-page frames проверяют качество layout/navigation/showcase, isolated frames — component rendering, interaction frames — состояния после действий.

## 17. Cross-platform parity strategy

Матрица имеет три независимых направления и явные capability markers:

| Сравнение | Что оно доказывает | Что не доказывает |
| --- | --- | --- |
| Reference Vue → extracted Vue | Сохранение Vue API/поведения/внешнего вида | Работоспособность Razor |
| Reference Vue → Razor | Эквивалентный UI результат заданного shared scenario | Буквальную реализацию Vue lifecycle в PHP |
| Extracted Vue → Razor | Отсутствие adapter divergence на поддержанных cases | Сохранение baseline, если оба adapters ошибаются одинаково |

Разделить equivalent user behavior (ввод/выбор/открытие/keyboard/focus/submit/accessibility) и native framework mechanics (Vue emits/refs/watch/slots/SSR hydration против PHP render calls/browser events). У Vue event names/signatures сохраняются; Razor может использовать DOM `input`/`change` и документированный semantic event, если результат эквивалентен. Нельзя требовать одинакового event transport ценой изменения Vue event order/count.

DOM сравнивается строго там, где он контракт CSS, consumer selectors, forms или accessibility. Нормализовать можно ordering attributes/classes, эквивалентные boolean attrs, framework comments/scoping metadata и автоматически созданные ID values при сохранении связей. Нельзя скрыть разницу root attributes, text, conditional wrappers, roles, name/value, focus order или panel lifecycle широкой normalization rule.

Для reference/extracted Vue production output цель — **0 changed, 0 missing, 0 unexpected** в одинаковом capture environment. Для Razor требовать тот же видимый результат на shared cases; framework-only differences описывать по компонентам и проверять отдельно. Не увеличивать допустимое pixel отклонение для всего компонента, чтобы пропустить geometry или glyph mismatch.

Трёхстороннее interactive/visual comparison выполняется после успешного bootstrap в одинаковом состоянии. SSR/no-JS — отдельная suite с честными capability/fallback expectations. Например, отсутствие ещё неработающей clear action до Razor bootstrap не сравнивается с уже interactive Vue как один и тот же state; после bootstrap её вид, поведение и доступность обязаны совпасть.

## 18. Testing strategy и качество доказательств

### 18.1. Минимальный набор gates

| Gate | Проверка | Регрессия, которую он должен поймать |
| --- | --- | --- |
| Historical API | Неизменённые consumer source fixtures: imports/types/props/events/slots/plugins; compile и runtime | Rename, новые required props, удалённый slot/type/subpath, changed attrs |
| Characterization | Reference/extracted event traces и state transitions | Clear emission, controlled state, defaultValue, focus return, selection direction |
| Significant DOM/CSS | Focused snapshots + selector/relationship assertions | Изменение wrapper/label adjacency, class target, hidden/aria/IDs |
| Tokens/styles | Dependency graph + computed values/overrides + full/standalone CSS | Потеря aliases, font metrics, specificity, breakpoints, reduced motion |
| Visual component | Reference/extracted/Razor screenshots, одинаковые inputs | Визуальное расхождение обоих новых adapters с reference |
| Visual product | Полные historical routes, desktop/mobile, обе темы | Урезанный showcase, missing sections, shell geometry, responsive behavior |
| Interaction browser | Реальный Vue/Razor bootstrap, pointer/keyboard/form submit | Controller не доставлен, двойной handler, stale controlled DOM |
| Accessibility | Axe как автоматическая часть + keyboard/focus/labels/forced colors/manual cases | Ошибка semantics/focus, которую screenshot не показывает |
| SSR/no-JS/hydration | Vue server render/hydrate и PHP page без JS/с JS | DOM ownership race, id collision, broken native submit, inaccessible dead controls |
| Package consumers | Existing npm exports/auto-CSS/CJS/SSR/tree-shaking + Composer archives/assets | Локальная workspace сборка работает, published consumer — нет |
| Gate coverage | CI явно запускает всё required и проверяет количество cases | «verify passed», хотя visual/PHP/browser suites пропущены |

Для platform-independent helpers tests используют plain data без DOM/framework. Для adapters проверять перевод inputs/outputs и реальную интеграцию; не дублировать весь helper algorithm в ожиданиях. PHP SSR equivalents имеют те же edge-case vectors. Security tests PHP не заменяют browser tests.

### 18.2. Reference harness и воспроизводимость

Reference собирается из immutable `git archive`/отдельного checkout на точном commit в изолированном рабочем каталоге. Shared working tree не переключается между capture шагами. Test wrapper может создавать общий fixture вокруг настоящего historical component; он не изменяет component source/style. Никакой новый adapter CSS не должен попадать на historical page.

До первого изменения зафиксировать lockfile/toolchain, browser revision, OS/container image, viewport/DPR, locale/timezone, color scheme, reduced motion, font files/face weights и source hashes, fixture frame, scrollbar, screenshot timing. Ждать реальной загрузки шрифтов, route readiness и stable layout; произвольный sleep не заменяет readiness. Async data и clocks должны быть deterministic на обеих сторонах. Mask только реально недетерминированные области с объяснением; не маскировать компонент или required state.

Baseline записывается из reference и сопровождается manifest с `referenceCommit`, case inventory, viewport/theme и environment/assets hashes. Current captures не могут автоматически обновлять reference images. Изменение baseline — отдельный review diff. New missing/unexpected case — failure, а не автоматическое уменьшение denominator.

### 18.3. Ограничения старых visual доказательств

На `19748e6c^` историческая infrastructure содержала 264 full-showcase frames по пяти routes — Core, Layouts, Icons, CodeBlock, Playground, без Colors — и 44 state frames (11 cases), а также 48 cross-platform frames. После sunset в main осталось 48 cross-platform frames: 12 cases × 2 темы × 2 viewport. В этой matrix нет layout visual fixtures. Поэтому зелёный cross-platform CI не исключает потерю layouts или historical showcase. Новая M00 matrix должна включать все шесть routes, в том числе `/colors`, а не унаследовать старый пробел.

`main:scripts/visual/cross-platform-fixture/main.ts` монтирует настоящий Vue component, но Razor HTML вставляет через `innerHTML` без запуска controllers. Такие captures проверяют initial SSR appearance; interactive Razor parity из этих 48 кадров не следует. Новый harness должен иметь отдельные SSR/no-JS cases и cases с реальным adapter bootstrap.

На `feat/vueforge-reference-oracle` есть полезная попытка снова сравнивать настоящую reference implementation. Но `b55b69d9` использует manual workflow с `--report-only=true`, не является required CI gate; ratchet не заменяет zero-diff, а разрешение dimension mismatch нуждается в отдельном строгом контроле. Font injection также требует исправления: historical capture включает fonts только при `--font=inject`, workflow этот флаг не передаёт, тогда как current fixture импортирует `ui-css/fonts.css`. Один browser runner не гарантирует одну фактически загруженную font face.

Число `44/48 differing`, сообщённое в истории oracle, нельзя здесь приписать только component regressions: необходимо повторить capture с согласованными fonts и проверить loaded faces. Полезны старые scripts, а не безусловное доверие их старому verdict. Новая migration начинается с подтверждённого reference-vs-reference control run и только затем reference-vs-extracted comparison.

## 19. Пошаговая migration sequence

Все milestones ниже **не начаты** и выполняются только после отдельного подтверждения этого плана. Каждый имеет узкий diff, проверку и самостоятельный rollback. Rollback будущих committed changes — обычный `git revert` соответствующих focused commits; история первой попытки не переписывается.

| ID / phase | Изменение | Exit evidence | Граница commit / rollback |
| --- | --- | --- | --- |
| M00 / Phase 0 | Зафиксировать machine-checkable exports/components/routes/cases inventory reference; минимальный immutable capture harness всех шести routes, включая Colors | Полный каталог приложения и public APIs; reference-vs-reference без отличий в pinned environment | Только baseline tooling/data; revert не затрагивает product |
| M01 / Phase 0 | Characterization Input и unchanged consumer fixture; full historical showcase frame set | Tests проходят на reference; deliberate negative fixture подтверждает обнаружение props/class/case loss | Tests/fixtures отдельно от extraction |
| M02 / Phase 1 | Минимальные shared-core/styles boundaries и dependency check без перевода компонентов | Нет Vue/Razor/DOM в pure core; consumer output и entrypoints прежние | Scaffolding/build rules только в объёме первого consumer; не десятки пустых packages |
| M03 / Phase 2 | Перенести необходимые neutral token defaults/type definitions с точным graph; прежние APIs re-export | Token graph/resolved values/overrides и theme outputs совпадают; Node import safe | Theme move отдельно; revert возвращает ownership без смены API |
| M04 / Phase 2 | Перенести неизменённый Input CSS dependency closure; прежние core CSS entries собираются из shared source | Full + standalone CSS, all Input states и whole showcase unchanged | CSS/build patch отдельно от Vue logic |
| M05 / Phase 3 | Извлечь только чистые Input calculations/contracts; сохранить существующий SFC structure/lifecycle | API/types/events/attrs/selection/field integration + reference visual gates | Один небольшой компонентный extraction; undo возвращает helpers внутрь SFC |
| M06 / Phase 4 | Минимальный Razor provider/Input template, neutral icon-name/glyph data prerequisite, internal actions и packaged field-state bridge, browser controller/assets | PHP escaping/SSR/form tests; JS rules vectors; реальный clear/reveal/focus и no-JS input | PHP rendering и browser delivery могут быть отдельными focused commits |
| M07 / Phase 5 | Добавить Razor в общие Input cases; три направления comparisons | Все required Input cases по themes/sizes/states; DOM/a11y/interaction/visual | Adapter harness/tests отдельно; нет изменения reference expectations |
| M08 / Phase 6 | Добавить Input Razor showcase и matching links/data index, сохранив Vue showcase | Ручной обзор реальных страниц, full-route baseline, отсутствие synthetic mock renderer | Только examples и их case registry; library remains independently usable |
| M09 / Phase 7 | Review полученного vertical slice и packed npm/Composer proof | Input DoD полностью закрыт; dependency graph, CSS delivery и one-owner policy подтверждены | Отчёт/корректировка плана. Не начинать bulk migration при незакрытом gate |
| M10 / Phase 8a | Следом Field/IconButton/Button и простые text/display controls, по одному | Каждый повторяет M03–M08 применительно к своему scope | Component-level commits; supporting API migrations не склеивать в cohort rewrite |
| M11 / Phase 8b | Tabs как второй behavior proof, затем Accordion/Switch/Checkbox/Radio | Controlled state, panel lifecycle, keyboard и PHP initial state подтверждены | Один behavioral component на milestone |
| M12 / Phase 8c | Navigation/overlays, потом Select/DatePicker, затем DataTable | Focus/portal/scroll/async/locale и сложные table scenarios равны reference | Разбивать по компонентам; не переписывать сложные controls ради native approximation |
| M13 / Phase 8d | Layout primitives, regions, shells, theme integration и оставшиеся публичные компоненты | Сохранены scoped slots/exposed APIs, responsive routes, observer/scroll behavior | По одному layout/component; существующий Vue layout не переводить в recipe |
| M14 / completion | Остальной каталог, документация, реальные consumers, release rehearsal | Whole-migration DoD; все baseline Vue APIs остаются; Razor coverage честно заявлена | Packaging/docs отдельно; release/version/publish требуют собственного этапа |

Не переносить все tokens/component CSS «на всякий случай» до пилота. Если Input closure затрагивает общую foundation, переместить необходимую общую часть целиком и сохранить неперенесённые entries через существующие imports; не раздваивать token source. Migration sequence допускает уточнение после M09 по конкретному finding, но не ослабление historical gate.

## 20. Первый компонент: VfInput и ограничение его scope

Button слишком прост для доказательства state/lifecycle boundaries; Tabs полезен, но первым проверит меньшую часть forms/attrs/CSS dependency graph. Select, DatePicker и DataTable слишком сложны для начального proof. Input выявит именно ошибки первой попытки при небольшом размере source.

В scope входят прежние props/defaults (`modelValue`, `size`, `invalid`, `leadingIcon`, `trailingIcon`, `clearable`, `passwordReveal`), `leading`/`trailing` slots, inherited native attrs/events, plain/adorned DOM, readonly/disabled/invalid, all sizes, clear/reveal, focus/caret и existing field integration. Neutral icon-name/glyph resolution — явная prerequisite M06: поддержка всех имён в default Input icon mode и unknown-name fallback не заменяется тремя жёстко прописанными иконками. Eye/eyeSlash/xmark — обязательные internal glyphs; полный публичный Icons adapter в этот срез не входит.

Существующие `VfField`, `VfIconButton` и VueIconify остаются без refactoring. VfIconButton напрямую рендерит button и icon, не требует публичной миграции VfButton. Переносятся exact CSS imports/tokens, а Razor Input использует внутренний action markup с тем же результатом. Native Razor label/help/error fixture воспроизводит required field surroundings, не выдавая себя за законченный публичный Field adapter.

Проверить empty→filled→clear, external model changes, native `name`/`autocomplete`/`placeholder`/`min`/`max`/`step` attrs, number/date type pass-through, custom class/style placement, invalid/required/readonly/disabled, multiple instances, slotted icons, all adornment combinations, password selection и direction. Для floating variants обязательно сравнить существующий Vue `VfField` с эквивалентным Razor fixture DOM/state. Full Field API и IconButton API будут самостоятельными следующими milestones; вспомогательные fixtures не закрывают их DoD.

Razor label/help/error fixture — статическая native composition. Dynamic filled/floating state, включая `.vf-field__control--filled` и `data-vf-filled`, принадлежит небольшому packaged Input/Field bridge с явно переданным composition root. Showcase не содержит своего JS-алгоритма для этой логики. При последующем добавлении публичного Field bridge используется им или передаёт ему владение в одном focused change; второй controller тех же узлов не появляется.

Input pilot может потребовать небольшие private effect helpers внутри Razor controller. Это не основание создать общий DOM runtime или state machine для всех будущих компонентов. При неожиданном runtime divergence возвращаться к source reference и characterization, не переписывать Vue по PHP удобству.

## 21. Risks и anti-patterns

| Риск | Ранний индикатор | Действие |
| --- | --- | --- |
| Contract снова становится redesign | Новые required props/renames до extraction | Block milestone, добавить historical consumer case |
| Больше package scaffolding, чем переносимого поведения | Пустые modules/registry/state abstractions | Удалить ненужную схему из proposal; публиковать только использованные entries |
| Перемещение CSS меняет cascade | Новые imports/order, duplicated foundation, floating mismatch | Сравнить flattened closure + real frames; не добавлять showcase offsets |
| Tokens выглядят одинаково, но теряют overrides | Aliases заменены literals | Проверить graph и custom preset propagation |
| PHP/TS SSR diverge | Разные selected/open/default values | Shared vectors с null/empty/disabled/duplicate edges, без runtime bridge |
| Framework lifecycle теряется | Watch/inject/slots moved into neutral core | Вернуть lifecycle Vue; делить только plain calculations |
| Два владельца DOM | Controller markers на Vue, события приходят дважды | Explicit Razor bootstrap и mixed-page ownership test |
| Icons/fonts не совпадают | Похожие glyphs или разная loaded face | Exact source data/fonts/environment; отдельно review продуктовых font changes |
| Условные SSR improvements меняют Vue defaults | Новая cookie/theme policy/ID requirement | Сохранить Vue API; явно описать PHP lifecycle отдельно |
| Showcase зелёный после удаления сложных cases | Уменьшился denominator, missing cases accepted | Frozen inventory, missing/unexpected fail |
| Старые артефакты смешаны с чистой веткой | Untracked vendor/generated assets выглядят как implementation | Читать историческую попытку через Git, проверять чистую isolated consumer fixture |
| Изолированный component pass скрывает product regression | Нет full routes/layouts/callback examples | Сохранять original showcase и реальные consumer compilation/integration |

## 22. Что явно не следует абстрагировать

- Vue refs/computed/watchers, provide/inject, plugin installation и composable signatures.
- Slots/scoped slots, VNodes, framework event wiring, Vue Router `to` semantics, native component composition.
- PHP compiler/registry/render context/escaping mechanics — они уже принадлежат Razor engine.
- DOM rendering, lifecycle, hydration, Teleport/Transition, focus scheduling и ownership.
- Универсальную state machine, plugin container, event bus, renderer DSL, template generator или schema interpreter.
- Application data fetching, business validation, routing policy и callbacks table labels/formatters.
- Общую «таблицу возможностей React/Angular» и заранее созданные adapters без потребителей.
- Playground workers/execution sessions и CodeBlock runtimes как базу всех UI controls.
- Новую utility CSS систему, тему с новым persistence или переименование public API ради нейтрального бренда.
- Все похожие helper functions автоматически: перенос оправдан совпадающими реальными правилами двух adapters.

## 23. Definition of Done отдельного migrated component

- Historical source/export/test/showcase contract записан, включая props/events/slots/defaults/types/imports/attrs и meaningful DOM.
- Существующий Vue SFC уменьшен extraction, либо невозможность extraction доказана конкретным ограничением и вынесена на отдельное решение; rewrite не принят молча.
- Неизменённые historical consumer examples компилируются и работают; нет slot/event/attribute/API drift.
- Shared CSS/token graph имеет единственный source; full и standalone artifacts, themes/overrides/forced-colors/reduced-motion проверены.
- Pure rules действительно DOM/framework-free; PHP equivalents, если нужны, проходят общие vectors.
- Razor native template/slots/escaping и documented SSR/no-JS behavior проверены; browser assets реально доставлены и interactions работают.
- В each subtree один DOM owner; controlled Vue state, SSR hydration, repeated IDs и cleanup не нарушены.
- API, DOM/class, interaction, accessibility и три visual comparisons проходят все required cases; missing/unexpected равны нулю.
- Компонент доступен в полном Vue showcase и matching Razor cases; variants/sizes/states и данные не сокращены для PASS.
- Packed npm/Composer consumers получают нужные code/CSS/assets по documented imports; не требуется соседний source checkout.
- Reviewed evidence содержит точные commits/cases/environment и необработанные comparison artifacts; оставшиеся ограничения описаны как ограничения, не PASS.
- Изменение помещается в focused commits и откатывается без разрушения остальных компонентов.

## 24. Definition of Done всей migration

Все публичные baseline Vue компоненты, plugins, composables, types, import/CSS paths, themes, behavior и showcase сохранены и проходят historical gates. Ни один компонент не исчезает из продукта из-за того, что для Razor его неудобно реализовать. Полный Vue каталог измеряется от reference exports, а не от mapping первой попытки.

Для каждого компонента явно указан Razor статус. Все заявленные Vue/Razor components проходят component DoD; baseline-derived ordinary UI controls/layouts должны получить эквивалентные Razor implementations. Specialized Vue-only execution features вроде Playground требуют отдельного решения о native PHP delivery до заявления полной мультиплатформенной поддержки всего каталога. Если они остаются Vue-only, можно объявить завершённым согласованный UI scope, но нельзя объявить весь baseline каталог мультиплатформенным. Сам Vue API/feature/showcase при этом всё равно сохраняется.

Shared dependency graph ацикличен; нейтральные packages не импортируют adapters; Vue и Razor имеют независимые rendering/lifecycle и пользуются общими styles/tokens и практически оправданными rules. No universal renderer, no speculative React/Angular architecture. Package consumer tests проходят без workspace leakage; Composer поставляет согласованные CSS/browser assets.

Historical full-showcase routes, component states и cross-platform cases остаются required gates с сохранённым denominator и immutable reference. Complete означает проверенный observable result и работающие examples/consumers, а не «у каждого компонента есть disposition» или «оба adapters совпали между собой».

Release/version/publication и возможное изменение branding — отдельные задачи. Удаление historical oracle не является шагом завершения migration. После создания этого документа работа останавливается до явного подтверждения плана.

## Приложение A. Покомпонентный каталог reference

Аудит основан на исходниках commit `fd793696f50d3be0fcd3788f0f8f751c63869963`, public entrypoints, package manifests и существующих тестах. Это статическая инвентаризация для плана; динамический PASS, pixel parity и полное покрытие всех комбинаций не заявляются. Все перечисленные свойства, события, slots, CSS-классы, условия присутствия узлов и native-attribute forwarding сохраняются до отдельного одобренного изменения API.

Подсчёт: **46** имён в `core/src/components/index.ts` + **VfThemeProvider** отдельно = **47** core exports; **17** layouts; **VfCodeBlock**; **VfPlayground** + **VfPlaygroundAsync**; **VueIconify** (коллективная группа icon assets). Итого **68 публичных имён компонентов/обёрток**, а не 68 независимых поведений. Theme package не экспортирует Vue-компоненты. Внутренние `VfHorizontalScroller`, `VfMenuBarItemNode`, `VfNavMenuItemNode` не публичные компоненты, но входят в dependency closure соответствующих контрактов.

В сигнатурах `?` означает optional prop. Defaults ниже взяты из `withDefaults` исходного SFC, включая явный `undefined` для controlled/uncontrolled и tri-state props. Отсутствующие optional boolean props без override подчиняются Vue Boolean casting; это не повод считать `open`, `collapsed` или `stickyHeader` равными false. Callback factories в defaults создают новое значение для instance. Локальный `*Props` type в SFC не считается package export: опубликованные типы перечислены отдельно. Запись scope сохраняет bindings шаблона; потребитель Vue использует соответствующие camelCase slot props.

### A.1. Core: 46 компонентов

Import: `@codemonster-ru/vueforge-core` и существующий `/<kebab-family>`; `VfMenuItem` входит в `/menu`, `VfFieldset` имеет `/fieldset`. CSS `/<family>.css` и агрегаты `/base.css`, `/tokens.css`, `/theme.css`, `/foundation.css`, `/styles.css`. Public per-component ESM import имеет раздельные browser auto-CSS и node условия; package root также CJS. Классы и custom properties остаются `vf-` / `--vf-`.


#### VfAccordion

Props: `open?: boolean; defaultOpen?: boolean; title?: string; disabled?: boolean;`

Defaults: `open: undefined, defaultOpen: false, title: undefined, disabled: false`

Объявленные события: `'update:open': [value: boolean]; openChange: [value: boolean];`

Slots: `trigger(open=isOpen)`; `default(open=isOpen)`

`vf-accordion` → button trigger + region; controlled/uncontrolled open; Enter/Space; aria-expanded/controls/labelledby; measured height transition; disabled blocks toggle.

Источник: [SFC](../packages/core/src/components/accordion/VfAccordion.vue#L7)


#### VfAlert

Props: `tone?: VfFeedbackTone; title?: string; icon?: IconName | string; hideIcon?: boolean;`

Defaults: `tone: 'primary', title: undefined, icon: undefined, hideIcon: false`

Объявленные события: —

Slots: `icon`; `title`; `default`

`vf-alert`, tone modifiers; role=alert; title/icon/content regions; tone selects fallback icon; decorative icon hidden.

Источник: [SFC](../packages/core/src/components/alert/VfAlert.vue#L12)


#### VfAvatar

Props: `image?: string; imageAlt?: string; label?: string; icon?: IconName | string; size?: VfControlSize; shape?: VfAvatarShape;`

Defaults: `image: undefined, imageAlt: '', label: undefined, icon: undefined, size: 'md', shape: 'square'`

Объявленные события: —

Slots: `default`

`vf-avatar`, size/circle modifiers; span; priority image → label → icon → default; imageAlt passes to img; decorative icon hidden.

Источник: [SFC](../packages/core/src/components/avatar/VfAvatar.vue#L11)


#### VfBadge

Props: `tone?: VfBadgeTone;`

Defaults: `tone: 'neutral'`

Объявленные события: —

Slots: `default`

`vf-badge`, tone modifiers; span with default slot; attrs/class forwarding.

Источник: [SFC](../packages/core/src/components/badge/VfBadge.vue#L10)


#### VfBreadcrumbs

Props: `items: VfBreadcrumbItem[]; ariaLabel?: string; component?: string | Component;`

Defaults: `ariaLabel: 'Breadcrumb', component: undefined`

Объявленные события: —

Slots: `separator(item=item, index=index)`

`vf-breadcrumbs` → nav/ol/li; current/disabled items differ from links; aria-current=page; RouterLink/custom component and external rel handling; separator slot item/index.

Источник: [SFC](../packages/core/src/components/breadcrumbs/VfBreadcrumbs.vue#L12)


#### VfButton

Props: `variant?: VfButtonVariant; size?: VfControlSize; block?: boolean; loading?: boolean; type?: 'button' | 'submit' | 'reset';`

Defaults: `variant: 'primary', size: 'md', block: false, loading: false, type: 'button'`

Объявленные события: —

Slots: `default`

`vf-button` + variant, non-md size, block/loading modifiers; native button; loading disables and adds spinner/aria-busy; native attrs/listeners forward.

Источник: [SFC](../packages/core/src/components/button/VfButton.vue#L11)


#### VfCard

Props: `title?: string; compact?: boolean;`

Defaults: `title: undefined, compact: false`

Объявленные события: —

Slots: `header`; `default`; `footer`

`vf-card` → section/header/body/footer; compact modifier; optional header/title/footer presence changes DOM.

Источник: [SFC](../packages/core/src/components/card/VfCard.vue#L9)


#### VfCheckbox

Props: `modelValue?: boolean; size?: VfControlSize; invalid?: boolean; disabled?: boolean; indeterminate?: boolean; label?: string;`

Defaults: `modelValue: false, size: 'md', invalid: false, disabled: false, indeterminate: false, label: undefined`

Объявленные события: `'update:modelValue': [value: boolean]; change: [value: boolean];`

Slots: `default`

`vf-checkbox` label → native checkbox + decorative control + content; checked/indeterminate/invalid/disabled; class/style на label, остальные attrs на native input; name/value/id/aria и mixed state.

Источник: [SFC](../packages/core/src/components/checkbox/VfCheckbox.vue#L10)


#### VfCommandPalette

Props: `open?: boolean; defaultOpen?: boolean; title?: string; placeholder?: string; modelValue?: string; defaultValue?: string; items?: unknown[]; loading?: boolean; idleText?: string; emptyText?: string; highlightMatches?: boolean; dividers?: boolean; closeOnSelect?: boolean; closeOnOverlayClick?: boolean; closeOnEscape?: boolean; maxHeight?: string | number; teleportTo?: string | HTMLElement | null | false; disableTeleport?: boolean; showDefaultFooterHints?: boolean;`

Defaults: `open: undefined, defaultOpen: false, title: 'Search', placeholder: 'Search...', modelValue: undefined, defaultValue: '', items: () => [], loading: false, idleText: 'Start typing to search', emptyText: 'Nothing found', highlightMatches: true, dividers: true, closeOnSelect: true, closeOnOverlayClick: true, closeOnEscape: true, maxHeight: undefined, teleportTo: undefined, disableTeleport: false, showDefaultFooterHints: true`

Объявленные события: `'update:open': [value: boolean]; openChange: [value: boolean]; 'update:modelValue': [value: string]; queryChange: [value: string]; select: [item: unknown]; submit: [query: string]; close: []; open: [];`

Slots: `actions(close=close, query=query)`; `default(items=props.items, query=query, loading=loading, active-index=activeIndex, select=handleSelect, close=close)`; `item(item=item, index=index, active=index === activeIndex, query=query, select=() => handleSelect(item))`; `empty(query=query)`; `footer(close=close, query=query, items=props.items)`

`vf-command-palette`; teleported modal dialog, combobox/listbox/options/status; query + open state; arrow navigation, Enter select/submit, Escape; active descendant, focus trap, scroll lock; loading/empty/idle/highlight regions.

Источник: [SFC](../packages/core/src/components/command-palette/VfCommandPalette.vue#L15)


#### VfConfirmDialog

Props: `open?: boolean; title?: string; description?: string; confirmLabel?: string; cancelLabel?: string; confirmVariant?: VfButtonVariant; size?: VfDialogSize; dividers?: boolean; teleportTo?: string | HTMLElement | null | false; disableTeleport?: boolean; initialFocus?: VfConfirmDialogInitialFocus; loading?: boolean; disabled?: boolean; closeOnConfirm?: boolean;`

Defaults: `open: false, title: 'Confirm action', description: undefined, confirmLabel: 'Confirm', cancelLabel: 'Cancel', confirmVariant: 'danger', size: 'sm', dividers: true, teleportTo: undefined, disableTeleport: false, initialFocus: 'cancel', loading: false, disabled: false, closeOnConfirm: true`

Объявленные события: `'update:open': [value: boolean]; confirm: []; cancel: [];`

Slots: `default`; `footer(cancel=cancel, confirm=confirm, loading=props.loading)`

Composition over VfDialog + buttons; initialFocus cancel/confirm/dialog; loading blocks duplicate actions; confirm/cancel ordering and closeOnConfirm; description id and footer action scope.

Источник: [SFC](../packages/core/src/components/confirm-dialog/VfConfirmDialog.vue#L7)


#### VfDataTable

Props: `columns: VfDataTableColumn[]; rows?: VfDataTableRow[]; rowKey?: string | ((row: VfDataTableRow, index: number) => VfDataTableRowKey); selectable?: boolean; rowSelectable?: (row: VfDataTableRow, rowIndex: number) => boolean; selectedRowKeys?: VfDataTableRowKey[]; defaultSelectedRowKeys?: VfDataTableRowKey[]; expandedRowKeys?: VfDataTableRowKey[]; defaultExpandedRowKeys?: VfDataTableRowKey[]; caption?: string; density?: VfDataTableDensity; striped?: boolean; columnDividers?: boolean; stickyHeader?: boolean; visibleColumnKeys?: string[]; columnOrder?: VfDataTableColumnOrder; defaultColumnOrder?: VfDataTableColumnOrder; reorderableColumns?: boolean; columnWidths?: VfDataTableColumnWidths; defaultColumnWidths?: VfDataTableColumnWidths; resizableColumns?: boolean; loading?: boolean; loadingVariant?: VfDataTableLoadingVariant; loadingRows?: number; pagination?: boolean; paginationMode?: VfDataTablePaginationMode; page?: number; defaultPage?: number; pageSize?: number; defaultPageSize?: number; pageSizeOptions?: number[]; totalRows?: number; sort?: VfDataTableSort[]; defaultSort?: VfDataTableSort[]; sortingMode?: VfDataTableSortingMode; multiSort?: boolean; labels?: Partial<VfDataTableLabels>; error?: boolean; emptyText?: string; loadingText?: string;`

Defaults: `rows: () => [], rowKey: undefined, selectable: false, rowSelectable: undefined, selectedRowKeys: undefined, defaultSelectedRowKeys: () => [], expandedRowKeys: undefined, defaultExpandedRowKeys: () => [], caption: undefined, density: 'default', striped: false, columnDividers: false, stickyHeader: false, visibleColumnKeys: undefined, columnOrder: undefined, defaultColumnOrder: () => [], reorderableColumns: false, columnWidths: undefined, defaultColumnWidths: () => ({}), resizableColumns: false, loading: false, loadingVariant: 'mask', loadingRows: 3, pagination: false, paginationMode: 'client', page: undefined, defaultPage: 1, pageSize: undefined, defaultPageSize: 10, pageSizeOptions: () => [10, 25, 50], totalRows: undefined, sort: undefined, defaultSort: () => [], sortingMode: 'client', multiSort: false, labels: () => ({}), error: false, emptyText: undefined, loadingText: undefined`

Объявленные события: `'update:selectedRowKeys': [selectedRowKeys: VfDataTableRowKey[]]; 'update:expandedRowKeys': [expandedRowKeys: VfDataTableRowKey[]]; 'update:page': [page: number]; 'update:pageSize': [pageSize: number]; 'update:columnOrder': [columnOrder: VfDataTableColumnOrder]; 'update:columnWidths': [columnWidths: VfDataTableColumnWidths]; 'update:sort': [sort: VfDataTableSort[]]; 'column-reorder-end': [columnOrder: VfDataTableColumnOrder]; 'column-resize-end': [columnWidths: VfDataTableColumnWidths];`

Slots: `caption`; `header-${column.key}(column=column)`; `error`; `cell-${column.key}(row=row, column=column, value=cellValue(row, column.key), row-index=rowIndex)`; `expanded-row(row=row, row-key=expandedRowId(row, rowIndex), row-index=rowIndex)`; `empty`; `footer`; `loading`

`vf-data-table` + existing `vf-table` shell; native table/caption/head/body/foot, loading/error/empty; selection, expansion, client/manual sort/page; pinning, widths, keyboard/pointer resize and reorder; aria-sort, separators, live announcements and focus.

Источник: [SFC](../packages/core/src/components/data-table/VfDataTable.vue#L29)


#### VfDataTableColumnChooser

Props: `columns: VfDataTableColumn[]; modelValue?: string[]; requiredColumnKeys?: string[]; disabled?: boolean; triggerLabel?: string; allLabel?: string;`

Defaults: `modelValue: undefined, requiredColumnKeys: () => [], disabled: false, triggerLabel: 'Configure columns', allLabel: 'All columns'`

Объявленные события: `'update:modelValue': [value: string[]];`

Slots: `trigger(visible-column-keys=visibleKeys, disabled=props.disabled)`

`vf-data-table-column-chooser`; VfDropdown + VfCheckbox; unknown/required keys normalized; required columns stay selected; all checkbox mixed state; scoped trigger.

Источник: [SFC](../packages/core/src/components/data-table-column-chooser/VfDataTableColumnChooser.vue#L9)


#### VfDatePicker

Props: `modelValue?: string | string[]; min?: string; max?: string; multiple?: boolean; range?: boolean; monthPicker?: boolean; yearPicker?: boolean; showTime?: boolean; minuteStep?: number; locale?: string | string[]; displayFormat?: string; firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6; size?: VfControlSize; invalid?: boolean; disabled?: boolean; readonly?: boolean; clearable?: boolean; placeholder?: string; placement?: VfDropdownPlacement; teleportTo?: string | HTMLElement | null | false; disableTeleport?: boolean; labels?: Partial<VfDatePickerLabels>;`

Defaults: `modelValue: '', min: undefined, max: undefined, multiple: false, range: false, monthPicker: false, yearPicker: false, showTime: false, minuteStep: 1, locale: undefined, displayFormat: undefined, firstDayOfWeek: 1, size: 'md', invalid: false, disabled: false, readonly: false, clearable: false, placeholder: undefined, placement: 'bottom-start', teleportTo: undefined, disableTeleport: false, labels: () => ({})`

Объявленные события: `'update:modelValue': [value: string | string[]];`

Slots: —

`vf-date-picker`; button trigger + conditional hidden form inputs + teleported dialog/grid; single/multiple/range/date/month/year/time modes, locale formatting/min/max; roving calendar focus, keyboard period navigation, clear/Escape/outside close; hidden inputs создаются при string name, по одному на formValues; видимого текстового input нет.

Источник: [SFC](../packages/core/src/components/date-picker/VfDatePicker.vue#L19)


#### VfDialog

Props: `open?: boolean; defaultOpen?: boolean; title?: string; description?: string; size?: VfDialogSize; dividers?: boolean; teleportTo?: string | HTMLElement | null | false; disableTeleport?: boolean; closeOnOverlayClick?: boolean; closeOnEscape?: boolean; closable?: boolean; ariaLabel?: string; ariaLabelledby?: string; ariaDescribedby?: string;`

Defaults: `open: undefined, defaultOpen: false, title: undefined, description: undefined, size: 'md', dividers: false, teleportTo: undefined, disableTeleport: false, closeOnOverlayClick: true, closeOnEscape: true, closable: true, ariaLabel: undefined, ariaLabelledby: undefined, ariaDescribedby: undefined`

Объявленные события: `'update:open': [value: boolean]; openChange: [value: boolean];`

Slots: `header(title-id=titleId)`; `description(description-id=descriptionId)`; `actions(close=close)`; `default(close=close)`; `footer(close=close)`

`vf-dialog` overlay/content/header/body/footer; role=dialog/aria-modal/title/description ids; Teleport/Transition; controlled/uncontrolled open; focus trap + restore, Escape, overlay click, scroll lock; nested focus scope.

Источник: [SFC](../packages/core/src/components/dialog/VfDialog.vue#L11)


#### VfDivider

Props: `orientation?: VfDividerOrientation;`

Defaults: `orientation: 'horizontal'`

Объявленные события: —

Slots: —

`vf-divider`; div в обоих orientations; aria-orientation в обоих случаях, role=separator только для vertical; orientation modifier.

Источник: [SFC](../packages/core/src/components/divider/VfDivider.vue#L10)


#### VfDrawer

Props: `open?: boolean; defaultOpen?: boolean; title?: string; size?: VfDrawerSize; placement?: VfDrawerPlacement; dividers?: boolean; rounded?: boolean; offsetTop?: string | number; bodyPadding?: string | number; teleportTo?: string | HTMLElement | null | false; disableTeleport?: boolean; scrollLockTarget?: HTMLElement | null | false; closeOnOverlayClick?: boolean; closeOnEscape?: boolean; closable?: boolean; ariaLabel?: string; ariaLabelledby?: string; ariaDescribedby?: string;`

Defaults: `open: undefined, defaultOpen: false, title: undefined, size: 'md', placement: 'right', dividers: false, rounded: false, offsetTop: undefined, bodyPadding: undefined, teleportTo: undefined, disableTeleport: false, scrollLockTarget: undefined, closeOnOverlayClick: true, closeOnEscape: true, closable: true, ariaLabel: undefined, ariaLabelledby: undefined, ariaDescribedby: undefined`

Объявленные события: `'update:open': [value: boolean]; openChange: [value: boolean];`

Slots: `header(title-id=titleId)`; `actions(close=close)`; `default(close=close)`; `footer(close=close)`

`vf-drawer` overlay + content; placement/size/dividers/rounded/offset geometry; modal semantics; focus trap/restore/Escape/overlay; custom scrollLockTarget; Teleport/Transition.

Источник: [SFC](../packages/core/src/components/drawer/VfDrawer.vue#L26)


#### VfDropdown

Props: `open?: boolean; defaultOpen?: boolean; placement?: VfDropdownPlacement; teleportTo?: string | HTMLElement | null | false; disableTeleport?: boolean; closeOnSelect?: boolean; variant?: 'default' | 'pills'; disabled?: boolean;`

Defaults: `open: undefined, defaultOpen: false, placement: 'bottom-start', teleportTo: undefined, disableTeleport: false, closeOnSelect: true, variant: 'default', disabled: false`

Объявленные события: `'update:open': [value: boolean]; openChange: [value: boolean];`

Slots: `trigger(open=isOpen, toggle=toggleMenu, disabled=props.disabled)`; `default(close=closeMenu, open=isOpen)`

`vf-dropdown` trigger wrapper + teleported role=menu; trigger tabindex/expanded/haspopup/controls; Arrow/Enter/Space/Home/End/Escape; getItems() не фильтрует disabled items; это baseline limitation, closeOnSelect, focus return; floating flip/shift/arrow and focus-scope branch.

Источник: [SFC](../packages/core/src/components/dropdown/VfDropdown.vue#L9)


#### VfField

Props: `label?: string; description?: string; error?: string; invalid?: boolean; required?: boolean; labelPlacement?: VfFieldLabelPlacement; floatingVariant?: VfFieldFloatingVariant;`

Defaults: `label: undefined, description: undefined, error: undefined, invalid: false, required: false, labelPlacement: 'top', floatingVariant: 'in'`

Объявленные события: —

Slots: `label`; `default(control-id=controlId, described-by=describedBy, invalid=isInvalid, required=props.required)`; `description`; `error`

`vf-field` label/control/description/error; scoped default provides controlId/describedBy/invalid/required (caller binds them); error implies invalid; Vue injection tracks floating support/filled state; top/in/on/over label placement changes exact sibling structure.

Источник: [SFC](../packages/core/src/components/field/VfField.vue#L7)


#### VfFieldset

Props: `label?: string; description?: string; error?: string; invalid?: boolean;`

Defaults: `label: undefined, description: undefined, error: undefined, invalid: false`

Объявленные события: —

Slots: `label`; `default(described-by=describedBy, invalid=isInvalid)`; `description`; `error`

`vf-fieldset` fieldset/legend/control/description/error; default scope describedBy/invalid; semantic group + disabled-compatible native attrs.

Источник: [SFC](../packages/core/src/components/field/VfFieldset.vue#L6)


#### VfFormLayout

Props: `mode?: VfFormLayoutMode; labelWidth?: string;`

Defaults: `mode: 'stacked', labelWidth: 'minmax(10rem, 25%)'`

Объявленные события: —

Slots: `default`

`vf-form-layout`, stacked/horizontal/responsive modifiers; div + default; labelWidth CSS variable.

Источник: [SFC](../packages/core/src/components/form-layout/VfFormLayout.vue#L8)


#### VfGroupBox

Props: `title?: string; collapsible?: boolean; collapsed?: boolean; defaultCollapsed?: boolean; disabled?: boolean;`

Defaults: `title: undefined, collapsible: false, collapsed: undefined, defaultCollapsed: false, disabled: false`

Объявленные события: `'update:collapsed': [value: boolean]; collapsedChange: [value: boolean];`

Slots: `toggle-icon(collapsed=isCollapsed)`; `title(collapsed=isCollapsed)`; `title(collapsed=false)`; `default(collapsed=isCollapsed)`

`vf-group-box` fieldset/legend/content; optional collapse button и region; collapsed content удаляется через v-if; controlled/uncontrolled collapsed; disabled; title/toggle-icon/default receive collapsed.

Источник: [SFC](../packages/core/src/components/group-box/VfGroupBox.vue#L12)


#### VfIconButton

Props: `icon: IconName | string; variant?: VfButtonVariant; size?: VfControlSize; type?: 'button' | 'submit' | 'reset';`

Defaults: `variant: 'ghost', size: 'md', type: 'button'`

Объявленные события: —

Slots: —

`vf-icon-button` native button + VueIconify; ghost default; native attrs/listeners; caller supplies accessible name; internal icon aria-hidden. It does not depend on VfButton.

Источник: [SFC](../packages/core/src/components/icon-button/VfIconButton.vue#L11)


#### VfInput

Props: `modelValue?: string; size?: VfControlSize; invalid?: boolean; leadingIcon?: IconName | string; trailingIcon?: IconName | string; clearable?: boolean; passwordReveal?: boolean;`

Defaults: `modelValue: '', size: 'md', invalid: false, leadingIcon: undefined, trailingIcon: undefined, clearable: false, passwordReveal: false`

Объявленные события: `'update:modelValue': [value: string];`

Slots: `leading`; `trailing`

`vf-input` bare input or conditional `vf-input-wrap`; string local/model value, native attr forwarding; adorned class/style belong to wrapper; leading/trailing slots override icon props; clear only nonempty + enabled + writable; password reveal preserves selection/direction/focus across nextTick + RAF; Field injection + data-vf-filled.

Источник: [SFC](../packages/core/src/components/input/VfInput.vue#L13)


#### VfLink

Props: `href?: string; to?: string | Record<string, unknown>; target?: string; rel?: string; underline?: VfLinkUnderline; tone?: VfLinkTone; component?: string | Component;`

Defaults: `href: undefined, to: undefined, target: undefined, rel: undefined, underline: 'none', tone: 'default', component: undefined`

Объявленные события: —

Slots: `default`

`vf-link` anchor or RouterLink/custom component; to chooses router path; target=_blank defaults rel=noopener noreferrer; underline/tone modifiers; attrs/listeners forwarded.

Источник: [SFC](../packages/core/src/components/link/VfLink.vue#L11)


#### VfMenu

Props: —

Объявленные события: —

Slots: `default`

`vf-menu` div role=menu; default slot; no declared props/emits; keyboard ownership belongs to containing Dropdown/MenuBar.

Источник: [SFC](../packages/core/src/components/menu/VfMenu.vue#L1)


#### VfMenuItem

Props: `label: string; icon?: IconName | string; disabled?: boolean; active?: boolean; tone?: 'default' | 'danger'; href?: string; target?: string; rel?: string;`

Defaults: `icon: undefined, disabled: false, active: false, tone: 'default', href: undefined, target: undefined, rel: undefined`

Объявленные события: `select: [];`

Slots: —

`vf-menu__item` button or anchor role=menuitem; icon/label, active/danger/disabled; disabled prevents select/navigation; target/rel behavior; native click and declared select distinct.

Источник: [SFC](../packages/core/src/components/menu/VfMenuItem.vue#L9)


#### VfMenuBar

Props: `items: VfNavMenuItem[]; modelValue?: string; defaultValue?: string; ariaLabel?: string; variant?: 'default' | 'pills';`

Defaults: `modelValue: undefined, defaultValue: undefined, ariaLabel: 'Menu bar', variant: 'default'`

Объявленные события: `'update:modelValue': [value: string]; change: [value: string]; select: [item: VfNavMenuItem];`

Slots: —

`vf-menu-bar` + menubar/list/node menus + horizontal scroller; controlled/uncontrolled selection and nested open path; arrows/Home/End/Escape/typeahead/hover timers/outside close; RTL and disabled branches; item route links/icons.

Источник: [SFC](../packages/core/src/components/menu-bar/VfMenuBar.vue#L9)


#### VfNavMenu

Props: `items: VfNavMenuItem[]; modelValue?: string; defaultValue?: string; ariaLabel?: string; expandMode?: 'multiple' | 'single'; variant?: 'default' | 'pills' | 'sidebar'; compact?: boolean;`

Defaults: `modelValue: undefined, defaultValue: undefined, ariaLabel: 'Navigation', expandMode: 'multiple', variant: 'default', compact: undefined`

Объявленные события: `'update:modelValue': [value: string]; change: [value: string]; select: [item: VfNavMenuItem];`

Slots: —

`vf-nav-menu` nav/lists/recursive nodes; item/group + links; single/multiple expanded branches; active ancestors; default/pills/sidebar and compact breakpoint probe; model/change/select; tree content is data-driven, no custom slots.

Источник: [SFC](../packages/core/src/components/nav-menu/VfNavMenu.vue#L6)


#### VfPageHeader

Props: `title?: string; description?: string; breadcrumbs?: VfBreadcrumbItem[]; headingLevel?: VfPageHeaderHeadingLevel;`

Defaults: `title: undefined, description: undefined, breadcrumbs: () => [], headingLevel: 1`

Объявленные события: —

Slots: `breadcrumbs`; `title`; `description`; `actions`

`vf-page-header` header + breadcrumbs/title/description/actions; h1..h6 from headingLevel; slot override precedence and omission of empty regions.

Источник: [SFC](../packages/core/src/components/page-header/VfPageHeader.vue#L6)


#### VfPanel

Props: `title?: string; subtle?: boolean;`

Defaults: `title: undefined, subtle: false`

Объявленные события: —

Slots: `header`; `default`

`vf-panel` section + optional header + непосредственный default slot, без body wrapper; subtle modifier; title fallback in header.

Источник: [SFC](../packages/core/src/components/panel/VfPanel.vue#L9)


#### VfPopover

Props: `open?: boolean; defaultOpen?: boolean; placement?: VfDropdownPlacement; teleportTo?: string | HTMLElement | null | false; disableTeleport?: boolean; closeOnOutsideClick?: boolean; closeOnEscape?: boolean;`

Defaults: `open: undefined, defaultOpen: false, placement: 'bottom-start', teleportTo: undefined, disableTeleport: false, closeOnOutsideClick: true, closeOnEscape: true`

Объявленные события: `'update:open': [value: boolean]; openChange: [value: boolean];`

Slots: `trigger(open=isOpen, toggle=togglePopover)`; `default(open=isOpen, close=closePopover)`

`vf-popover` focusable trigger wrapper + teleported role=dialog; nonmodal; Enter/Space/Down open, autofocus/data-autofocus, Escape/outside close and trigger focus; focus-scope branch; float arrow/flip/shift.

Источник: [SFC](../packages/core/src/components/popover/VfPopover.vue#L9)


#### VfProgressBar

Props: `value?: number; max?: number; indeterminate?: boolean; label?: string; height?: string | number; showValue?: boolean; tone?: VfFeedbackTone; striped?: boolean; animated?: boolean;`

Defaults: `value: 0, max: 100, indeterminate: false, label: 'Progress', height: undefined, showValue: false, tone: 'primary', striped: false, animated: false`

Объявленные события: —

Slots: —

`vf-progress-bar` role=progressbar + value/label; clamps value against max; determinate aria-valuenow/min/max, indeterminate omission; custom height/tone/striped/animated and optional visible value.

Источник: [SFC](../packages/core/src/components/progress-bar/VfProgressBar.vue#L10)


#### VfProgressSpinner

Props: `label?: string; size?: string | number; strokeWidth?: number; tone?: VfFeedbackTone;`

Defaults: `label: 'Loading', size: undefined, strokeWidth: 4, tone: 'primary'`

Объявленные события: —

Slots: —

`vf-progress-spinner` role=progressbar + SVG track/value; accessible label, custom CSS size/strokeWidth, tone and motion.

Источник: [SFC](../packages/core/src/components/progress-spinner/VfProgressSpinner.vue#L10)


#### VfRadio

Props: `modelValue?: VfRadioValue; value: VfRadioValue; size?: VfControlSize; invalid?: boolean; disabled?: boolean; label?: string;`

Defaults: `modelValue: undefined, size: 'md', invalid: false, disabled: false, label: undefined`

Объявленные события: `'update:modelValue': [value: VfRadioValue]; change: [value: VfRadioValue];`

Slots: `default`

`vf-radio` label → native radio/control/dot/content; required value string/number/boolean; strict selection; name group native behavior; checked/disabled/invalid modifiers; class/style на label, остальные attrs на native input.

Источник: [SFC](../packages/core/src/components/radio/VfRadio.vue#L12)


#### VfSelect

Props: `modelValue?: string; options: VfSelectOption[]; size?: VfControlSize; invalid?: boolean; leadingIcon?: IconName | string; trailingIcon?: IconName | string; clearable?: boolean; placeholder?: string; disabled?: boolean; placement?: VfDropdownPlacement; teleportTo?: string | HTMLElement | null | false; disableTeleport?: boolean;`

Defaults: `modelValue: '', size: 'md', invalid: false, leadingIcon: undefined, trailingIcon: undefined, clearable: false, placeholder: undefined, disabled: false, placement: 'bottom-start', teleportTo: undefined, disableTeleport: false`

Объявленные события: `'update:modelValue': [value: string];`

Slots: `leading`; `trailing`

`vf-select-wrap` + optional hidden name input + button trigger/listbox/options (not native select); string value; icons/clear/floating labels; descriptive attrs to trigger, class/style wrapper; keyboard disabled skip/Escape/Home/End; Teleport/floating/focus return.

Источник: [SFC](../packages/core/src/components/select/VfSelect.vue#L17)


#### VfSkeleton

Props: `minHeight?: string | number; radius?: string; animated?: boolean;`

Defaults: `minHeight: undefined, radius: 'var(--vf-radius-surface)', animated: true`

Объявленные события: —

Slots: —

`vf-skeleton`; aria-hidden placeholder; CSS minHeight/radius + animated modifier.

Источник: [SFC](../packages/core/src/components/skeleton/VfSkeleton.vue#L10)


#### VfSkeletonGate

Props: `ready?: boolean; minHeight?: string | number; reserveHeight?: string | number; preserveLastHeight?: boolean; normalizeContentSpacing?: boolean; radius?: string; fadeDuration?: number;`

Defaults: `ready: false, minHeight: undefined, reserveHeight: undefined, preserveLastHeight: false, normalizeContentSpacing: false, radius: undefined, fadeDuration: 220`

Объявленные события: —

Slots: `default`; `skeleton`

`vf-skeleton-gate` content + skeleton overlay; aria-busy/content visibility; measured/reserved/last height and ResizeObserver; readiness fade and normalized content spacing; skeleton slot.

Источник: [SFC](../packages/core/src/components/skeleton-gate/VfSkeletonGate.vue#L32)


#### VfStepper

Props: `items: VfStepperItem[]; modelValue?: string; defaultValue?: string; orientation?: VfStepperOrientation; contentPosition?: VfStepperContentPosition; ariaLabel?: string;`

Defaults: `modelValue: undefined, defaultValue: undefined, orientation: 'horizontal', contentPosition: undefined, ariaLabel: 'Progress'`

Объявленные события: `'update:modelValue': [value: string]; change: [value: string];`

Slots: —

`vf-stepper` nav/list/buttons; controlled/uncontrolled current item; horizontal/vertical, content-position fallback, progress geometry; orientation-dependent arrows/Home/End, disabled skip; RTL reversal отсутствует and aria-current=step.

Источник: [SFC](../packages/core/src/components/stepper/VfStepper.vue#L10)


#### VfSwitch

Props: `modelValue?: boolean; size?: VfControlSize; static?: boolean; thumbContrast?: VfSwitchThumbContrast; invalid?: boolean; disabled?: boolean; label?: string;`

Defaults: `modelValue: false, size: 'md', static: false, thumbContrast: 'auto', invalid: false, disabled: false, label: undefined`

Объявленные события: `'update:modelValue': [value: boolean]; change: [value: boolean];`

Slots: `thumb(checked=props.modelValue)`; `default`

`vf-switch` label → native checkbox role=switch + track/thumb/content; model/change boolean; static track and inverse thumb contrast; thumb slot checked; class/style на label, остальные attrs на native input; disabled/invalid.

Источник: [SFC](../packages/core/src/components/switch/VfSwitch.vue#L10)


#### VfTable

Props: `caption?: string; columnDividers?: boolean; compact?: boolean; striped?: boolean; stickyHeader?: boolean;`

Defaults: `caption: undefined, columnDividers: false, compact: false, striped: false, stickyHeader: false`

Объявленные события: —

Slots: `caption`; `header`; `default`; `footer`

`vf-table-wrap`/scroll/table; caption/thead/tbody/tfoot placement; compact/striped/column-dividers/sticky-header modifiers; consumer owns cell markup.

Источник: [SFC](../packages/core/src/components/table/VfTable.vue#L9)


#### VfTableOfContents

Props: `items: VfTableOfContentsItem[]; activeId?: string; ariaLabel?: string; smooth?: boolean; scrollOffset?: number; variant?: 'default' | 'pills';`

Defaults: `activeId: undefined, ariaLabel: 'Table of contents', smooth: false, scrollOffset: 0, variant: 'default'`

Объявленные события: —

Slots: —

`vf-table-of-contents` nav/ol/li/links; activeId/level styling and aria-current; optional smooth scroll/offset; default/pills; anchor destination behavior.

Источник: [SFC](../packages/core/src/components/table-of-contents/VfTableOfContents.vue#L10)


#### VfTabs

Props: `items: VfTabItem[]; modelValue?: string; defaultValue?: string;`

Defaults: `modelValue: undefined, defaultValue: undefined`

Объявленные события: `'update:modelValue': [value: string]; change: [value: string];`

Slots: `tab(v-bind={ item, isActive: activeValue === item.value, index })`; `panel(v-bind={ activeValue: activeItem.value })`

`vf-tabs` + horizontal scroller/tablist/tabs/baseline/indicator; controlled/uncontrolled, first enabled fallback; arrows/Home/End/RTL + focus; shared tab slot item/isActive/index; one active panel only with panel slot (activeValue); external tabId/panelId permitted; reduced-motion + resize/overflow handling.

Источник: [SFC](../packages/core/src/components/tabs/VfTabs.vue#L7)


#### VfTag

Props: `tone?: VfFeedbackTone;`

Defaults: `tone: 'neutral'`

Объявленные события: —

Slots: `default`

`vf-tag`, tone modifiers; span + default content and attrs.

Источник: [SFC](../packages/core/src/components/tag/VfTag.vue#L10)


#### VfTextarea

Props: `modelValue?: string; size?: VfControlSize; invalid?: boolean;`

Defaults: `modelValue: '', size: 'md', invalid: false`

Объявленные события: `'update:modelValue': [value: string];`

Slots: —

`vf-textarea` native textarea; string update model; size/invalid/floating modifiers, native attrs, Field filled/support lifecycle.

Источник: [SFC](../packages/core/src/components/textarea/VfTextarea.vue#L11)


#### VfThemeSwitch

Props: `size?: VfControlSize; disabled?: boolean; label?: string; static?: boolean; thumbContrast?: VfSwitchThumbContrast; variant?: VfThemeSwitchVariant; buttonVariant?: VfThemeSwitchButtonVariant;`

Defaults: `size: 'md', disabled: false, label: undefined, static: false, thumbContrast: 'auto', variant: 'switch', buttonVariant: 'secondary'`

Объявленные события: —

Slots: `default`; `thumb(checked=thumbChecked)`

`vf-theme-switch`; existing VfSwitch, VfButton с content или VfIconButton без content; injected useTheme toggles explicit light/dark from resolved system mode; dynamic accessible name; switch label/default/thumb slots.

Источник: [SFC](../packages/core/src/components/theme-switch/VfThemeSwitch.vue#L17)


#### VfTooltip

Props: `text?: string; placement?: VfTooltipPlacement; openDelay?: number; teleportTo?: string | HTMLElement | null | false; disableTeleport?: boolean;`

Defaults: `text: undefined, placement: 'top', openDelay: 80, teleportTo: undefined, disableTeleport: false`

Объявленные события: —

Slots: `default`; `content`

`vf-tooltip` wrapper/trigger + teleported tooltip span/arrow; hover/focus delay, blur/leave close, timer/floating cleanup; aria-describedby on trigger wrapper; top/bottom flip. No public controlled open or emits.

Источник: [SFC](../packages/core/src/components/tooltip/VfTooltip.vue#L8)


### A.2. Layouts: 17 компонентов

Import: `@codemonster-ru/vueforge-layouts` и существующие `/<kebab-name>`; CSS `/<kebab-name>.css`, `/base.css`, `/breakpoints.css`, `/tokens.css`, `/theme.css`, `/styles.css`. Polymorphic `as` — существующий string API; native attrs и default slots сохраняются. Slots перечислены с реальным scope из шаблона, а не только с именем.


#### VfContainer

Props: `as?: string; size?: VfContainerSize; fluid?: boolean;`

Defaults: `as: 'div', size: undefined, fluid: false`

Объявленные события: —

Slots: `default`

`vf-container` polymorphic root; bounded sizes md/lg/xl/2xl and fluid modifier; default content + attrs.

Источник: [SFC](../packages/layouts/src/primitives/VfContainer.vue#L10)


#### VfGrid

Props: `as?: string`

Defaults: `as: 'div'`

Объявленные события: —

Slots: `default`

`vf-grid` polymorphic root; CSS-driven grid geometry, default content + attrs.

Источник: [SFC](../packages/layouts/src/primitives/VfGrid.vue#L8)


#### VfInline

Props: `as?: string; wrap?: boolean;`

Defaults: `as: 'div', wrap: true`

Объявленные события: —

Slots: `default`

`vf-inline` polymorphic flex row; wrap=true default, nowrap modifier.

Источник: [SFC](../packages/layouts/src/primitives/VfInline.vue#L9)


#### VfSection

Props: `as?: string; surface?: boolean;`

Defaults: `as: 'section', surface: false`

Объявленные события: —

Slots: `default`

`vf-section` polymorphic section; optional surface modifier.

Источник: [SFC](../packages/layouts/src/primitives/VfSection.vue#L9)


#### VfStack

Props: `as?: string`

Defaults: `as: 'div'`

Объявленные события: —

Slots: `default`

`vf-stack` polymorphic root; CSS vertical stack.

Источник: [SFC](../packages/layouts/src/primitives/VfStack.vue#L8)


#### VfAdminLayout

Props: `as?: string; fillViewport?: boolean; sidebarCollapsed?: boolean; defaultSidebarCollapsed?: boolean; mobileSidebarOpen?: boolean; defaultMobileSidebarOpen?: boolean; mobileSidebarOpenLabel?: string; mobileSidebarCloseLabel?: string;`

Defaults: `as: 'div', fillViewport: true, sidebarCollapsed: undefined, defaultSidebarCollapsed: false, mobileSidebarOpen: undefined, defaultMobileSidebarOpen: false, mobileSidebarOpenLabel: 'Open navigation', mobileSidebarCloseLabel: 'Close navigation'`

Объявленные события: `'update:sidebarCollapsed': [value: boolean]; 'update:mobileSidebarOpen': [value: boolean];`

Slots: `brand(is-sidebar-collapsed=isSidebarCollapsed, is-sidebar-compact=isSidebarCompact, is-mobile-sidebar-open=isMobileSidebarOpen, collapse-sidebar=collapseSidebar, expand-sidebar=expandSidebar, toggle-sidebar-collapsed=toggleSidebarCollapsed, close-mobile-sidebar=closeMobileSidebar, open-mobile-sidebar=openMobileSidebar, toggle-mobile-sidebar=toggleMobileSidebar)`; `aside(is-sidebar-collapsed=isSidebarCollapsed, is-sidebar-compact=isSidebarCompact, is-mobile-sidebar-open=isMobileSidebarOpen, collapse-sidebar=collapseSidebar, expand-sidebar=expandSidebar, toggle-sidebar-collapsed=toggleSidebarCollapsed, close-mobile-sidebar=closeMobileSidebar, open-mobile-sidebar=openMobileSidebar, toggle-mobile-sidebar=toggleMobileSidebar)`; `mobile-toggle(is-mobile-sidebar-open=isMobileSidebarOpen, mobile-toggle-attrs=mobileToggleAttrs, close-mobile-sidebar=closeMobileSidebar, open-mobile-sidebar=openMobileSidebar, toggle-mobile-sidebar=toggleMobileSidebar)`; `mobile-brand`; `header(is-sidebar-collapsed=isSidebarCollapsed, is-sidebar-compact=isSidebarCompact, is-mobile-sidebar-open=isMobileSidebarOpen, collapse-sidebar=collapseSidebar, expand-sidebar=expandSidebar, toggle-sidebar-collapsed=toggleSidebarCollapsed, close-mobile-sidebar=closeMobileSidebar, open-mobile-sidebar=openMobileSidebar, toggle-mobile-sidebar=toggleMobileSidebar)`; `default(is-sidebar-collapsed=isSidebarCollapsed, is-sidebar-compact=isSidebarCompact, is-mobile-sidebar-open=isMobileSidebarOpen, collapse-sidebar=collapseSidebar, expand-sidebar=expandSidebar, toggle-sidebar-collapsed=toggleSidebarCollapsed, close-mobile-sidebar=closeMobileSidebar, open-mobile-sidebar=openMobileSidebar, toggle-mobile-sidebar=toggleMobileSidebar)`; `footer`

`vf-admin-layout`; desktop collapsed/sidebar compact-hover state + mobile drawer/open state; controlled/uncontrolled props; scoped slots + six exposed open/close/toggle methods; mobile ARIA controls/expanded/labels, root Escape и backdrop close; CSS responsiveness, hover/focus preview. Собственного focus trap/restore, scroll lock или JS viewport/header measurement нет.

Источник: [SFC](../packages/layouts/src/shell/VfAdminLayout.vue#L15)


#### VfAdminShell

Props: `as?: string; fillViewport?: boolean;`

Defaults: `as: 'div', fillViewport: true`

Объявленные события: —

Slots: `brand`; `header`; `header-actions`; `sidebar`; `default`; `footer`

`vf-admin-shell`; topbar above sidebar/main/workspace; brand/header/actions/sidebar/footer slots, fill viewport.

Источник: [SFC](../packages/layouts/src/shell/VfAdminShell.vue#L9)


#### VfAppShell

Props: `as?: string; layout?: 'content' | 'sidebar-content' | 'sidebar-content-aside'; fillViewport?: boolean; showSubheader?: boolean; showContentSubheader?: boolean; stickyHeader?: boolean; stickySidebar?: boolean; stickyAside?: boolean; sidebarAppearance?: 'default' | 'plain'; asideAppearance?: 'default' | 'plain'; contentAppearance?: 'default' | 'plain'; contentPadded?: boolean; sidebarCollapsed?: boolean; defaultSidebarCollapsed?: boolean;`

Defaults: `as: 'div', layout: 'sidebar-content-aside', fillViewport: false, showSubheader: true, showContentSubheader: true, stickyHeader: undefined, stickySidebar: false, stickyAside: false, sidebarCollapsed: undefined, sidebarAppearance: 'default', asideAppearance: 'default', contentAppearance: 'default', contentPadded: true, defaultSidebarCollapsed: false`

Объявленные события: `'update:sidebarCollapsed': [value: boolean];`

Slots: `header`; `subheader`; `sidebar(is-sidebar-collapsed=isSidebarCollapsed, collapse-sidebar=collapseSidebar, expand-sidebar=expandSidebar, toggle-sidebar-collapsed=toggleSidebarCollapsed)`; `content-subheader`; `default(is-sidebar-collapsed=isSidebarCollapsed, collapse-sidebar=collapseSidebar, expand-sidebar=expandSidebar, toggle-sidebar-collapsed=toggleSidebarCollapsed)`; `aside`; `footer`

`vf-app-shell`; structured slots; даже только default content сохраняет container/grid/main wrappers; optional left/right/subheader/content-subheader; controlled/uncontrolled sidebar collapse; exposed controls + scope; sticky measured offsets, appearance/padding/fill flags.

Источник: [SFC](../packages/layouts/src/shell/VfAppShell.vue#L22)


#### VfAsideArea

Props: `as?: string; appearance?: 'default' | 'plain';`

Defaults: `as: 'aside', appearance: 'default'`

Объявленные события: —

Slots: `default`

`vf-aside-area` aside by default; plain/default appearance.

Источник: [SFC](../packages/layouts/src/shell/VfAsideArea.vue#L9)


#### VfAuthLayout

Props: `as?: string; title?: string | null; description?: string | null; fillViewport?: boolean; centered?: boolean; surface?: boolean;`

Defaults: `as: 'main', title: null, description: null, fillViewport: true, centered: true, surface: true`

Объявленные события: —

Slots: `brand`; `title`; `description`; `default`; `footer`

`vf-auth-layout` main/panel + brand/title/description/content/footer; slot override precedence, surface/centered/fill flags.

Источник: [SFC](../packages/layouts/src/shell/VfAuthLayout.vue#L10)


#### VfContentArea

Props: `as?: string; padded?: boolean;`

Defaults: `as: 'main', padded: true`

Объявленные события: —

Slots: `default`

`vf-content-area` main by default; padded modifier.

Источник: [SFC](../packages/layouts/src/shell/VfContentArea.vue#L9)


#### VfDocumentLayout

Props: `as?: string; layout?: 'content' | 'sidebar-content' | 'sidebar-content-aside'; fillViewport?: boolean; edgeNotches?: boolean; showSubheader?: boolean; showContentSubheader?: boolean; stickyHeader?: boolean; stickySidebar?: boolean; stickyAside?: boolean;`

Defaults: `as: 'div', layout: 'content', fillViewport: false, edgeNotches: false, showSubheader: true, showContentSubheader: true, stickyHeader: undefined, stickySidebar: false, stickyAside: false`

Объявленные события: —

Slots: `header`; `subheader`; `sidebar`; `content-subheader`; `default`; `aside`; `footer`

`vf-document-layout` shared container boundary + AppShell-style regions; content/sidebar/aside modes; sticky offsets, optional edge notches and conditional slot presence.

Источник: [SFC](../packages/layouts/src/shell/VfDocumentLayout.vue#L11)


#### VfErrorLayout

Props: `as?: string; code?: string | number | null; title?: string | null; description?: string | null; fillViewport?: boolean; centered?: boolean; surface?: boolean;`

Defaults: `as: 'section', code: null, title: null, description: null, fillViewport: true, centered: true, surface: true`

Объявленные события: —

Slots: `code`; `title`; `description`; `actions`

`vf-error-layout` section + code/title/description/actions; number/string code; null text defaults; slot precedence, centered/surface/fill flags.

Источник: [SFC](../packages/layouts/src/shell/VfErrorLayout.vue#L10)


#### VfFooterArea

Props: `as?: string`

Defaults: `as: 'footer'`

Объявленные события: —

Slots: `default`

`vf-footer-area` footer by default; native attrs/default slot.

Источник: [SFC](../packages/layouts/src/shell/VfFooterArea.vue#L8)


#### VfHeaderArea

Props: `as?: string; sticky?: boolean;`

Defaults: `as: 'header', sticky: true`

Объявленные события: —

Slots: `default`

`vf-header-area` header by default, sticky=true; native attrs и sticky CSS modifier; измерения высоты внутри этого компонента нет.

Источник: [SFC](../packages/layouts/src/shell/VfHeaderArea.vue#L9)


#### VfSetupLayout

Props: `as?: string; title?: string | null; description?: string | null; fillViewport?: boolean; surface?: boolean; asidePosition?: 'left' | 'right'; keyboardNavigation?: boolean;`

Defaults: `as: 'main', title: null, description: null, fillViewport: true, surface: true, asidePosition: 'left', keyboardNavigation: true`

Объявленные события: `next: [event: KeyboardEvent]; back: [event: KeyboardEvent];`

Slots: `brand`; `toolbar`; `aside`; `title`; `description`; `default`; `actions`; `footer`

`vf-setup-layout` main/panel/aside/toolbar/actions/footer; conditional empty-aside detection; next/back KeyboardEvent, keyboardNavigation toggle; conflicting editable targets excluded.

Источник: [SFC](../packages/layouts/src/shell/VfSetupLayout.vue#L20)


#### VfSidebarArea

Props: `as?: string; appearance?: 'default' | 'plain';`

Defaults: `as: 'aside', appearance: 'default'`

Объявленные события: —

Slots: `default`

`vf-sidebar-area` aside by default; plain/default appearance.

Источник: [SFC](../packages/layouts/src/shell/VfSidebarArea.vue#L9)


### A.3. Theme provider, CodeBlock, Playground, Icons


#### VfThemeProvider

`VfThemeProvider` из `vueforge-core`

Props/defaults: `defaultTheme?`, `storageKey?`, `attribute?`; fallback plugin config → system / existing storage+attribute constants

Events/slots/API: default slot; no emits; `useTheme`: mode/resolvedTheme refs + setTheme/toggleTheme

Renderless provider; SSR: system initially resolves light, explicit light/dark сохраняются; mounted storage/root attribute/system preference precedence; localStorage, matchMedia, rootSelector, theme transition cleanup. [source](../packages/core/src/providers/VfThemeProvider.vue#L8), [types](../packages/core/src/types/theme.ts#L738)


#### VfCodeBlock

`VfCodeBlock` из `@codemonster-ru/vueforge-codeblock/view`

Props/defaults: `code=""`, `language=plaintext`, `filename=""`, showHeader=true, showLineNumbers=false, copyable=true, copyLabel=Copy, copiedLabel=Copied, copiedDuration=1200, languageLabel=Language, disabled=false, wrap=false, highlight=true, containerMinHeight/minHeight/maxHeight="", ariaLabel=Code block, theme=inherit, allowedLanguages?, languageFallback=plaintext

Events/slots/API: `copy({text})`, `ready()`; slot actions; `/view` also exports default plugin + setCodeBlockThemeVars and CodeBlock* public types; `/highlight` exports highlighter/preloader/plain-code helpers

`vf-codeblock` header/meta/actions/code-shell/pre/lines; raw-text clipboard; line numbers/decorative hidden text; Shiki async language/cache; highlighted SSR/hydration and nearest theme boundary; headerless copy remains available. [props](../packages/codeblock/src/types.ts#L73), [view](../packages/codeblock/src/view.ts#L1), [tests](../packages/codeblock/src/components/__tests__/VfCodeBlock.test.ts#L289). Package root is not exported.


#### VfPlayground

`VfPlayground` из `@codemonster-ru/vueforge-playground/ui`

Props/defaults: Shared height?/minHeight?/heightMode=fixed, theme=inherit, initialTab?, tabsRenderer?/actionsRenderer?/filesRenderer?; sandbox mode default: files+entry required at public type level, framework=vanilla, autorun=true, showCode=true, resolveImport?, bootstrapScript?; component mode: mode=component + component required, componentSource="", componentSourceLanguage=vue, componentFiles?/componentEntry?/componentPadding?/componentMinHeight?

Events/slots/API: run(), error(PlaygroundError), ready(), preview-ready(); layout scoped slot; plugin componentName=VfPlayground; public union of VfPlaygroundSandboxProps / ComponentProps

`vf-playground`; sandbox iframe vs direct Vue demo; code/preview/console tabs + multi-file external tabpanels; import resolver, runtime bridge, bounded console, nearest inherited theme/host vars; event ordering/SSR client-only hint; runtime stays lazy. [props](../packages/playground/src/props.ts#L8), [SFC](../packages/playground/src/VfPlayground.vue), [tests](../packages/playground/src/VfPlayground.spec.ts#L483). Package root is not exported.


#### VfPlaygroundAsync

`VfPlaygroundAsync` from `/ui`

Props/defaults: Existing createAsyncWithSkeleton wrapper around same component; delay=0; radius=`var(--vf-playground-radius-lg, var(--vf-radius-overlay))`; defaultMinHeight=`var(--vf-playground-height, var(--vf-breakpoint-xs))`

Events/slots/API: Preserve loading wrapper + attrs/slots/event forwarding supplied by createAsyncWithSkeleton

Separate public export, not separate visual design. [ui.ts](../packages/playground/src/ui.ts#L10), [async helper](../packages/core/src/async.ts)


#### VueIconify

`VueIconify` from `@codemonster-ru/vueforge-icons`

Props/defaults: icon=moon; spin=false; size=`var(--vf-icon-current-size, var(--vf-icon-size-md))`; inset=0; variant?; family=classic; secondaryColor=`var(--vf-icon-secondary-color, currentColor)`; secondaryOpacity=`var(--vf-icon-secondary-opacity, 0.4)`

Events/slots/API: No emits/slots; public iconGroups/iconNames/icons/iconCatalog/coreIconNames/showcaseIconEntries, iconFamilies/iconVariants/outlineIconVariants and corresponding types

`vf-icon-wrapper` span → actual SVG component; variant/family optical offsets/inset; moon fallback неизвестного имени + camel/kebab name normalization; unsupported variant/family выбрасывают ошибку, brand family ограничен classic; exact path/viewBox/stroke metadata; native attrs forwarding. 117 SFC files include renderer + 116 glyph modules; glyph modules are not individual named public exports. [renderer](../packages/icons/src/lib/components/icon.vue#L1), [public exports](../packages/icons/src/lib/index.ts#L1), [metadata](../packages/icons/src/lib/iconMeta.ts#L1). Icons are one data/renderer group in this inventory. Scoped SCSS находится в renderer SFC и требует отдельного переноса для Razor; утверждение об уже внешнем CSS core/layouts не распространяется на Icons.


`@codemonster-ru/vueforge-theme` — уже framework-neutral пакет, не Vue adapter: motion/breakpoint/token name registries; mode resolver; create/resolve presets/configs; CSS variable/text serializers; explicit DOM apply functions. Сохраняются `VfThemeMode`, resolved/preset/config/token types и имена exported functions. Vue refs, provider, injection и plugin ownership остаются в core adapter. [public entrypoint](../packages/theme/src/index.ts#L1).

### A.4. Public types и границы API

Core root [index.ts](../packages/core/src/index.ts#L81) явно экспортирует: `VfBadgeTone`, `VfAvatarShape`, `VfBreadcrumbItem`, `VfButtonVariant`, `VfConfirmDialogInitialFocus`, `VfControlSize`, `VfDataTableCellAlign`, `VfDataTableCellVerticalAlign`, `VfDataTableColumn`, `VfDataTableColumnPin`, `VfDataTableColumnOrder`, `VfDataTableColumnWidths`, `VfDataTableDensity`, `VfDataTableLabels`, `VfDataTableLoadingVariant`, `VfDataTablePaginationMode`, `VfDataTableRow`, `VfDataTableSort`, `VfDataTableSortDirection`, `VfDataTableSortingMode`, `VfDatePickerLabels`, `VfDialogSize`, `VfDrawerSize`, `VfDrawerPlacement`, `VfDividerOrientation`, `VfDropdownPlacement`, `VfFeedbackTone`, `VfFormLayoutMode`, `VfLinkUnderline`, `VfLinkTone`, `VfPageHeaderHeadingLevel`, `VfNavMenuItem`, `VfNavMenuProps`, `VfSelectOption`, `VfStepperContentPosition`, `VfStepperItem`, `VfStepperOrientation`, `VfSwitchThumbContrast`, `VfTabItem`, `VfTableOfContentsItem`, `VfTooltipPlacement`. Их поля/union literals — [components.ts](../packages/core/src/types/components.ts#L1). Отдельно сохраняются theme types, composable option types, breakpoint types и `CreateAsyncWithSkeletonOptions` из того же public entrypoint.

Особые type contracts: `VfTabItem` — value/label/disabled/tabId/panelId; `VfSelectOption` — string value/label/disabled; `VfNavMenuItem` — recursive children, kind=item/group, leadingIcon, href/to/target/rel/disabled; `VfDataTableColumn` — key/header/sortable/width/minWidth/maxWidth/nowrap/resizable/reorderable/pinned/align/verticalAlign/scope. Нельзя свести эти типы к общему `{ id, label }`. `VfDataTableRowKey`, локальные `VfRadioValue`, `VfFieldLabelPlacement`, `VfThemeSwitchVariant` нельзя объявлять существующими root exports только потому, что они встречаются в source: точный root/subpath экспорт фиксируется отдельно.

Layouts root экспортирует `VfAdminLayoutProps`, `VfAdminLayoutExposed`, `VfAdminLayoutScope`, `VfAdminLayoutMobileSidebarScope`, `VfAdminLayoutMobileToggleAttrs`: шесть методов collapseSidebar/expandSidebar/toggleSidebarCollapsed/closeMobileSidebar/openMobileSidebar/toggleMobileSidebar, desktop/mobile state и mobileToggleAttrs. Также exported preset/theme/options/token/resolved layout types, theme serializers/apply/resolve helpers, `useCssVarBreakpoints`, переэкспорт foundation breakpoints/composables. [index](../packages/layouts/src/index.ts#L11), [admin types](../packages/layouts/src/shell/admin-layout.types.ts#L1).

### A.5. Найденные проверки и ограничения аудита

- Core общие component tests содержат Input/icon/clear/password/uncontrolled value/selection/disabled/readOnly в [components.spec.ts:1546](../packages/core/src/components/components.spec.ts#L1546), Field/required/floating варианты — далее с 1756, Select keyboard/native form submission — с 1991; DataTable sort/page/selection/reorder/resize/expansion — в том же файле. Это полезная исходная матрица, а не доказательство сегодняшнего запуска.
- Tabs отдельный [VfTabs.spec.ts](../packages/core/src/components/tabs/VfTabs.spec.ts#L13): controlled/uncontrolled, disabled skip, RTL, shared slots, no implicit panel, external IDs, moving indicator, overflow controls, reduced motion. Overlay/date/menu/group/stepper/form/page-header families имеют соседние `.spec.ts`; native controls и простые primitives также проверяются общим suite.
- Layouts [layouts.spec.ts](../packages/layouts/__tests__/layouts.spec.ts#L100): CSS exports/runtime-token serialization/scoped modes, responsive/controlled admin shells, conditional slots, setup keyboard exclusions и core theme-provider forwarding.
- CodeBlock tests покрывают real highlighting, SSR/hydration, nearest theme boundary, scoped vars, raw clipboard payload, hidden-header copy и lazy cache. Playground tests покрывают component/sandbox modes, external tabpanel IDs, theme bridge, reparenting, SSR hint hydration и ready/preview-ready sequencing.
- Не запускались browser interactions или новые conformance/visual tests. A11y здесь означает сохранение существующих semantics/handlers из source, а не новый WCAG PASS; существующие возможные defects не маскируются как migration cleanup.

## Приложение B. Проверка этого этапа

- Ветка `refactor/multiplatform-v2` создана на точном reference SHA; HEAD не содержит новых коммитов. Отслеживаемое дерево совпадает с reference.
- Каталог сверён с фактическими export barrels и дополнительными component entries: 68 ожидаемых имён, 68 разделов, без пропусков и дубликатов. Defaults core/layouts дополнительно извлечены из AST существующих `withDefaults`, включая явные `undefined` и factories.
- Локальные ссылки на исходники и указанные номера строк существуют. Исторические выводы привязаны к Git commits; материал первой попытки не перенесён в source новой ветки.
- Markdownlint проверил непосредственно этот файл с настройками репозитория: ошибок нет. Проверка whitespace документа также не выявила ошибок.
- Build, component tests и screenshot suites не запускались: source не изменён, а воспроизводимый comparative baseline является будущей Phase 0. Никаких новых доказательств visual PASS этот документ не заявляет.

Следующее действие после одобрения — M00, затем M01. Оба выполнены; см. приложение В.

## Приложение В. Результаты M00 и M01 и уточнения плана

M00 и M01 выполнены на ветке `refactor/multiplatform-v2`. Production source, CSS, версии пакетов и import paths не изменялись. Harness и его документация — `scripts/baseline/`, замороженные данные — `baseline/`.

### В.1. Что подтвердилось

- Immutable reference через `git archive` в изолированный каталог работает: relative workspace symlinks внутри скопированного `node_modules` переуказывают на изолированные `packages/*`, и harness проверяет это до сборки. Shared working tree между captures не переключается.
- Reference-vs-reference control run по двум независимым checkouts даёт 0 отличий на всех 24 captures (6 routes x 2 viewports x 2 темы), включая `/colors`. Повторный запуск совпадает с записанным baseline: 24 captures, 256 cases.
- Каталог из приложения A машинно подтверждён: 46 core + 17 layouts + `VfThemeProvider`, `VfCodeBlock`, `VfPlayground`, `VfPlaygroundAsync`, `VueIconify` = 68 публичных имён. Число проверяется, а не описывается.
- Negative проверки работают: inventory gate ловит удалённый export, route, CSS entry и export subpath; сравнение captures ловит missing/unexpected case, потерю компонента, dimension mismatch и font drift; 12 мутаций `VfInput` обнаруживаются characterization suite.

### В.2. Уточнения к плану, выявленные при выполнении

1. **Reference build зависит от gitignored generated artifacts.** `packages/core/src/styles/components.css` и `packages/layouts/src/styles.css` импортируют `.generated/theme/*.css`, которые создаются при загрузке `vite.config.ts` соответствующих пакетов. Кроме того, showcase резолвит `@codemonster-ru/vueforge-icons` и `@codemonster-ru/vueforge-core/async` через `dist`, а не через source aliases. Поэтому изолированный reference обязан выполнить полный `npm run build` рабочего пространства перед сборкой showcase; копировать артефакты из рабочего дерева нельзя. Раздел 18.2 следует читать с этим уточнением.
2. **Showcase содержит три реальных источника недетерминизма.** `CoreShowcase.vue` крутит progress demo через `setInterval` + `Math.random`; `LayoutsShowcase.vue` рендерит `new Date().getFullYear()`; `VfDatePicker` подсвечивает «сегодня». Без контроля часов baseline ломается в другой день. Harness управляет окружением (закреплённый `Date`, seeded `Math.random`, замороженный interval scheduler) до выполнения любого page script, а не маскирует компоненты — это соответствует требованию 18.2 «clocks должны быть deterministic», но требует явной записи в плане.
3. **Font provenance хуже, чем предполагалось.** Reference объявляет `Inter, ui-sans-serif, system-ui, …` и **не поставляет ни одного `@font-face`**. На машине записи baseline `Inter` не установлен: измеренная ширина стека `Inter` равна принудительному serif fallback (`227.18`), а фактический body измеряется как `257.38`, то есть как `system-ui`/`BlinkMacSystemFont`. Screenshot hashes действительны только для записанного окружения. Отсюда следует, что упомянутое в 18.3 расхождение `44/48 differing` первой попытки нельзя приписывать только component regressions без проверки загруженной face — и что добавление bundled font (`5b9b65a4`) было продуктовым изменением, а не migration-neutral шагом.
4. **`/icons` не рендерит SaaS contexts.** `packages/icons/src/App.vue` на reference не содержит ни одного `<slot>`, поэтому контент `#saas-contexts`, который передаёт `examples/playground/src/sections/icons/IconsShowcase.vue`, не отображается. Baseline фиксирует фактически отрендеренный DOM. Это historical behaviour; исправление — отдельное продуктовое решение, не часть migration.
5. **Раздел 6 о consumer `class`/`style` требует дополнения.** Помимо того что при adornments reference ставит их на wrapper, у reference есть отдельный дефект: на plain (неадорнированном) input consumer `style` **теряется полностью** — `inheritAttrs: false`, `style` исключён из forwarded attrs, а bare-ветка шаблона биндит только `:class`. При extraction это нельзя «починить» молча и назвать parity.
6. **Существующий core test setup скрывает icon contract.** `packages/core/src/__tests__/setup.ts` мокает реестр иконок только `chevronDown`, поэтому `icons.eye`, `icons.eyeSlash` и `icons.xmark` неразличимы (`undefined`). Это прямо касается prerequisite M06 «eye/eyeSlash/xmark — обязательные internal glyphs»: до M01 их подмена не была бы обнаружена ни одним тестом. Characterization suite ставит собственный реестр; общий setup не изменялся.

### В.3. Зафиксированные historical defects `VfInput` (не исправлять на этом этапе)

- Consumer `style` теряется на plain input (см. В.2.5).
- Clear, если clear-контрол был единственным adornment, схлопывает conditional wrapper и пересоздаёт `<input>`; синхронный `focus()` в `handleClear` теряется, focus уходит на `<body>`. При наличии другого adornment элемент сохраняется и focus остаётся.
- `disabled="disabled"` не подавляет clear: проверка boolean attr принимает только `true`, `""` и `"true"`.
- Consumer `aria-invalid` перекрывает вычисленный, потому что forwarded attrs биндятся после него.

### В.4. Ограничения, не закрытые на M00/M01

- Visual gate объявлен PASS **только** для записанного окружения (Chrome 152 headless, darwin-arm64, DPR 1, `en-US`, UTC, reduced motion, без установленного `Inter`). Перенос на другой host требует пере-записи baseline под review с сохранением provenance.
- Baseline хранит hash-и скриншотов, а не сами PNG; для просмотра pixel diff нужны артефакты обоих сравниваемых запусков.
- Matrix — только full-page по 6 routes x 2 viewports x 2 темы. Interaction, accessibility, SSR/no-JS и package-consumer gates из 18.1 на этом этапе не строились.
- В рабочем дереве остаются неотслеживаемые каталоги первой попытки `packages/razor/` и `examples/razor/` (включая `vendor/`). Они не входят в Git, но ломают корневые `npm run lint:data` и `npm run lint:md` локально. Каталоги сохранены и не удалялись.

## Приложение Г. Результаты M02

M02 выполнен на ветке `refactor/multiplatform-v2` тремя focused commits. Product behavior не изменялось: `VfInput.vue`, Vue-компоненты, CSS output и его distribution, showcase, public exports, import paths и версии существующих пакетов остались прежними. Изменены только root `package.json` (scripts), `package-lock.json` (две workspace-ссылки) и harness M00.

### Г.1. Созданные boundaries

- `packages/shared-core` — `@codemonster-ru/vueforge-shared-core`, `0.0.0`, `private: true`. Будущий дом platform-neutral pure rules и contracts. `src/index.ts` — пустой модуль: на M02 граница и есть результат, а наполнение пакета до появления реального второго потребителя — это ровно тот anti-pattern «больше scaffolding, чем переносимого поведения» из раздела 21. Есть `tsconfig.json` и `check`/`typecheck` scripts, пакет включён в root `check`.
- `packages/styles` — `@codemonster-ru/vueforge-styles`, `0.0.0`, `private: true`. Будущий единственный владелец общего CSS. Намеренно не содержит ни одного stylesheet, поэтому CSS output, ordering, specificity и distribution побайтово не изменились. Первый dependency closure (`input.css` + `field.css` + `icon-button.css` и их tokens) переносит M04.

Оба пакета `private`, а `scripts/ci/prepare-release-from-tag.mjs` отказывается публиковать private package, поэтому случайная публикация невозможна. `packages/core` сохраняет identity `@codemonster-ru/vueforge-core` и neutral-пакетом не становится.

### Г.2. Dependency guard

`scripts/ci/boundaries.mjs` описывает правила и анализирует граф по манифестам и тексту исходников; отдельный dependency-analysis framework не вводился. Запрещённые направления:

- `shared-core`, `styles`, `theme` → `vue`, любой Vue adapter (`core`, `layouts`, `icons`, `codeblock`, `playground`, `playground-vite-plugin`), `playground-core`, `razor`, showcase;
- `shared-core` дополнительно → browser globals (`document.`, `window.`, `localStorage`, `matchMedia`, `HTML*Element`, …). Для `theme` DOM разрешён намеренно: `applyThemeConfig` принимает `Document`, и framework-independent не означает DOM-free (раздел 3.3);
- `razor` → `vue`, `core`, `layouts`;
- `core`, `layouts` → `razor`.

Проверяются и source imports (static, dynamic, `require`, CSS `@import`, в `.ts/.js/.vue/.css`), и `dependencies`/`peerDependencies` манифестов. Дополнительно проверяется, что boundary-пакеты существуют под именами из раздела 9 и остаются `private`.

Guard читает `git ls-files`, поэтому неотслеживаемые leftovers `packages/razor/` и `examples/razor/` не сканируются; правила для `razor` объявлены и включатся, когда появится tracked razor package. Escape imports разрешённого направления выводятся как notes, а не failures: десять существующих build-time связей `core`/`layouts` → `theme` остаются видимыми, но не заставляют менять product source в milestone, которому это запрещено.

Negative fixture — `scripts/ci/boundaries.test.mjs`: 18 кейсов строят одноразовые репозитории во временном каталоге и требуют обнаружения каждого запрещённого ребра. Deliberate violation в production tree не остаётся. Дополнительно проверен сам CLI: временно подложенный `import { computed } from 'vue'` в `shared-core` дал exit 1, после удаления — exit 0.

Команды: `npm run check:boundaries` и `npm run test:boundaries`, обе включены в root `check`, который CI выполняет через `npm run verify`.

### Г.3. Findings M02

1. **Isolated reference получал dangling symlinks.** Harness M00 копирует `node_modules` рабочего дерева в `git archive` reference-коммита. Workspace-ссылки на пакеты, которых на reference ещё нет (`shared-core`, `styles`), приезжали как битые symlinks. Сейчас `linkDependencies` их удаляет, поэтому изолированное дерево остаётся точным снимком reference workspace и пакет из будущего milestone не может частично разрезолвиться внутри исторического capture. Captures при этом не менялись: 24 captures, 256 cases до и после.
2. **Guard требовал git repository.** Первая версия падала в дереве, экспортированном без `.git`, обрывая весь `npm run check`. Добавлен fallback на обход рабочего дерева с явным указанием источника; экспортированное дерево по построению содержит только tracked-контент, поэтому гарантия «только tracked» сохраняется.
3. **Неотслеживаемые razor leftovers ломают ещё и `check:docs`.** Приложение В.4 фиксировало только `lint:data` и `lint:md`. `scripts/ci/check-documentation-contracts.mjs` тоже сканирует все Markdown-файлы и падает на `packages/razor/vendor/**`. Не связанных с leftovers находок ноль, и в чистом дереве команда проходит. Это состояние локального рабочего дерева, а не регрессия M02.
4. **Подтверждено В.2.1.** `npm run check` требует предварительного `npm run build`: `check:css-parity` читает gitignored `.generated/theme/tokens.css`. CI это уже соблюдает (`verify` = … `build` → `check` …).

### Г.4. Уточнения к плану

1. Раздел 9 описывает `shared-core` и `styles` как будущие npm-пакеты с рабочими именами. Уточнение: на M02 оба создаются как `private: true`, версия `0.0.0`, без сборки и без публикации. Снятие `private` — отдельное решение вместе с появлением реального потребителя и release train.
2. Каталоги `contracts/` и `examples/shared` из схемы раздела 9 на M02 намеренно не создавались: их потребители появляются на M07/M08, а пустые каталоги-заглушки противоречат границе milestone «не десятки пустых packages».
3. Раздел 10 требует проверять escape imports вида `../core/src`. Уточнение: guard различает направление. Escape import разрешённого направления — note, запрещённого — failure. Замена десяти существующих `core`/`layouts` → `theme` связей на публичный package entry остаётся отдельной задачей и не входит ни в M02, ни в исправление дефектов reference.

### Г.5. Что НЕ делалось

Token ownership, theme defaults, serialization, aliases, presets, `data-vf-theme`, provider и storage semantics не трогались (M03). `input.css`, `field.css`, `icon-button.css`, CSS imports, build CSS graph, standalone artifacts и auto-CSS entries не трогались (M04). `VfInput.vue` не изменялся, pure functions из него не извлекались (M05). Razor adapter не реализовывался.

## Приложение Д. Результаты M03 и M04

Оба milestone выполнены на ветке `refactor/multiplatform-v2` отдельными commits. `VfInput.vue` побайтово совпадает с reference; ни один Vue SFC, public export, import path, CSS public path, `.vf-*`, `--vf-*`, token value, версия пакета и showcase не изменялись.

### Д.1. M03 — перенос colour token ownership

Было: `packages/core/src/theme/color-token-schema.ts` — primitive palette (66), semantic light/dark (85), counts, allowlist внешних переменных и чистые валидаторы графа — жил в Vue-пакете и тянулся в `theme` через escape imports `../../../theme/src/*`.

Стало: canonical source — `packages/theme/src/color-token-schema.ts`, рядом с контрактом имён, который эти данные реализуют. Изменились только три строки import; тело файла побайтово идентично, поэтому ни одно имя, значение, alias или отношение не поехало вместе с переносом. Второго источника нет: core не хранит копию, а импортирует перенесённый модуль.

Модуль намеренно **не** добавлен в публичный `index.ts` пакета `theme`. Пакет опубликован как 2.0.1, его export surface заморожен M00-инвентарём, а у нейтральных данных пока нет внешнего потребителя; расширять published API без потребителя — это surface без consumer. Core продолжает потреблять модуль тем же способом, каким уже потреблял breakpoints, motion и colour contract.

Проверка эквивалентности generation: `.generated/theme/{tokens,theme,generated-breakpoints}.css` и три layout-артефакта — все шесть хэшей побайтово совпали до и после переноса.

### Д.2. Почему component token defaults остались в core

`default-preset-source.ts` (886 строк component token defaults) перенести в `theme` на M03 нельзя:

- он типизирован `VfThemeTokens` из `packages/core/src/types/theme.ts`, поэтому перенос создал бы ребро `theme → core`, запрещённое boundary guard;
- альтернатива — расширить published `VfThemeTokens` пакета `theme` примерно на 690 required-полей. Это breaking change для любого внешнего потребителя, который конструирует preset, потому что `VfThemePreset.tokens` требует их все.

Эти defaults описывают компоненты именно core-пакета, а раздел 9 откладывает перенос package-specific presets до появления shared CSS потребителя. M04 такого потребителя не создаёт: CSS custom properties связываются поздно, `packages/styles` ссылается на `var(--vf-*)` и не нуждается в значениях на этапе сборки. Поэтому «извлечённые neutral defaults» из схемы раздела 9 выполнены для colour-слоя; перенос component defaults остаётся отдельной задачей и потребует сначала вынести neutral часть `VfThemeTokens` отдельным типом, не расширяя published интерфейс.

### Д.3. M04 — перенос Input CSS closure

Фактический declared closure: `input.css → field.css + icon-button.css`, и дальше — ничего. Перенесены ровно эти три файла в `packages/styles/src/components/`, verbatim. Floating label зависит от положения label относительно input внутри `.vf-field`, а clear/reveal — icon buttons, поэтому извлечение одних `.vf-input` правил разорвало бы связный closure. Foundation, tokens и accessibility preferences остались в core: от них зависит каждый компонент, их перенос потянул бы весь cascade вместо одного closure.

`packages/core/src/styles/entries/{input,field,icon-button}.css` стали однострочными forwards. Ни один существующий путь не редактировался: `components.css` по-прежнему импортирует `./entries/*.css`, девять других core-entries по-прежнему импортируют `./field.css` и `./icon-button.css`, `src/entries/*.ts` по-прежнему импортируют `../styles/entries/*.css`, vite-писатель standalone CSS по-прежнему читает каталог entries, subpath `./input.css` и browser auto-CSS entries не тронуты.

**Finding:** forwarding-файл не должен содержать комментария. `inlineCssImports` заменяет только строку `@import`, а остальной текст сохраняет, поэтому пояснительный комментарий протёк в каждый собранный stylesheet и сломал побайтовую эквивалентность. Forwards содержат ровно одну строку; пояснение живёт в README и в тексте ошибки ownership-guard.

Существующие CSS contract/parity/geometry checks и три style-спеки читают собственный текст entry, поэтому теперь разрешают forward до canonical source через общий helper `packages/core/build/style-entry-sources.mjs`. Forward выводится, а не перечисляется: entry, чьё тело — один `@import`, и есть forward. Проверки читают побайтово тот же контент, что и до переноса; ни одно утверждение не ослаблено.

### Д.4. Новые gates

- `npm run baseline:showcase:current` — reference → current drift: собирает и обслуживает рабочее дерево в том же окружении, в котором записан baseline, и сравнивает с ним. Писать baseline не может, как и `--origin`.
- `npm run baseline:css` — собирает `packages/core` в immutable checkout reference-коммита и в рабочем дереве и сравнивает все emitted stylesheets. Source-level равенства для ownership move недостаточно: одни и те же правила, собранные из другого пакета, могут разъехаться из-за import order.
- `check:boundaries` дополнен правилом CSS ownership: adapter-entry не может держать копию stylesheet, которым владеет `packages/styles`, или форвардить не туда. Пять fixture-кейсов и одна проверка на реальном дереве.

### Д.5. Доказательства

- Все 52 собранных stylesheet побайтово совпадают с reference.
- Reference → current showcase: 0 отличий, 24 captures, 256 cases, окружение M00 (Chrome 152 headless, darwin-arm64, DPR 1, `en-US`, UTC, reduced motion, без установленного `Inter`).
- 74 characterization-теста `VfInput` и все 12 mutation detections проходят.
- Negative verification: мутации Input padding, Input border width, `transform` во `field.css` и `border-radius` в `icon-button.css` каждая роняли `baseline:css` и распространялись ровно на зависимые артефакты; возврат forward в копию ронял `check:boundaries`.
- Покрытие Input-состояний существующим `/core`: 57 `.vf-input`, 36 `.vf-input-wrap`, 24 clear-контрола, 6 password-toggle, 21 leading / 12 trailing adornment, 50 filled / 7 empty, 3 disabled, 3 readonly, invalid, все размеры и все три floating-варианта.

### Д.6. Ограничение

Focus-состояние не снимается пиксельно: showcase captures не форсируют focus. Оно покрыто на уровне CSS — `baseline:css` доказывает побайтовую идентичность `input.css`, включая 7 правил `:focus-visible` и 4 `:focus`, а также `:hover`, `:active`, `:disabled` и `:read-only`. Отдельный targeted Input visual matrix не строился: он потребовал бы внедрять fixture-страницу в immutable reference checkout, что противоречит запрету подмешивать новый CSS в историческую страницу, и при побайтово идентичных CSS и DOM дал бы мало дополнительной информации.

## Приложение Е. Результаты M05

M05 выполнен двумя focused commits. Public Vue API, import paths, CSS, tokens, showcase и версии пакетов не изменялись. Template `VfInput.vue` побайтово совпадает с reference, как и `defineOptions`, `VfInputProps`, `withDefaults` и `defineEmits`.

### Е.1. Классификация логики до extraction

| Категория | Содержимое |
| --- | --- |
| PURE | filled state; доступность password reveal; effective `type`; clear eligibility; композиция adornment state |
| VUE REACTIVITY | `ref`, `computed`, `watch`, `inject`, `useAttrs`, `useSlots`, `onBeforeUnmount`, `nextTick`, `withDefaults`, `defineEmits` |
| DOM/BROWSER | `inputRef`, `saveInputSelection`, `restoreInputSelection`, `waitForSelectionFrame` (rAF), `focus()`, `setSelectionRange`, `selectionDirection`, `handleInput` через `event.target` |
| RENDER/TEMPLATE | весь template, `inputClasses`, `wrapperClasses`, `cx`, `VueIconify`, `VfIconButton`, label и glyph reveal-кнопки |
| FIELD INTEGRATION | `inject(vfFieldContextKey)`, `setFloatingSupported`, `setFilled`, `isFloatingLabel`, cleanup при unmount |
| ATTRS/EVENTS | `isTruthyBooleanAttr`, `isDisabled`, `isReadonly`, `inputType`, `externalClass`, `externalStyle`, `forwardedInputAttrs`, `emit` |

Перенесена только строка PURE.

### Е.2. Что переехало в shared-core

`packages/shared-core/src/input/state.ts`:

- `isInputFilled(value)` — из `String(currentValue.value ?? '').length > 0`;
- `isPasswordRevealAvailable({ passwordReveal, type })` — из `Boolean(props.passwordReveal) && inputType.value === 'password'`;
- `resolveInputType({ type, passwordRevealAvailable, passwordRevealed })` — из тернарника `resolvedInputType`;
- `isClearActionAvailable({ clearable, filled, disabled, readonly })` — из условия `hasClearControl`;
- `resolveInputAdornmentState(flags)` — из цепочки `hasTrailingActionControl` → `hasTrailingControl` → `hasAdornments`.

Все принимают и возвращают plain values. Ни одна не читает DOM node, Vue ref, attrs или slot; controller, runtime и state machine не создавались. Текущий потребитель — Vue `VfInput`. Будущая релевантность для Razor: browser controller, переключающий clear/reveal, обязан пересчитывать ровно эти правила, чтобы wrapper и его классы оставались корректными.

### Е.3. Что намеренно осталось в Vue

Интерпретация boolean attrs (`true`, `""`, `"true"`) — это attrs-семантика, поэтому clear-правило получает уже решённые booleans. Композиция class names, label reveal-кнопки и выбор glyph тоже остались в adapter: раздел 20 делает neutral icon-name resolution prerequisite M06, а PHP-renderer формирует начальный markup сам и не импортирует TypeScript. Две геометрические предпосылки wrapper-классов (`--with-trailing-and-clear`, `--with-trailing-password-and-clear`) — тривиальные `&&` уже выведенного состояния, используются только для class names и остались в SFC.

### Е.4. Resolution plumbing

`@codemonster-ru/vueforge-shared-core` алиасится на source в `tsconfig`, `vitest.config` и `vite.config` пакета core, безусловно для обеих сборок. Специфер намеренно отсутствует в `rollupOptions.external` и в `dependencies` core: пакет private и не опубликован, поэтому правила инлайнятся в dist. Проверено: ни один артефакт `dist` и ни один `.d.ts` не упоминает имя пакета, а packed-consumer smokes (`smoke:css-export`, `smoke:consumer-css`, `smoke:theme-types`, `smoke:cjs-ssr`) проходят.

### Е.5. Findings M05

1. **Три mutation-строки M01 устарели ровно там, где логика переехала** (`drop-leading-icon`, `drop-trailing-icon`, `clear-ignores-readonly`). Harness сообщил об этом явно, а не молча пропустил проверку. Они перенаправлены на новые эквивалентные места; добавлены четыре мутации, ломающие сами shared-правила, чтобы доказать, что нарушение shared-семантики по-прежнему валит Vue characterization, а не прячется за границей пакета. Всего 16 мутаций, все обнаруживаются.
2. **Integrity check M01 давал false positive.** Он объявлял утечку мутации, если `git diff` по `VfInput.vue` не пуст, то есть при любой незакоммиченной работе над файлом. Теперь утечка — это файл, изменившийся на диске за время прогона (сравнение хэшей до/после по всем файлам, которые может переписать мутация, включая shared-правила), а расхождение с HEAD печатается как work in progress.
3. **SFC вырос в строках, уменьшившись по смыслу.** Script-секция 188 → 214 строк: блок импорта плюс более многословные call-site с named options. Компонент больше не решает, что означают filled, clear eligibility, reveal availability, effective type и adornment layout, — он только передаёт значения. Позиционные аргументы сократили бы код, но для сигнатур из трёх-четырёх boolean это ухудшило бы читаемость и повысило риск перепутать параметры.

### Е.6. Доказательства

- 74 characterization-теста и все 431 core-теста проходят; исторические дефекты (потеря `style` на plain input, пересоздание input и потеря focus при clear-only, `disabled="disabled"`, override `aria-invalid`, direction выделения) по-прежнему утверждаются и проходят.
- 37 unit-тестов shared-правил проходят.
- 16/16 мутаций обнаруживаются, включая четыре, ломающие shared-правила.
- Reference → current showcase: 0 отличий, 24 captures, 256 cases.
- 52 собранных stylesheet и шесть generated theme artifacts побайтово не изменились.
- Boundary guard видит первое ребро `core → shared-core` и пропускает его; `shared-core` не импортирует Vue, adapters, Razor и browser globals.
- Полная цепочка `npm run check` проходит в чистом exported tree.

## Приложение Ж. Результаты M06

M06 выполнен четырьмя focused commits. Vue-сторона не изменялась: `VfInput.vue`, public API, import paths, CSS output, tokens, showcase и версии существующих пакетов остались прежними.

### Ж.1. Untracked leftovers: что это оказалось

`packages/razor/` и `examples/razor/` содержали **только** `vendor/` и кэши инструментов (`.npm-cache`, `.phpstan.cache`, `.phpunit.cache`); ни `composer.json`, ни `src/`, ни одного PHP-файла первой попытки. То есть исходники давно удалены, остались артефакты. Конфликта с созданием tracked-пакета не было. Каталоги не удалялись и не изменялись; `**/vendor` и PHP-кэши добавлены в `.gitignore`. Из вендора использована только реально установленная зависимость `codemonster-ru/razor` v2.1.0 — сам движок, а не код первой миграции (`codemonster-ru/ui-razor` в `examples/razor/vendor` не использовался).

### Ж.2. Реальный Annabel Razor

Использованы фактические API движка, а не Vue-семантика: `ComponentProviderInterface` (`prefix()` + `components()`), `ComponentInterface::render(ComponentRenderContext): RenderedHtml`, `ComponentRenderContext` (`props()`, `prop()`, `hasSlot()`, `slot()`), именованные слоты `<razor-slot name="leading">`, `RenderedHtml::fromTrustedString`. Грамматика props движка — kebab-case (`/^:?[a-z][a-z0-9]*(-[a-z0-9]+)*$/`), bare-атрибут компилируется в `true`, `:prop="$expr"` — PHP-выражение. Поэтому Vue `modelValue` в Razor называется `value`, `passwordReveal` — `password-reveal`. Синтаксическая идентичность Vue не воспроизводится; совпадает observable output.

### Ж.3. Осознанные расхождения с Vue-адаптером

1. **Wrapper всегда рендерится, если запрошено действие.** Контроллер поэтому никогда не перестраивает DOM. Как следствие Razor **не воспроизводит** историческое поведение Vue, при котором очистка единственного adornment пересоздаёт `<input>` и теряет focus: это артефакт Vue-рендеринга, а не platform contract. Зафиксировано как framework-specific historical behavior, не как parity failure.
2. **Действия рендерятся инертными до bootstrap** (`hidden`, `disabled`, inline `display:none`), и производные от них modifier-классы не выставляются. Без JS нет ни видимой кнопки, которая ничего не делает, ни зарезервированного под неё места.
3. Vue-дефект «потеря consumer `style` на plain input» не переносится: это артефакт `inheritAttrs`, у PHP нет причины его иметь. Placement `class`/`style` (wrapper при adorned, input при bare) сохранён.

### Ж.4. Findings M06

1. **`hidden` недостаточно, чтобы скрыть действие.** Канонический `.vf-icon-button` задаёт `display`, а class-селектор старше UA-правила `[hidden]`. Кнопки оставались видимыми, при этом property-ассерт `button.hidden === true` проходил. Поймано скриншотом, а не тестом. Исправлено inline `display:none`, который снимает контроллер; ассерты переведены на computed visibility. Откат исправления роняет gate.
2. **CSS иконок Vue-scoped.** `.vf-icon-wrapper` / `.vf-icon` объявлены в `<style scoped>` внутри `packages/icons/src/lib/components/icon.vue` и собираются с `[data-v-…]`, поэтому не входят в canonical shared CSS. Для Input-замыкания это не сказывается: родители (`.vf-input-wrap__icon` и `.vf-icon-button`) уже центрируют содержимое, измеренные боксы иконок совпадают (16×16 в обоих адаптерах). Но при миграции icon-системы эти правила должны переехать в `packages/styles`.
3. **Токены CSS всё ещё производит сборка Vue-пакета.** `packages/core/.generated/theme/*.css` — единственный источник `--vf-*` для страницы, поэтому asset-сборка Razor копирует их оттуда. Копирование built-артефактов разрешено разделом 41, но нейтрального владельца token CSS пока нет; это кандидат на отдельный milestone.
4. **Fixture с Vue не может жить внутри `packages/razor`.** Первая версия mixed-ownership фикстуры импортировала Vue и `core` из пакета Razor — guard это поймал. Исправлено архитектурно: фикстура переехала в `scripts/ci/fixtures`, правило не ослаблялось.
5. **`DOMDocument::loadHTML` требует явного charset**, иначе UTF-8 значения ломаются. Компонент отдаёт корректный UTF-8; правка потребовалась только тестовой обвязке.

### Ж.5. Что НЕ делалось

Публичный Razor `VfField` не объявлялся: для floating-сценария используется test-only field shell в фикстуре. Razor showcase, shared case catalog и трёхсторонние сравнения (M07/M08) не строились. Icon-система не мигрировала — извлечены ровно три глифа. Ни один пакет не публиковался.

### Ж.6. Доказательства

- 76 PHP-тестов / 386 ассертов: SSR DOM, native attrs и типы, adornments, слоты, действия, placement class/style, ownership-маркеры, escaping (кавычки, угловые скобки, амперсанд, attribute/tag injection, Unicode, переводы строк), no-JS контракт.
- 52 browser-ассерта на трёх реальных страницах: enhanced-взаимодействия, no-JS, mixed Vue/Razor ownership. Razor-контроллер не помечает ни один Vue-узел, не добавляет к нему контролов и оставляет его DOM без изменений; Vue-контрол сохраняет собственное поведение clear.
- Cross-language vectors: один JSON гоняют и shared-core (TypeScript), и `InputStateVectorsTest` (PHP).
- Packaged consumer: установка через Composer path repository, рендер VfInput из установленной копии, резолв обоих ассетов.
- Negative verification: generic-селектор контроллера, снятый ownership-маркер, изменённое PHP-правило filled, удалённый browser-ассет и откат fix'а `display:none` — каждый роняет соответствующий gate.
- Vue-сторона без регрессий: `baseline:inventory`, `baseline:css` (52 stylesheet побайтово), `baseline:input` (16/16 мутаций), `baseline:showcase`, `baseline:showcase:current` (24 captures, 256 cases, 0 отличий), core 431 тест.
- Визуально: у Razor- и Vue-инпутов совпадают computed-геометрия (420×36), фон, цвет рамки, radius, font-size, padding и боксы иконок.

### Ж.7. Ограничение

Это **operational and reference-informed** реализация, а не доказанная полная parity. Трёхстороннее сравнение reference Vue → extracted Vue → Razor принадлежит M07; сейчас сопоставлены отдельные представительные состояния и computed-стили, а не полный case-каталог.

## Приложение З. Результаты M07

M07 выполнен тремя focused commits. Vue-сторона не изменялась: `VfInput.vue`, public API, CSS output, tokens, showcase и версии пакетов остались прежними.

### З.1. Shared case catalog

`contracts/input/cases.json` — 45 case как plain data: базовые, все размеры, invalid/disabled/readonly/required, native-типы с passthrough-атрибутами, adornments и действия во всех комбинациях, field и floating-композиция, accessibility-связи, девять interaction-сценариев. Словарь — исторический Vue-контракт reference-коммита; каталог не вводит нового поведения. Case ID стабильные и иерархические (`input/clearable-filled`), пригодны для будущих showcase-ссылок M08.

`contracts/` защищён правилом boundary guard: только `.json` и `.md`. Спецификация, импортирующая один adapter, перестаёт описывать продукт.

### З.2. Модель parity

Три классификации, применяемые к 21 dimension:

- **exact** — структура, канонические классы, native-атрибуты, текст, aria, product-data, наличие и работоспособность действий, computed-геометрия и цвет, скриншоты, значение/тип/выделение/фокус после сценария, accessible name/role/states;
- **semantic** — конкретные значения сгенерированных id, порядок атрибутов, маркеры рендерера, транспорт событий;
- **framework-specific** — историческое поведение одного адаптера, которое второй не обязан повторять.

### З.3. Классификация исторических quirks

| Quirk | Классификация | Razor отличается |
| --- | --- | --- |
| Потеря consumer `style` на plain input | framework-specific | да |
| Clear-only: схлопывание wrapper, пересоздание input, потеря focus | framework-specific | да |
| `disabled="disabled"` не подавляет clear | framework-specific | да |
| Consumer `aria-invalid` перекрывает вычисленный | **exact** | нет |
| Password reveal переписывает каретку и направление | **exact** | нет |
| `data-vf-filled` в обеих ветках и связь с field | **exact** | нет |

### З.4. Результат

45 cases x 2 темы x 3 направления = **270 case-сравнений**, **216 сравнений скриншотов**, **0 failures**, **0 visual differences**. Направление reference Vue → current Vue чисто по всем dimension — именно оно не даёт последнему направлению пройти при том, что обе новые реализации ошибаются одинаково.

Одобренных расхождений — 224 вхождения из **трёх** причин, каждая узкая и адресная:

1. маркеры владения Razor (`data-vf-razor*`), без которых контроллер не смог бы ограничить себя своими поддеревьями;
2. wrapper, который Razor рендерит заранее при запрошенном действии, и остающийся инертный элемент действия;
3. inline-layout иконок, который Vue берёт из `<style scoped>`, недоступного другому рендереру.

### З.5. Findings M07

1. **Два реальных дефекта Razor, найденных гейтом.** Глиф действия отдавался assistive technology вместо того, чтобы прятаться за accessible name кнопки; consumer `aria-invalid` проигрывал вычисленному вместо того, чтобы выигрывать, как в Vue. Оба исправлены. Контроллер также перестал оставлять пустой атрибут `style`.
2. **Vue-scoped CSS иконок блокировал parity.** Adornment Razor измерялся в 18px против 16px у Vue, и все adorned-скриншоты отличались. Решено без правки Vue и без копирования правил: генератор нейтральных icon data читает эти декларации из собранного `packages/icons/dist/index.css` и переносит их в данные как inline style. Геометрия и visual остались строгими; зарегистрировано только расхождение атрибута `style` на элементах иконки. Перенос правил в общий stylesheet принадлежит milestone миграции icon-системы.
3. **Слишком широкий `pathPattern` — тоже риск.** Первая версия одобрения по подстроке `vf-icon` захватывала и `vf-icon-button`, пряча реальный дефект с пустым `style`. Одобрения сужены до `span.vf-icon-wrapper` и `svg.vf-icon`. Registry, который проще написать широко, — главная опасность parity-харнесса.
4. **Каретка после reveal никогда не сфокусированного контрола** различается: Vue ставит её в конец, Razor — в начало. Контракт — сохранение существующей каретки, и он соблюдается: case с явным `setSelection` проходит точно. Кейсы reveal/hide получили явную установку каретки, чтобы измерять контракт, а не побочное размещение фокуса.

### З.6. Negative verification

Каждая мутация вносилась временно и восстанавливалась:

| Класс | Мутация | Что упало |
| --- | --- | --- |
| DOM | убран модификатор класса adornment | `dom.canonicalClasses` |
| Semantic | native `type` нормализован в `text` | `dom.nativeAttributes` |
| Visual/CSS | изменён `padding` в каноническом `input.css` | `style.geometry` в направлении reference→current |
| Interaction | сломано обнуление значения в clear | `interaction.value`, `interaction.state` |
| A11y | изменён accessible name действия clear | `dom.aria`, `a11y.name` |
| Allowed divergence | удалено одобрение из policy | `dom.structure` |

### З.7. Ограничения

Матрица — desktop, две темы. Input не имеет собственного responsive-поведения, а ширина контейнера фиксирована харнессом, поэтому mobile-прогон добавил бы кадры без новой информации. Скриншоты обрезаны по корню case, а не по странице, поэтому сравнение адресное. Reference-цель собирается компилятором текущего дерева при источниках из immutable checkout: версии vite и plugin-vue идентичны по клонированному lockfile, поэтому различие в выводе может прийти только из источников.

## Приложение И. Результаты M07.1

M07.1 исправляет только correctness и reliability parity-инфраструктуры. M08 не начат, showcase Razor не создавался, другие компоненты не мигрировали. Production source Vue и Razor, публичные API, общий CSS, tokens и public package versions не изменены. Единственное изменение package manifest вне test tooling — форматирование уже существующего `packages/razor/composer.json`, чтобы tracked checkout проходил обязательный Prettier gate; значения не изменились. Финальный clean-clone verify обнаружил новый high advisory в dev-only цепочке `stylelint → table → ajv → fast-uri`; lockfile обновляет только транзитивный `fast-uri` с 3.1.5 до исправленного 3.1.7, иначе существующий `audit:release` останавливал CI до reference gates.

### И.1. Воспроизведение C1 до исправления

На отдельном checkout точного HEAD M07 `d900294f78bacc305cc6b891e2a51f5bf9546834` в реальный Razor DOM шести cases были внесены `name="CORRUPTED-NAME"`, `autocomplete="cc-number"`, `maxlength="3"` и `data-vf-audit="wrong"`.

Список оказался ровно таким, как в независимом аудите: `input/disabled`, `input/readonly`, `input/clearable-empty`, `input/interaction-disabled`, `input/interaction-readonly`, `input/interaction-wrapper-transition`. Старый gate ошибочно завершился успешно: 270 case comparisons, 216 visual comparisons, 0 failures, 0 visual differences, 224 approved divergences. Причина — wildcard-approval всего `dom.structure` для Razor, декоративный `scope` и немедленный `return` после несовпадения root tags.

### И.2. Comparator и divergence registry

`dom.structure` теперь вообще нельзя разрешить. Известная разница описана отдельными `dom.wrapperPresence` и `dom.inertAction`. Alignment знает только узкий VfInput-shape: bare `input.vf-input` против `div.vf-input-wrap`, у которого control обязан быть первым непосредственным ребёнком. Control сравнивается полностью через wrapper; attributes/classes/text самого wrapper, его дополнительные children и полное inert-action subtree тоже проверяются.

После неизвестного tag mismatch компаратор сообщает `dom.structure`, затем продолжает сравнивать attributes, classes, text и children. Прежний скрытый skip `wrapperClasses` заменён видимым `interaction.wrapperPresence` с policy entry. Поле `scope` удалено. `pathPattern` заменён exact `path`/`pathSelector`; selector сопоставляется только с целевым segment, а не подстрокой всего пути.

Каждое approval требует unique `id`, target Razor, finite directions, explicit distinct case IDs, exact detail, exact path или pathSelector, exact left/right values, reason, classification и positive expected occurrence count. Unknown fields, wildcard, approval для reference→current, `dom.structure`, неизвестные/dead cases и malformed entries запрещены. Dead `dom.frameworkMarkers` rule удалён: renderer markers отфильтровывает extractor и они честно записаны в `notCompared`.

Семь живых rules дали ровно 256 occurrences:

| Rule                                           | Dimension                     | Cases | Occurrences |
| ---------------------------------------------- | ----------------------------- | ----: | ----------: |
| `razor-wrapper-rendered-for-inert-action`      | `dom.wrapperPresence`         |     6 |          24 |
| `razor-wrapper-measured-role`                  | `dom.wrapperPresence`         |     6 |          24 |
| `razor-inert-clear-action`                     | `dom.inertAction`             |     7 |          28 |
| `razor-icon-wrapper-inline-layout`             | `dom.nativeAttributes/style`  |    15 |          84 |
| `razor-icon-svg-inline-layout`                 | `dom.nativeAttributes/style`  |    15 |          84 |
| `razor-keeps-focus-through-wrapper-transition` | `interaction.focus`           |     1 |           4 |
| `razor-wrapper-present-after-scenario`         | `interaction.wrapperPresence` |     2 |           8 |

Report сохраняет для каждого rule occurrence count, case IDs, dimensions, paths и directions. Zero-use и любое отклонение от expected count валят gate.

### И.3. Interaction visual backstop

Все десять interaction scenarios снимаются после выполнения в обеих темах и трёх targets: Reference Vue, Current Vue и Razor. Это 60 строгих post-interaction comparisons. Для wrapper-transition отдельно записывается natural reference→current frame, а трёхсторонний visual comparison выполняется после blur: historical focus ownership остаётся измеренным отдельной dimension, но blanket pixel waiver отсутствует.

Добавлен отдельный focus scenario. Clear выполняется реальной pointer sequence через CDP; report хранит trusted pointer/mouse/click trace и `mousedown.defaultPrevented`. Остальные сценарии сохраняют узкий M07 transport; полный переход на real keyboard/pointer остаётся M8 debt.

### И.4. Mutation regression harness

`parity:input:mutations` сначала требует clean PASS, затем проверяет 8 атак на policy, 15 in-memory capture mutations и 13 реальных browser mutations на свежих страницах. Mutation должна подтвердить применение; stale selector, отсутствующий target, browser error или падение build/test не считается detection. Для каждого defect требуется ожидаемая dimension во всех заявленных cases, themes и directions.

Реальные mutations покрывают audit corruption, неправильную вложенность wrapper/control, missing action, modifier class, aria-label и label relationship, сломанные clear/reveal, `visibility:hidden` и `display:none` glyph, padding/border, style на дочернем SVG path и current-only CSS isolation. Точная audit mutation после исправления даёт 96 failures: 72 `dom.nativeAttributes` и 24 `dom.productData`, по всем шести cases, двум темам и двум направлениям к Razor. Обе невидимые glyph mutations дают по 28 `visual.postInteraction` failures.

Существующий `baseline:input` теперь принимает detection только при explicit applied marker и завершённых failing Vitest assertions. Stale needle даёт `MUTATION_COULD_NOT_BE_APPLIED:STALE` и exit 1; отдельный self-test проходит через реальный driver и проверяет, что load/runtime/process failure не классифицируется как detection.

### И.5. CI и чистый результат

Оба checkout в CI используют `fetch-depth: 0`. Ранний preflight проверяет `git cat-file` и тот же `git archive`, который используют harnesses. Локальная CI-style проверка доказала fail в depth-1 clone и PASS после `--unshallow`.

Required `validate` job теперь реально достигает `baseline:inventory`, `baseline:test`, `baseline:input:self-test`, `baseline:input`, `baseline:css`, `parity:input` и `parity:input:mutations`; прежние boundary, icon, core/shared и Razor gates сохранены. Отдельный required showcase job сравнивает свежие reference/current captures на одном runner и публикует evidence, не переписывая recorded baseline другого окружения.

Чистый parity result: 51 cases, 306 case comparisons, 246 initial visual comparisons, 60 post-interaction visual comparisons, 2 дополнительных natural-focus comparisons, 0 failures, 0 visual differences, 256 approved divergences. Reference→Current остаётся zero-drift. Reference showcase и Current showcase: по 24 captures и 256 cases, 0 differences; CI same-runner showcase также 0 differences. Все 52 CSS artifacts побайтово совпадают с reference.

### И.6. Отложенные findings

H2 (Composer consumer использует локально собранный gitignored `dist`) и H3 (Razor assets читают generated theme/base CSS Vue package) не исправлялись: это distribution/token ownership, а не parity correctness. M4 (hand-written field fixture), M6, M8 (полный real pointer/keyboard rewrite) и M9/M10 (icon ownership/migration) также остаются отдельным debt. M07.1 не меняет их статус и не выдаёт field/icon fixtures за завершённую миграцию.

## Приложение К. Результаты M08

M08 добавляет реальный Razor showcase для `VfInput` и общий case/index, сохраняя Vue showcase. Другие компоненты не мигрировали, `VfField` не мигрировал, публикация не решалась. Production source Vue и Razor, публичные API, общий CSS, tokens и версии пакетов не изменены.

### К.1. Архитектура

Выбран вариант раздела 15 — **две native apps + plain shared example data**. Vue-примеры остаются обычными Vue-шаблонами, Razor-примеры — обычными Razor-шаблонами; ни один callback, slot или render-выражение не сериализован в JSON.

| Артефакт | Что это |
| --- | --- |
| `examples/shared/showcase-index.json` | Общий index: замороженный публичный каталог reference-коммита, per-platform support, URL-контракт (`component`, `case`, `theme`). Case data не копируется — только `caseSource` на `contracts/input/cases.json`. |
| `examples/playground` route `/input` | Vue showcase на реальных `@codemonster-ru/vueforge-core` компонентах, реальном stylesheet и theme provider. |
| `examples/razor-showcase` | Реальное PHP-приложение: Composer-установка адаптера, реальный `RazorEngine`, реальные `.razor.php` шаблоны, ассеты из `VueForgeRazorProvider::assetPath()`. |

`examples/shared` защищён тем же правилом boundary guard, что и `contracts/`: только `.json` и `.md`.

Vue-страница — **отдельный документ, а не седьмая секция shell**. Пункт навигации в `App.vue` изменил бы header на всех шести исторических routes, а они и есть замороженный showcase baseline. `baseline:showcase:current` по-прежнему даёт 24 captures, 256 cases, 0 отличий.

### К.2. Razor rendering path

Шаблон `views/partials/input-case.razor.php` называет каждый prop явно: у движка нет prop spread, а план требует explicit map для первого компонента вместо generic factory. Prop, связанный с `null`, ведёт себя ровно как опущенный, поэтому один список props покрывает весь каталог.

Тег `vf-input` повторён по одному разу на каждую комбинацию слотов. Движок собирает named slots **при компиляции шаблона**, поэтому slot внутри `@if` всё равно объявлен, и компонент отрендерил бы adornment, которого у case нет. Это контракт движка, а не дефект адаптера. `showcase:routes` требует, чтобы все четыре списка props оставались посимвольно одинаковыми.

`views/partials/field-shell.razor.php` — локальная композиция label/description/error, необходимая, чтобы field-cases вообще отображались. Это **не** мигрированный публичный Razor `VfField`; каталог на странице сообщает `VfField` как not implemented, миграция остаётся отдельным milestone.

### К.3. Coverage

51 shared case из `contracts/input/cases.json` на обеих платформах: plain, adorned, clearable, password reveal/hide, field/floating, все размеры, empty/filled, invalid, disabled, readonly, native-типы и attrs, Unicode/escaping, а также десять interaction-сценариев M07/M07.1 (typing, clear, reveal, hide, selection, focus, disabled, readonly, wrapper transition), которые в showcase можно выполнить руками. Обе темы, обе платформы.

Каталог показывает все 68 публичных компонентов. Razor implemented — только `VfInput`; остальные 67 остаются видимыми со статусом «Razor not implemented yet» и не считаются parity-supported. Фейковых реализаций нет.

### К.4. Full-route verification

`npm run showcase:routes` поднимает оба приложения так, как их запускает разработчик (`vite preview` над реальной сборкой, `php -S` над реальным front controller) и водит их в том же headless Chrome. Ни один capture не переиспользуется из parity-прогона.

55 assertions на 51 case × 2 темы × 2 платформы:

- обе платформы рендерят весь каталог в порядке каталога, каждый case — с реальным контролом; у Razor на каждый case есть ownership-маркер и его enhanced packaged controller;
- index совпадает с замороженным каталогом `baseline/reference-inventory.json`, implemented в Razor — только `VfInput`;
- каждая per-case ссылка ведёт на тот же case другой платформы; три из них реально открываются в обе стороны;
- адрес, которого нет в каталоге, даёт явный unknown-case на обеих платформах, а не молча выбранный default;
- Vue-страница не грузит ни одного Razor-ассета, Razor-страница — ни одного Vue build-ассета;
- четыре тега `vf-input` связывают одинаковые списки props.

### К.5. Adversarial проверки

| Атака | Ожидаемый детектор | Результат |
| --- | --- | --- |
| Компонент переименован в index | сверка с замороженным каталогом | FAIL |
| `VfField` помечен Razor-implemented | «only components with a real Razor adapter» + оба каталога | FAIL, 3 assertions |
| Razor не рендерит один shared case | набор/порядок cases, ownership-маркеры, ссылки | FAIL, 12 assertions |
| Vue-ссылка указывает на другой case | сверка ссылок + реальный переход по ссылке | FAIL, включая «selects it on Razor: input/plain-empty» |
| Списки props в ветках шаблона разъехались | статическая сверка тегов | FAIL |

### К.6. Что M08 не доказывает

Composer path repository установлен с `symlink: true`, поэтому showcase работает против рабочего дерева и локально собранного `packages/razor/dist`. Это dev-приложение, а **не** доказательство дистрибутивности: H2 (gitignored `dist` отсутствует в архиве пакета) и H3 (Razor-ассеты читают generated theme/base CSS Vue-пакета) не исправлялись и не скрыты — они описаны в README showcase. Публикация принадлежит M09.

M4 (рукописная field-фикстура), M6, M8 (частично синтетический interaction transport), M9/M10 (icon ownership) остаются прежним debt. N2/N3 (`blur-after-recording` и отсутствие пиксельного покрытия focus) не расширялись: full-route проверка не использует нормализацию focus вообще. N4 (стоимость точных approvals) не трогался — policy остаётся узкой.

## Приложение Л. Результаты M09

M09 закрывает H2 (дистрибутивность Composer-пакета) и H3 (зависимость Razor asset build от внутренностей Vue-пакета). Следующий компонент не мигрировал, `VfField` не реализован, публикации не было, версии пакетов не менялись.

### Л.1. H2 до исправления

Артефакт собран так, как его получил бы реальный потребитель — `git archive HEAD packages/razor`, то есть только tracked-файлы:

- 16 файлов, каталога `dist/` нет;
- реальная установка через Composer: `assetPath()` → `…/vendor/codemonster-ru/vueforge-razor/dist`, `dir exists: NO`, `css exists: NO`, `js exists: NO`.

Прежний `razor:consumer` этого не видел, потому что ставил рабочее дерево через path repository и находил gitignored `packages/razor/dist`, собранный локально минуту назад.

### Л.2. H2 — решение

Выбрана **модель B**: `dist` не коммитится, его создаёт release stage. `scripts/release/build-razor-package.mjs`:

1. берёт пакет из `git archive`, поэтому ничто untracked или устаревшее не может попасть внутрь;
2. собирает ассеты **прямо в staging** через новый `--out-dir`, поэтому старый локальный `dist` не может оказаться тем, что уедет потребителю;
3. выбрасывает `tests`, `phpunit.xml.dist`, `build-assets.mjs` и `browser`;
4. пишет provenance: commit, источник, четыре канонических источника стилей, версия esbuild, хэши артефактов — без единого абсолютного пути.

Результат: 12 файлов. Публикация обязана использовать этот артефакт: установка напрямую из VCS ассетов не несёт, и `check:razor-package` не даёт этому пройти незамеченным.

### Л.3. H3 до исправления

`packages/razor/build-assets.mjs` читал:

| Путь | Владелец |
| --- | --- |
| `packages/core/.generated/theme/tokens.css` | Vue adapter (артефакт сборки) |
| `packages/core/.generated/theme/theme.css` | Vue adapter (артефакт сборки) |
| `packages/core/src/styles/components/base.css` | Vue adapter (исходник) |
| `packages/styles/src/components/input.css` | нейтральный |

Ни одна из этих связей не была видна dependency guard: это строки, отданные файловой системе, а не import-специфиеры.

### Л.4. H3 — решение

**Foundation CSS.** `base.css`, `theme-transition-guard.css` и `accessibility-preferences.css` не содержат ничего Vue-специфичного. Перенесены дословно в `packages/styles/src/foundation/`; в core остались однострочные forwards, паттерн M04. Публичный экспорт `./base.css`, `components.css`, `foundation.css` и standalone dist-артефакт не изменились.

**Token CSS.** Единственным Vue-входом были значения preset. Это продуктовые токены, нужные каждому адаптеру, поэтому `default-preset-source.ts` и генератор переехали в `packages/theme`, который уже владел сериализатором и colour-schema. Файл сохранил внутрипакетный путь `src/theme/default-preset-source.ts`, поэтому provenance-комментарий, который генератор пишет в `tokens.css` и `theme.css`, остался буквально верным, а артефакты — побайтово прежними.

Публичный API theme не расширен: preset внутренний и не реэкспортируется из index — так же, как M03 поступил с colour-schema. Проверка полноты против `VfThemeTokens` осталась в core (`default-preset-contract.ts`), в пакете, который этот интерфейс публикует: пропущенный токен по-прежнему ошибка компиляции.

`npm run razor:assets` теперь сам генерирует токены и читает только `packages/theme`, `packages/styles`, `packages/shared-core`. Доказано сборкой ассетов при физически отсутствующих `packages/core` и `packages/layouts`: exit 0, четыре канонических источника, все нейтральные.

### Л.5. Boundary hardening

`scripts/ci/check-asset-boundary.mjs` смотрит **строковые литералы**, а не import-специфиеры, — там, где и живёт эта связанность. Он отличает путь, который файл читает, от комментария, объясняющего путь, который файл читал раньше, и от `$comment`-provenance в сгенерированном JSON. Дополнительно отвергает Composer-зависимость на Vue-адаптер, path repository в дистрибутивном манифесте и PHP `require`, выходящий за пределы пакета. 13 негативных тестов плюс живая проверка: возврат старого core-пути в `build-assets.mjs` роняет gate.

### Л.6. Adversarial проверки

| Атака | Детектор | Результат |
| --- | --- | --- |
| `packages/core` в Razor build | asset boundary | FAIL |
| Удалён packaged CSS | package content | FAIL |
| Удалён packaged JS | package content | FAIL |
| `assetPath` выходит за пределы пакета | packaged consumer | FAIL, 4 assertions |
| Пакет симлинкнут на рабочее дерево | packaged consumer isolation | FAIL |
| Испорчен устаревший локальный `dist` | staged artifact | не затронут |
| tests/build-script оставлены в артефакте | package content | FAIL, 12 problems |
| Мутация общего CSS текущего дерева | reference isolation | reference не изменился, current и parity падают |

### Л.7. Что M09 не меняет

Vue public API, Razor public API, product CSS, tokens, версии пакетов и `contracts/` — без изменений. Reference-коммит не тронут. M4 (рукописная field-композиция), M8 (частично синтетический interaction transport), M9/M10 (icon ownership) и N2/N3/N4 остаются прежним debt.

## Приложение М. Результаты M10

Второй мигрированный компонент — `VfIconButton` — и общее решение icon ownership. Публичный Vue API компонента не изменён; изменена только внутренняя деривация классов, вынесенная в shared-core.

### М.1. Характеризация до адаптера

28 тестов фиксируют исторический контракт: нативный `button`, порядок классов `vf-icon-button` → variant → size, отсутствие модификатора при `md`, размер глифа через токен, `aria-hidden` на глифе, прокидывание attrs, слияние consumer class, `type` по умолчанию `button`, недоступность при `disabled`.

Первый прогон мутационной матрицы дал **MISSED** на `icon-button-exposes-glyph-to-assistive-tech`: заглушка иконки сама печатала `aria-hidden="true"`, поэтому утверждение проходило независимо от компонента. Тест, который ничего не доказывал, нашла матрица, а не ревью. После исправления заглушки все 22 мутации (16 VfInput + 6 VfIconButton) детектируются.

### М.2. Icon ownership

Дефектов было два сразу. Геометрия поставлялась адаптеру трёхглифовым blob, извлечённым генератором с именем компонента: миграция второго компонента означала бы ручное извлечение новых глифов. Layout существовал дважды — как `<style scoped>` в Vue-компоненте иконки и как inline-`style`, который PHP-рендерер впечатывал в разметку, потому что scoped-селектор не может совпасть с DOM Razor.

**Layout.** `packages/styles/src/components/icon.css` — единственный рукописный владелец; `icon.vue` форвардит на него через `<style scoped src>` (паттерн M04), таблица Razor перечисляет тот же файл. Рендерер больше не пишет ни одной декларации layout в разметку.

**Геометрия.** `generate-icon-registry.mjs` рендерит **все 116** опубликованных глифов в `icon-registry.json` — две побайтово идентичные копии, каноническая и дистрибутивная. Следующему компоненту иконки уже доступны.

**Vue по существу не изменился.** Правила собранного CSS побайтово прежние; изменился только content-derived scope id `6afb6507 → 21ef3ee2`, потому что изменился текст SFC. Vue переписывает вместе и `@keyframes vf-icon-spin-<hash>`, и указывающий на него `animation-name`, так что каждая сторона самосогласована; вне сгенерированного файла хэш не называет никто. 24 showcase-захвата по 256 кейсам совпадают с reference.

**Gate, который этого не проверял.** `baseline:css` собирал только `packages/core` — то есть центральное изменение milestone было вне артефактного контроля. Теперь он собирает каждый покрытый пакет (53 таблицы, 2 пакета) и отдельно печатает scope-id переименования, вместо того чтобы их прятать. Нормализуются только те id, которые файл действительно объявляет: общее правило `-[0-9a-f]{8}` переписывало бы и класс, случайно оканчивающийся на восемь hex-символов.

### М.3. Общие правила вместо второй деривации

У `VfIconButton` нет состояния, поэтому извлекать нечего — кроме двух дериваций, которые иначе PHP восстанавливал бы по тем же пропсам. `resolveIconButtonClasses` и `resolveIconButtonIconSize` живут в shared-core; PHP-зеркало `IconButtonState` прогоняет тот же вектор-файл. Сетка variant × size перечислена полностью (27 строк плюс недокументированные значения): выборочная сетка — это способ, которым выживает один неверный модификатор.

Три мутации классов и размера теперь инжектируются в общее правило, а не в SFC: дефект там обязан быть пойман через любой адаптер, который его потребляет.

### М.4. Razor

`vf-icon-button` зарегистрирован в реальном провайдере; сборка разметки — в `Support/IconButton`, потому что вызывающих двое. Второй — сам `VfInput`: его `actionButton()` собирал собственную разметку, лишь повторявшую те же имена классов, поэтому изменение icon button доходило до тега и не доходило до действий. Теперь оба зовут один рендерер, и three-way parity VfInput проходит без изменений — это и есть доказательство, что подстановка не изменила ни одного байта, видимого браузеру.

113 PHP-тестов. Из шести инжектированных дефектов пять пойманы; шестой — снятие `Html::escape` — нет, и `IconRendererTest` говорит об этом в заголовке: все экранируемые значения генерируются в реестр, а единственный вход от потребителя (имя глифа) отвергается, если не именует запись реестра. Поэтому инвариант утверждается напрямую: ни одно значение реестра не требует экранирования, все 116 глифов рендерятся одной корректной иконкой без inline-layout, нераспознанный размер сворачивается в фиксированный токен.

### М.5. Parity: один компаратор, второй компонент

Harness параметризован профилем, который едет на каталоге. Экстрактор, компаратор, движок политики и мутационный драйвер — в одном экземпляре. Прогон VfInput побайтово прежний: 51 кейс, 306 сравнений, пять approvals.

`VfIconButton` — **29 кейсов, 174 сравнения кейсов, 174 скриншота, 30 post-interaction скриншотов, ноль approved divergences** по трём направлениям. Enter и Space дают настоящий `click` на всех трёх целях; disabled-кнопка инертна на всех трёх.

Сборка второго компонента на этом harness нашла три дефекта, каждый из которых делал зелёный gate менее значимым, чем он выглядел:

| Дефект | Что он скрывал |
| --- | --- |
| `compareInteraction` сравнивал фиксированный список полей VfInput | `activations`, `pressed`, `accessibleName` попадали в отчёт и не сравнивались: Razor-кнопка, не срабатывающая на Enter, прошла бы gate с доказательством в артефакте |
| `readAccessibility` жёстко знал селекторы VfInput | для любого другого компонента ни один узел не совпадал, a11y-измерения сравнивали пустоту и рапортовали успех |
| `settle` ждал `requestAnimationFrame` | нажатие Enter на уже сфокусированной кнопке ничего не перерисовывает, кадра нет, callback не вызывается — прогон висел до таймаута DevTools |

Сравнение полей snapshot теперь исчерпывающее, а поле, которое не сравнивается и не объявлено игнорируемым, роняет прогон.

Негативная фикстура icon button — 27 мутаций: 18 по захвату, 5 реальных DOM/CSS в браузере, 4 попытки протащить approval в политику, где approvals нет. Две мутации при написании были неверны (снимала variant, которого у кейса нет; использовала `parity-`-класс, отбрасываемый экстрактором) — harness отказался засчитать их как детекции.

### М.6. Showcase и дистрибуция

Vue-маршрут `/icon-button`; Razor — тот же front controller с параметром `component` из общего URL-контракта, список компонентов выводится из shared index, неизвестный компонент даёт 404. 103 assertions. Отдельный gate закрывает ловушку, на которую я наступил: `composer install` поверх path-репозитория сохраняет уже лежащую в `vendor/` копию, поэтому showcase молча отдавал прежний адаптер.

Артефакт везёт компонент, его хелпер и PHP-зеркало; изолированный consumer рендерит оба компонента и берёт глиф, который не нужен ни одному кейсу VfInput. Проверка provenance перестала считать источники таблиц и начала сверять список с тем, что объявляет сборщик.

### М.7. Adversarial проверки

| Атака | Детектор | Результат |
| --- | --- | --- |
| Заглушка иконки сама печатает `aria-hidden` | characterization mutations | **MISSED** → тест исправлен |
| `place-items` изменён в каноническом icon.css | baseline:css (расширен) | FAIL |
| 6 дефектов в Razor icon button | PHPUnit | 5 FAIL, 1 недостижим → инвариант утверждён напрямую |
| 5 регрессий icon ownership | icon-ownership test | все FAIL |
| `packages/icons` в списке таблиц Razor | asset boundary | **MISSED** → сканер исправлен → FAIL |
| То же через PHP-файл | asset boundary | FAIL |
| Геометрия глифа изменена без регенерации | check:icon-data | FAIL на обеих копиях |
| Компонент убран из провайдера | PHPUnit | 29 failures |
| Каталог кейсов урезан (4 кейса и 1 кейс) | **ничто** → добавлен case-coverage | FAIL после добавления |
| Общее TS-правило сломано | parity | 76 различий; `reference-vs-razor` = 0, потому что Razor читает PHP-зеркало |
| Оба зеркала сломаны одинаково | shared vectors | TS 20 + PHP 2 failures |
| 27 parity-мутаций icon button | parity mutations | все пойманы |
| 36 parity-мутаций VfInput | parity mutations | все пойманы |

### М.8. Дефект в самом boundary guard

Две атаки прошли, и обе — из-за того, **как** gate читает исходники, а не из-за того, что он проверяет.

`extractRepositoryPaths` определял строковый литерал спариванием кавычек. Один апостроф в прозе — `the artifact's provenance` — спаривается с открывающей кавычкой следующего настоящего литерала, и всё после него попадает в промежутки между фиктивными «литералами». Это было живым: `packages/razor/style-sources.mjs` начинается именно с такого комментария, и запрещённый путь `packages/icons`, вставленный пятью строками ниже, был отрапортован как чистый проход. Комментарий с апострофом есть в восьми из девятнадцати охраняемых файлов; при добавлении этого файла gate тихо просел с шести нейтральных рёбер до трёх и оба раза печатал OK.

Исходник теперь обходится один раз с отслеживанием комментариев и строк. Из этого вышли ещё две формы: регулярное выражение с кавычками (в сборщике ассетов — матчер `@import`) открывало строку, которая никогда не закрывалась; в PHP `#` начинает комментарий — кроме `#[`, атрибута, литералы которого важны. Три вещи делают его fail-closed: незакрытая строка — отрапортованное нарушение, а не результат; запрещённый пакет, названный в коде вне литерала, тоже нарушение; семь тестов фиксируют формы, включая то, что проза о пути, который пакет читал раньше, зависимостью по-прежнему не считается.

### М.9. Эрозия покрытия

Любое утверждение о parity здесь — «три цели совпадают на каждом общем кейсе», и оно ничего не значит, если кейсы можно удалить. Удаление четырёх кейсов оставляет оба showcase рендерящими один и тот же укороченный список, parity сравнивает меньше и проходит, все остальные gates зелёные. У VfInput было случайное частичное прикрытие — реестр расхождений называет шесть case id; у `VfIconButton` approvals нет вовсе, поэтому самый сильный результат в репозитории был и наименее защищённым.

Добавлен guard: полная сетка variant/size включая незаданный default, контракт прокидываемых атрибутов, реальная активация указателем, Enter и Space, реально управляемая disabled-кнопка, глифы вне тройки VfInput. Счётчики кейсов — нижние границы, поэтому добавление кейсов бесплатно, а удаление требует правки рядом с утверждением о покрытии, которое оно ломает.

### М.10. Что M10 не меняет

Исторический Vue API `VfIconButton`, публичный API `packages/icons`, product CSS, токены, версии пакетов и reference-коммит — без изменений. `VfField`, `VfButton` и остальной каталог не мигрированы. Долг M9/M10 (icon ownership) из приложения Л закрыт; M4, M8 и N2/N3/N4 остаются.

## Приложение Н. Результаты M10.1

Corrective milestone: три слепые зоны инфраструктуры, найденные независимым re-audit M10, до начала `VfField`. Ни один компонент не мигрирован; под `packages/` не изменён ни один файл.

### Н.1. H1 — покрытие enabled Enter не было зафиксировано

Guard из M10 утверждал, что *какой-то* кейс нажимает Enter:

```js
assert.ok(keys.has('Enter'), 'no shared case activates the button with Enter');
```

`icon-button/interaction-disabled-keyboard` нажимает Enter — и доказывает при этом ровно обратное: disabled-кнопка **не** срабатывает. Поэтому удаление `icon-button/interaction-enter` оставляло утверждение зелёным: каталог по-прежнему содержал нажатие Enter, он лишь больше не содержал самого утверждения.

Воспроизведено до исправления. Удаление enabled-Enter кейса ловил **только** счётчик кейсов (29 → 28), а три тривиальных padding-кейса возвращали счётчик выше границы:

| Атака | Semantic detector | Count floor | Итог |
| --- | --- | --- | --- |
| Удалить enabled Enter | PASS (не сработал) | FAIL (28 < 29) | поймано не тем детектором |
| Удалить enabled Enter + 3 padding | PASS (не сработал) | PASS (31 ≥ 29) | **тихий проход, все 7 тестов зелёные** |

### Н.2. H1 — семантическая модель покрытия

Покрытие читается как три вещи вместе: **операбелен ли контрол, что было отработано, какой исход заявлен**. Исход — новое поле `expect.activates` на пяти interaction-кейсах icon button.

Поле не принимается на веру. `run.mjs` сверяет его со счётчиком активаций, который `driveInteraction` пишет по настоящим pointer/key событиям, на всех трёх целях и в обеих темах. Заявленные исходы подтверждены измерением: enter/space/pointer-click — по 1 активации в каждом из 6 захватов, disabled-keyboard и focus — по 0.

Проверка гейтится на немутированные захваты: `browser-icon-button-not-clickable` ломает активацию намеренно, и ловить это обязан компаратор, а не assertion внутри capture.

Правила вынесены в `scripts/ci/case-coverage.mjs` и возвращают список нарушений, а не ассертят: тест может прогнать их по намеренно испорченному каталогу и проверить, **какое именно** правило сработало. Счётчик кейсов остаётся, но как вторичная защита — ни одна из атак ниже не утверждает на нём.

### Н.3. H1 — adversarial проверки

| Атака | Ожидание | Результат | Сработавшее правило |
| --- | --- | --- | --- |
| A. Удалить enabled Enter | FAIL | FAIL | `no shared case proves that Enter activates an enabled button` |
| B. Удалить enabled Enter + 3 padding (счётчик выше границы) | FAIL | FAIL | то же — **не** счётчик |
| C. Заменить enabled Enter на disabled Enter | FAIL | FAIL | то же |
| D. Снять/инвертировать заявленный исход | FAIL | FAIL | `declares no expected activation outcome` + отсутствие Enter-покрытия |
| E. Удалить disabled-keyboard негатив | FAIL | FAIL | `no shared case proves that a disabled button refuses keyboard activation` |
| F. Удалить enabled Space | FAIL | FAIL | `no shared case proves that Space activates an enabled button` |
| G. Чистый каталог | PASS | PASS | — |
| Padding заявляет исход, ничего не отрабатывая | FAIL | FAIL | `claims it activates but drives no activating input` |
| Disabled-кейс объявляет себя активирующим | FAIL | FAIL | `is disabled but claims it activates` |
| Каталог лжёт об исходе (enabled Enter: `activates: false`) | FAIL | FAIL | parity: `expects no activation, but the button recorded 1` |

Повтор атаки B на живом guard после исправления: semantic-тест **FAIL**, count floor **PASS**. Это и требовалось — детектор сработал по смыслу, а не по числу.

### Н.4. M1 — незакрытый блочный комментарий

`scanSource` обходил блочный комментарий циклом, который останавливался на конце ввода и затем продолжал так, будто нашёл закрывающий разделитель:

```js
while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) index += 1;
index += 2;
```

Незакрытый `/*` съедал остаток файла и всё равно возвращал `unterminated: false`. Всё ниже переставало быть и литералом, и кодом, поэтому запрещённый путь там не рапортовал никто — включая проверку «запрещённый пакет вне литерала», добавленную в M10. Это та же fail-open форма, которую M10 чинил для апострофов, и она её отменяла: комментарий одновременно незакрытый и с апострофом сканировался чисто.

До исправления: `unterminated: false`, `literals: []`, `paths: []`, и полный анализатор на `packages/razor/build-assets.mjs` с `packages/icons/dist/x.css` внутри — **0 нарушений**.

После: потеря синхронизации рапортуется так же, как незакрытая строка или regex; сообщение называет все три формы.

**Живая проверка.** Запрещённый путь `packages/icons`, вставленный после незакрытого комментария в реальный `packages/razor/build-assets.mjs`: gate завершается кодом 1 с `could not be scanned`. До исправления тот же файл давал OK. Источник восстановлен.

### Н.5. M1 — adversarial проверки

| Атака | Ожидание | Результат |
| --- | --- | --- |
| A. Незакрытый комментарий перед запрещённым литералом | fail closed | FAIL |
| B. Незакрытый комментарий с апострофом | fail closed | FAIL |
| C. Закрытый комментарий с запрещённой прозой | нет false positive | PASS |
| D. Закрытый комментарий, затем реальный запрещённый литерал | поймать литерал | FAIL по `packages/icons` |
| E. Комментарий с апострофами, кавычками и слэшем | сканер синхронен | PASS, литерал извлечён |
| F. Незакрытые строка/шаблон/regex | без изменений | 23 прежних теста зелёные |

Качество мутации: при откате исправления падают ровно два новых теста (A и B), остальные три проходят и до, и после — они фиксируют неизменённое поведение.

### Н.6. L2 — обнаружение геометрии по содержимому

Guard сопоставлял `/icon.*data.*\.json/i` вне `packages/icons`, то есть реально запрещал **называть** файл `icon-data.json`. Рукописный blob `field-glyphs.json` с path-геометрией, положенный в `packages/razor/resources/icons/`, проходил чисто — это и есть удалённый в M10 per-component blob под другим именем.

Теперь владение решается тем, **что** файл содержит и **где** он лежит. JSON с SVG-геометрией — элементы отрисовки в сериализованном body либо path-данные под `d`/`body`/`path` — принадлежит либо `packages/icons`, либо одному из двух генерируемых реестров; approved-назначение обязано дополнительно называть `generate-icon-registry.mjs` своим генератором, поэтому рукописный blob под именем и в каталоге реестра тоже не проходит. Provenance переиспользован, а не изобретён: генератор уже штампует `$comment`, а содержимое копий держат побайтовое сравнение и `check:icon-data`.

Детектор намеренно ограничен структурированными данными. Inline SVG в компоненте, который рисует собственную графику (`VfProgressSpinner`, `VfAdminLayout`), — не реестр иконок, и его отлов сделал бы guard неприменимым.

Ложных срабатываний нет ни на одном из 111 tracked JSON. В частности, `contracts/input/parity-policy.json` несёт `viewBox` в DOM-снимке approved divergence, но не несёт геометрии, — поэтому он не требует записи в allowlist.

### Н.7. L2 — adversarial проверки

| Атака | Ожидание | Результат |
| --- | --- | --- |
| A. `razor/resources/icons/field-glyphs.json` с рукописным SVG body | FAIL | FAIL, `carries icon geometry (svg-body)` |
| B. `input-actions.json`, имя без `icon-data` | FAIL | FAIL, то же |
| C. Сгенерированные реестры в approved-назначениях | PASS | PASS |
| D. Метаданные: только имена иконок, без геометрии | PASS | PASS |
| E. Манифест визуальных снимков без геометрии | PASS | PASS |
| F. `"path"` в смысле пути файловой системы | PASS | PASS |
| Сырые path-данные без SVG-разметки | FAIL | FAIL, `path-data` |
| Approved-путь без provenance генератора | FAIL | FAIL |

Повтор исходного payload после исправления: тот же файл в том же месте отвергнут с указанием, что делать.

### Н.8. I4 — глиф в дереве доступности

Профиль доступности icon button запрашивал только `.vf-icon-button`. Утечка глифа ловилась через `dom.aria` и `interaction.state`, но ни одно `a11y.*` измерение её не мерило: незаписанная роль не запрашивается вовсе.

Глиф добавлен как измеряемая роль. Он `aria-hidden`, то есть ignored-узел и отсутствует в дереве на всех целях; запись — это то, что превращает «icon button не выставляет свой глиф» из непроверяемого заявления в сравнение, которое отрапортует утечку как exposed on one side only.

Новая мутация `icon-button-exposes-its-decorative-glyph` детектируется по `a11y.role` (4 failures) и предварительно утверждает, что глиф отсутствовал, — иначе она возмущала бы пустоту. Parity держится с нулём approved divergences.

### Н.9. Что M10.1 не меняет

Под `packages/` не изменён **ни один файл**: Vue и Razor API `VfIconButton`, поведение `VfInput`, product CSS, токены, геометрия иконок, showcase и версии пакетов — без изменений. В `package.json` изменена одна строка scripts. Reference-коммит не тронут. `VfField` и `VfButton` не мигрированы.

Остаётся прежний долг: M4, M8, N2/N3/N4, focus-only кейс L3, старый inline hamburger I1 и L1 — намеренное уклонение конкатенацией литералов (`'packages/ic' + 'ons/...'`). L1 сознательно не закрывается: M10.1 требует fail-closed поведения при потере синхронизации сканером, а не полного парсера JS/PHP. Вне области детектора L2 остаются не-JSON носители геометрии (`.ts`, `.vue`); их отлов дал бы ложные срабатывания на компонентах, рисующих собственную графику.
