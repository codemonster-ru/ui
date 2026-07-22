# VueForge: полный аудит Design System и инженерная доводка Phase 3

Дата подготовки: 2026-07-22. Статус: **Phase 3 завершена; root-wide verification, package publication
dry-run и Chromium visual smoke пройдены**.

Все автоматизируемые repository gates на финальном worktree закрыты. Отдельно отмеченные проверки
Firefox/WebKit, native Windows High Contrast, native multi-engine browser zoom и assistive technologies
не настроены в текущем repository и честно оставлены как post-RC platform certification, а не
обозначены как выполненные.

## 1. Executive summary

Phase 3 проверила VueForge как единый публичный продукт, а не как набор изолированных Vue-компонентов.
Аудит охватил public API, component contracts, CSS delivery, non-color tokens, typography, layouts,
motion, accessibility, responsive/RTL behavior, performance, documentation, tests, SSR/hydration,
browser constraints и developer experience во всех публикуемых пакетах.

Исходная система уже имела сильную основу после Phase 0–2: canonical theme contract, совпадающие
runtime/static token maps, component-entry CSS, OKLCH semantic color system, package consumer smokes и
широкое unit-покрытие. Однако перед публичным релизом оставались не косметические, а наблюдаемые
дефекты на границах подсистем:

- request-unstable SSR ids и несколько hydration mismatch сценариев;
- независимые Escape/focus/scroll handlers у вложенных overlays;
- некорректные или незавершённые ARIA relationships;
- расхождение runtime и TypeScript default export у Layouts component subpaths;
- SSR-небезопасный CommonJS entry Icons;
- неработающий tree shaking plugin singleton и превышение начального demo budget;
- неполная валидация iframe transport и бесконечная рекурсия circular imports в Playground;
- отсутствие общего reduced-motion/forced-colors contract и частичный RTL;
- документация, в нескольких местах описывавшая API, которого фактически не было.

В Phase 3 исправлены только дефекты с объективным влиянием на correctness, accessibility, SSR,
performance, package DX или browser behavior. Массовой унификации props, DOM-перестройки, нового
polymorphic trigger API, универсальной i18n-системы и других спорных архитектурных изменений не было.

Цветовая архитектура Phase 2 не пересматривалась. Primitive/semantic palette values, их role mapping и
имена публичных color tokens не изменены. Единственное изменение theme preset относится к stacking:
`dropdown`, `popover` и `tooltip` подняты над modal/drawer layer. OKLCH literals, добавленные в CodeBlock,
являются standalone fallback тех же Phase 2 values, а не новой палитрой.

Итоговый вывод: по архитектуре и инженерной дисциплине VueForge соответствует зрелой публичной
UI-библиотеке и готова как engineering release candidate. Полная GA platform certification остаётся
отдельной задачей: unit-тесты и Chromium smoke не заменяют проверку реальных assistive technologies,
Firefox/WebKit layout engines, native Windows High Contrast и native multi-engine zoom 200%/400%.

## 2. Архитектурная оценка библиотеки

### Карта системы

```text
@codemonster-ru/vueforge-theme
  canonical theme types/runtime
              │
              ▼
@codemonster-ru/vueforge-core ───────► @codemonster-ru/vueforge-layouts
  components, providers,                layout primitives and shells
  composables, CSS artifacts
              │
              ├──────────────────────► @codemonster-ru/vueforge-codeblock
              │                          Shiki + standalone view entry
              │
              └──────────────────────► @codemonster-ru/vueforge-playground
                                         UI adapter
@codemonster-ru/vueforge-playground-core ─┘
  sandbox/runtime transport

@codemonster-ru/vueforge-playground-vite-plugin
  build-time virtual modules

@codemonster-ru/vueforge-icons
  independent ESM/CJS/UMD icon delivery
```

### Сильные стороны

- Пакеты разделены по ответственности; browser sandbox runtime не смешан с Playground UI.
- Theme package остаётся canonical contract, а Core владеет preset/schema и CSS artifact generation.
- Core и Layouts предоставляют root entry, granular component subpaths и explicit CSS entries.
- CSS artifacts проверяются не только как source files, но и как содержимое собранного/упакованного
  consumer surface.
- Public types в основном выводятся из реальных Vue SFC declarations, а не поддерживаются вручную в
  параллельной модели.
- SSR, hydration, package exports, no-`dist` tests и consumer installation рассматриваются как release
  contracts, а не как локальные implementation details.
- Phase 0–2 создали устойчивую color/token основу; в Phase 3 объективных причин менять её не найдено.

### Архитектурные риски, обнаруженные аудитом

Главный повторяющийся риск находился на границах: source и packed package, server и browser, modal и
teleported child, internal tab и external tabpanel, full CSS и component entry. Внутри отдельных
компонентов код обычно был предсказуем, но независимые локальные composables не знали о глобальном
overlay stack, а package metadata иногда не соответствовала runtime artifact.

Phase 3 не ввела новый framework поверх существующей архитектуры. Вместо этого границы получили
явные contracts: active overlay arbitration, request-stable ids, packed declaration wrappers, static
import budgets, iframe message validation и CSS parity assertions.

### Оценка слоёв Design System

| Слой | Оценка после изменений | Обоснование |
| --- | --- | --- |
| Theme/tokens | Зрелый | Canonical schema, runtime/static parity и Phase 2 contrast contract сохранены; stacking contract исправлен точечно. |
| Core components | Зрелый с отдельными v2-кандидатами | API широк и покрыт тестами; overlay, form и ARIA defects исправлены без смены component model. |
| CSS delivery | Зрелый | Full, manual и auto/component-entry artifacts проверяются; accessibility preferences включены в granular artifacts. |
| Layouts | Зрелый после исправлений | Controlled state, grid grammar, full/component CSS parity и subpath declarations приведены к одному contract. |
| CodeBlock | Зрелый | Standalone CSS, SSR highlight hydration, touch behavior и public helper types закрыты package tests. |
| Playground | Зрелый runtime, UI требует дальнейшей code-splitting ясности | Transport/cycles/hydration/ARIA исправлены; отдельный гарантированно lazy public entry остаётся рекомендацией. |
| Icons | Зрелый | ESM auto-CSS сохранён, SSR-safe CJS и explicit style export проверены packed consumer smoke. |
| Release automation | Существенно усилена | CI запускает repository `verify`; добавлены tree-shaking и initial graph budgets, но visual/AT matrix остаётся вне CI. |

## 3. Найденные проблемы

Приоритеты в таблице означают: **blocker** — реальный риск некорректного public release; **high** —
существенный correctness/a11y/DX defect; **medium** — локальная consistency/browser проблема. Статус
`исправлено` означает наличие реализации, regression contract и успешного финального root-wide прогона,
зафиксированного в разделе 12.

| Приоритет | Область | Наблюдаемый дефект до Phase 3 | Статус |
| --- | --- | --- | --- |
| Blocker | SSR ids | `useId` использовал module-global counter: последовательность зависела от прошлых requests и могла расходиться при hydration. | Исправлено |
| Blocker | Theme hydration | Provider читал storage/media во время browser setup, тогда как server использовал fallback; first render не был детерминирован. | Исправлено |
| Blocker | Playground hydration | Module-level `typeof window` делал server/client preview branches различными до mount. | Исправлено |
| Blocker | CodeBlock hydration | Server мог отдать Shiki HTML, а client начинал с plaintext и заменял server DOM с hydration warning. | Исправлено |
| Blocker | Overlay coordination | Каждый overlay слушал Escape и Tab независимо; один Escape мог закрыть несколько уровней, а несколько focus traps конкурировали. | Исправлено |
| Blocker | Scroll locking | Два modal owners перезаписывали body styles и первый unlock мог снять lock второго. | Исправлено |
| Blocker | Layouts package types | Component subpath runtime default экспортировал компонент, но `types` указывал на root declaration с plugin default. | Исправлено |
| Blocker | Icons CommonJS/SSR | `main` указывал на UMD artifact с CSS DOM injection; `require()` нуждался в искусственном `document`. | Исправлено |
| Blocker | Icons clean publication | Clean `npm pack` не строил отсутствующий `dist`, поэтому tarball мог не содержать заявленные CJS/CSS/declaration artifacts. | Исправлено |
| Blocker | Tree shaking | Неаннотированный вызов plugin factory удерживал theme/application runtime при импорте одного компонента. | Исправлено |
| Blocker | Demo budget | Initial demo entry был 95.90 KiB gzip при contract 95.00 KiB из-за ненужной глобальной установки Playground plugin. | Исправлено |
| Blocker | Playground imports | Direct/indirect circular imports уходили в рекурсию вместо структурированной runtime error. | Исправлено |
| High | Playground transport | `postMessage` принимался по marker без проверки `event.source` и runtime payload shape. | Исправлено |
| High | Playground memory | Console history и длина одной записи не имели верхней границы. | Исправлено |
| High | Dialog/Drawer semantics | Custom header/description slots могли оставить dangling `aria-labelledby`/`aria-describedby`; явный label не попадал на role node. | Исправлено |
| High | Tabs/Playground | `VfTabs` всегда объявлял `aria-controls`, даже если panel не существовал; Playground external panels не имели стабильных двусторонних IDREF. | Исправлено |
| High | Command Palette | Search input не имел полного combobox contract и `aria-activedescendant`; status changes не объявлялись live region. | Исправлено |
| High | Select | Keyboard navigation индексировала disabled options, а disabled Select продолжал отправлять hidden form input. | Исправлено |
| High | SkeletonGate | Визуально скрытый content оставался focusable и interactive во время loading state. | Исправлено |
| High | ThemeSwitch | Switch без visual label не имел accessible name по умолчанию. | Исправлено |
| High | AppShell state | Controlled `sidebarCollapsed` мутировался локально и `update` emit происходил при initial render. | Исправлено |
| High | AppShell CSS | Component entry содержал невалидный area `grid-template` shorthand и расходился с full stylesheet. | Исправлено |
| High | Browser preferences | Не было общего forced-colors и reduced-motion contract во всех Core component artifacts. | Исправлено |
| High | Command Palette zoom | `85vh` max-height не учитывал top offset и нижний viewport padding; при эффективном 400% zoom content выходил за viewport. | Исправлено |
| High | Overlay stacking | Dropdown/popover/tooltip layers `900/925/950` оказывались под modal/drawer layer `1000`, включая teleported descendants. | Исправлено |
| High | CodeBlock standalone | Token entry ссылался на Core variables без terminal fallbacks; standalone dark root мог проигрывать по specificity. | Исправлено |
| High | CI | Workflow запускал неполный поднабор проверок и не защищал tree shaking. | Исправлено |
| High | Documentation | Core plugin, CodeBlock helpers/types, Layouts exports/props и Playground props/resolver были описаны неточно или неполно. | Исправлено |
| Medium | Public typings | Несколько реально публичных composable option types и component unions отсутствовали в root exports. | Исправлено |
| Medium | Naming | Vite plugin публиковал типы с `Vueforge` вместо product spelling `VueForge`. | Исправлено совместимыми aliases |
| Medium | RTL | Switch geometry, menu keyboard direction и несколько physical CSS properties не зеркалировались. | Исправлено в подтверждённых компонентах |
| Medium | Motion | Button/IconButton/Input/Select/Textarea использовали разные literal durations/easing вместо motion tokens. | Исправлено |
| Medium | Touch | CodeBlock copy action был рассчитан на hover и мог оставаться скрытым на coarse pointer. | Исправлено |
| Medium | Peer contract | Layouts, CodeBlock и Playground объявляли Vue 3.4, хотя фактическая dependency graph и новые SSR contracts требуют Vue 3.5. | Исправлено до `^3.5.0` |
| Medium | Clean consumer tests | No-`dist` script скрывал только часть workspace artifacts, поэтому некоторые tests могли случайно читать stale build. | Исправлено |
| Medium | Generated CSS race | Параллельные Core workers писали один generated stylesheet напрямую; другой worker мог прочитать частично записанный CSS. | Исправлено |
| Medium | Showcase zoom | No-wrap typography fixture создавал 81 px document-level horizontal scroll при эффективном 400% zoom. | Исправлено |

Аудит также выявил архитектурные возможности, которые не следует внедрять точечным patch перед релизом.
Они перечислены в разделе 6 и не маскируются как «исправленные».

## 4. Исправленные проблемы

### Core runtime, SSR и overlays

- `useId` переведён на Vue 3.5 `useId`; consumer-provided id по-прежнему имеет приоритет. Два
  независимых SSR renders теперь получают одинаковую request-local последовательность.
- `VfThemeProvider` начинает server и first client render с одинакового configured mode. Storage,
  DOM attributes и `matchMedia` читаются после mount; blocked storage и отсутствующий/ошибочный
  `matchMedia` обрабатываются без падения.
- `useBreakpoint` создаёт media query только после mount и безопасно возвращает initial `false` для SSR.
- `useEscapeKey` использует active stack для `keydown` и `keyup`; событие получает только последний
  активированный handler, а `defaultPrevented` соблюдается.
- `useFocusTrap` координирует единственный topmost trap. Select, Dropdown, Popover и MenuBar
  регистрируют teleported focus branches, поэтому они остаются частью active modal scope.
- `useScrollLock` использует owner count на конкретный `HTMLElement`, сохраняет исходные inline styles и
  корректно работает при non-LIFO unmount. `VfDrawer scrollLockTarget=false` теперь действительно
  отключает lock.

Regression coverage: request-stable SSR ids, nested Escape LIFO, topmost/teleported focus scope,
concurrent scroll owners, ThemeProvider hydration и browser API failure paths.

### Component semantics и keyboard behavior

- Dialog получил additive `ariaLabel`, `ariaLabelledby`, `ariaDescribedby`; Drawer — `ariaLabel` и
  `ariaLabelledby`. Generated ids теперь физически оборачивают custom slot content, а explicit label
  имеет предсказуемый приоритет.
- `VfTabs` больше не создаёт dangling `aria-controls` без panel. Additive `VfTabItem.tabId/panelId`
  связывают external panels; Playground применяет этот contract к main и file tabs.
- Command Palette реализует `combobox` + `listbox` relationship, `aria-expanded`, `aria-controls`,
  `aria-activedescendant`, `aria-autocomplete`, busy state и polite status regions.
- Select исключает disabled options из roving keyboard list, выбирает option из того же filtered set,
  ставит options `tabindex=-1` и отключает hidden form input вместе с control.
- SkeletonGate объявляет `aria-busy`, а неготовый content получает `inert` и `aria-hidden`.
- ThemeSwitch без visible content получает default action label вида «Switch to dark theme».
- MenuBar зеркалит horizontal/submenu Arrow behavior в RTL; relevant physical CSS properties заменены
  logical properties в Switch, NavMenu, TableOfContents, Accordion, Select и menu surfaces.

### CSS, motion и browser preferences

- Новый `accessibility-preferences.css` включён в Core full stylesheet и каждый generated standalone
  component artifact. Contracts требуют наличия `prefers-reduced-motion` и `forced-colors` в каждом
  artifact.
- При reduced motion CSS transitions/animations сокращаются, horizontal scroller использует
  `behavior: auto`, CodeBlock отключает copy transition, Icons отключают spin animation.
- Forced-colors rules сохраняют различимый focus outline, checked control boundary/mark и disabled cue.
- Command Palette max-height теперь ограничен одновременно component limit и доступной высотой viewport
  после top offset/bottom padding (`vh` fallback + `dvh`), поэтому 400% zoom не обрезает content;
  `check:css-parity` закрепляет оба viewport bounds как постоянный regression contract.
- Literal control transitions заменены на `--vf-motion-duration-fast` и
  `--vf-motion-ease-standard`.
- `zDropdown`, `zPopover`, `zTooltip` изменены с `900/925/950` на `1100/1125/1150`; modal/drawer
  остаются `1000`.
- Full/component CSS contracts проверяют AppShell grid grammar, longhand parity и subheader rule parity.
- Showcase no-wrap typography fixture получил локальный horizontal scroll и больше не расширяет document;
  сама публичная `vf-text-nowrap` utility не менялась.

### Layouts

- `VfAppShell` теперь следует стандартному controlled/uncontrolled contract: controlled prop остаётся
  источником истины, uncontrolled state начинается с `defaultSidebarCollapsed`, emit происходит только
  по реальному user/API request.
- Невалидный `grid-template` заменён на `grid-template-areas/rows/columns`; component entry синхронизирован
  с full stylesheet. Subheader использует одинаковый `block-size` contract в обоих путях.
- Все 17 component subpaths получили собственные declaration wrappers с совпадающими named/default
  component exports. Packed TypeScript consumer компилирует реальные prop contracts.
- Plugin singleton помечен pure для tree shaking.

### CodeBlock

- SSR Shiki result сохраняется при hydration. `data-allow-mismatch="children"` ограничен line content;
  component attributes/classes продолжают проверяться Vue. После mount reactive state синхронизируется
  с server-rendered tokens.
- Все внешние token dependencies получили terminal fallbacks с текущими Phase 2 values; standalone
  light/dark root работает без Core CSS.
- Copy action видим и имеет минимум 44×44 px на coarse/touch pointer; reduced-motion transition отключён.
- `CodeBlockFallbackLanguage` и `CodeBlockHighlightOptions` стали публичными; highlight entry и root/view
  declarations согласованы с implementation.
- API docs исправлены по реальным signatures, props, language union, standalone CSS и Vue peer.

### Playground и Playground Core

- Browser-only state становится `true` только в `onMounted`, что сохраняет SSR/client first-render
  parity; session не создаётся до наличия client и iframe.
- Main/file tabs имеют stable ids и настоящие external tabpanels.
- Console хранит максимум 500 последних записей; отдельная запись ограничена 16 384 символами.
- Session принимает сообщения только от configured iframe `contentWindow` и после structural validation
  console/error payload.
- Direct и indirect circular imports возвращают deterministic `circular` error с import path.
- UI root экспортирует все публичные prop unions/interfaces; Vite plugin получил корректные
  `VueForge*` aliases при сохранении deprecated `Vueforge*` names.
- Документация синхронизирована для `heightMode` и synchronous `resolveImport`.

### Packaging, performance и release automation

- Core и Layouts plugin factory calls помечены `/* @__PURE__ */`.
- Demo больше не устанавливает Playground plugin глобально, когда использует только local async
  component.
- Static manifest gate запрещает Playground UI/runtime и Shiki в initial graph и сохраняет route-level
  deferred loading.
- Новый packed-style tree-shaking gate импортирует один Core/Layout component, проверяет gzip budget и
  запрещает случайное включение palette/theme application runtime.
- Icons теперь публикует SSR-safe CJS artifact, ESM auto-CSS и explicit `./style.css`. `prepack`
  гарантирует построение этих artifacts из clean checkout, а packed CJS consumer доказывает отсутствие
  DOM/CSS require side effects.
- Core generated theme CSS записывается через process-local temporary file и atomic rename. Параллельные
  Vitest/build workers больше не могут наблюдать частично записанный artifact.
- No-`dist` test script временно убирает `dist` всех package/example workspaces; Core и Layouts CJS
  smokes независимо упаковывают и подключают Icons, не полагаясь на workspace artifact.
- CI запускает полный `npm run verify`, затем dry-run package publication всех восьми пакетов.

## 5. Почему они были важны

| Дефект | Реальный failure mode | Почему нельзя было отложить |
| --- | --- | --- |
| Global SSR id counter | Разные IDREF между requests/server/client, hydration warnings, неверные labels. | Базовый SSR correctness contract публичной Vue-библиотеки. |
| Независимые overlay handlers | Один Escape закрывает parent и child; Tab прыгает между competing traps; background может разблокироваться. | Потеря keyboard predictability и modal isolation. |
| Hydration drift | Vue заменяет server DOM, теряет готовую Shiki разметку или сообщает mismatch. | Влияет на Nuxt/Vite SSR, performance и доверие к server output. |
| Dangling ARIA IDREF | Screen reader не находит name, description или controlled panel. | Semantics выглядит присутствующей в DOM, но фактически не работает. |
| Layout subpath type mismatch | Runtime import работает, но TypeScript считает default export plugin и выдаёт неверные props. | Блокирует нормальный consumer DX и делает package export недостоверным. |
| Invalid grid shorthand | Browser может отбросить declaration целиком; granular CSS ведёт себя иначе, чем full CSS. | Layout correctness зависит от способа импорта. |
| Iframe source/payload trust | Чужой frame может подделать console/error; malformed payload ломает host assumptions. | Playground исполняет недоверенный код и обязан валидировать transport boundary. |
| Circular import recursion | Stack overflow/непредсказуемая ошибка вместо диагностируемого sandbox failure. | Ошибка пользователя не должна разрушать host runtime. |
| CJS DOM CSS injection | SSR `require()` падает без fake `document`. | Published CommonJS condition обязана быть server-safe. |
| Clean pack без build lifecycle | `npm pack`/`npm publish` из clean checkout может выпустить tarball без файлов, на которые указывают exports. | Публикуемый manifest обязан быть воспроизводим из исходников, а не зависеть от локального stale `dist`. |
| Plugin tree-shaking failure | Один component import удерживает несвязанный theme graph и localStorage runtime. | Нарушает заявленную granular delivery model и bundle expectations. |
| Неатомарная генерация CSS | Параллельный test/build читает обрезанный generated file и получает случайный parity failure. | Flaky contract скрывает реальные regressions и делает CI недетерминированным. |
| Reduced motion/forced colors | Animation продолжает двигаться при user preference; focus/checked cues могут исчезнуть в HC. | Это platform accessibility contract, а не визуальная опция. |
| Overlay viewport overflow | Command Palette выходит ниже visual viewport при 400% zoom, footer/results становятся недоступны без предсказуемого scroll scope. | WCAG reflow должен сохранять operable content в коротком effective viewport. |
| Hidden interactive skeleton content | Keyboard попадает в невидимые controls до готовности UI. | Нарушает focus order и создаёт недоступное состояние. |

Принцип отбора был консервативным: если проблему нельзя было доказать через failure mode и regression
contract, она не становилась частью patch. Поэтому Phase 3 не превращена в субъективный redesign.

## 6. Оставшиеся рекомендации

Ниже перечислены осознанно отложенные изменения. Они не являются скрытыми незавершёнными частями patch:
для них требуется отдельное product/API решение, migration policy или реальная browser/AT инфраструктура.

| Приоритет | Рекомендация | Почему не вошла в Phase 3 |
| --- | --- | --- |
| P1 | Добавить отдельный гарантированно lazy Playground entry, например `./async`, и измерять его consumer graph. | Текущий `/ui` одновременно re-export'ит sync component; изменение entry architecture и документации лучше выпустить отдельным additive contract. |
| P1 | Запустить постоянную Playwright matrix: Chromium, Firefox, WebKit, LTR/RTL, reduced motion, forced colors, 200%/400% zoom. | Unit/JSDOM и разовый visual smoke не доказывают layout/paint behavior всех engines. |
| P1 | Провести ручной screen-reader pass: VoiceOver/Safari, NVDA/Firefox или Chromium, JAWS/Edge. | Accessible DOM contracts покрыты тестами, но announcement/focus UX нельзя сертифицировать unit-тестом. |
| P1 | Определить официальный docs-site build и broken-link gate. | В repository есть Markdown lint/import ownership и demo build, но отдельной команды сборки documentation site сейчас нет. |
| P1 | Документировать SSR theme bootstrap для устранения возможного first-paint switch при stored/system theme. | Provider теперь hydration-safe; полное отсутствие flash требует server cookie/inline bootstrap policy на уровне приложения. |
| P2 | Спроектировать единый polymorphic trigger/`asChild` contract для overlay/actions. | Меняет DOM ownership, ref forwarding, events и public API; точечное внедрение создало бы ещё одну convention. |
| P2 | Спроектировать localization provider для встроенных labels/status text. | Hardcoded English строки существуют; безопасное решение требует fallback locale, typing и message ownership, а не разрозненных props. |
| P2 | Определить generic row typing/sorting/selection model для DataTable. | Это новый API продукта, а не исправление существующего defect. |
| P2 | Зафиксировать Alert role/live-region policy и обязательные non-color cues для custom content. | Severity не всегда означает urgent announcement; автоматический `alert` может ухудшить UX. |
| P2 | Довести bidi spatial behavior scrollers/floating placement на всём component set. | Подтверждённые physical CSS и MenuBar keyboard defects исправлены; полный bidi audit требует browser matrix и product policy для logical placement names. |
| P2 | Решить судьбу `critical.css` как публичного долгосрочного contract. | Удаление или переопределение entry является migration/bundling решением. |
| P2 | Расширить Select до полного native-like form contract: reset, validation, required и form association. | Текущий disabled submission defect исправлен; полноценная эмуляция native select существенно расширяет API/implementation. |
| P2 | Рассмотреть scoped CodeBlock style registry вместо повторной runtime theme injection. | Нужны измерения нескольких providers/scopes; текущая реализация корректна и regression не доказал performance blocker. |
| P2 | Перейти к cascade layers только в major release с documented consumer ordering. | Добавление `@layer` способно изменить существующий cascade и override behavior даже без изменения selectors. |
| P3 | Опубликовать deprecation/migration roadmap для ранее отмеченных Phase 1 compatibility tokens и legacy APIs. | Phase 3 не удаляет legacy contracts; план нужен перед major, а не как pre-release patch текущей линии. |

Отдельный риск текущего token-only stacking fix: глобальный dropdown layer теперь выше modal layer независимо
от ancestry. Это исправляет подтверждённый случай teleported child внутри modal, но идеальная долгосрочная
модель — stack manager/top-layer context, который отличает foreground branch от случайного background popup.

## 7. Performance

### Подтверждённые проблемы и результат

| Contract | До Phase 3 | После исправления | Статус |
| --- | ---: | ---: | --- |
| Demo initial entry gzip | 95.90 KiB | 90.24 KiB | PASS, budget 95.00 KiB |
| Core root import только `VfButton` | Около 12.3 KiB gzip в audit probe | 1.11 KiB gzip | PASS, budget 4 KiB |
| Layouts root import только `VfContainer` | Около 15.4 KiB gzip в audit probe | 0.65 KiB gzip | PASS, budget 4 KiB |

Числа после исправления повторно получены автоматическими gates после финального root build. Gate
дополнительно ищет в output несвязанные OKLCH palette declarations, primitive graph и theme application
runtime, поэтому маленький gzip сам по себе не является единственным критерием.

Initial manifest проверяется транзитивно: Shiki, `@shikijs`, Playground UI и Playground Core не могут
попасть в root static import graph. Core/Layouts/Icons routes также не должны втянуть deferred runtime.
Удаление глобальной установки Playground plugin не меняет demo functionality, потому что showcase уже
использует локальный async component.

Console bounds в Playground устраняют неограниченный рост reactive array и DOM text: сохраняются последние
500 entries, каждая до 16 384 символов. Circular import detection также заменяет потенциальный stack
overflow на линейную диагностику active compile path.

### Оставшиеся performance-наблюдения

- `VfPlaygroundAsync` следует проверить через отдельный public async entry; экспорт из общего `/ui` не
  должен считаться доказательством hard code-splitting.
- Visual showcase budget защищает initial graph, но не заменяет budgets для каждого опубликованного
  package entry и типичных composite consumers.
- Нужны реальные browser measurements hydration/interaction, если библиотека будет заявлять конкретные
  Core Web Vitals guarantees; Phase 3 измеряет bundle contracts, а не маркетинговые runtime показатели.

## 8. Accessibility

Phase 3 закрывает подтверждённые programmatic defects в keyboard/focus/ARIA слоях:

- topmost Escape и focus trap для nested/teleported overlays;
- ref-counted scroll isolation;
- корректные accessible name/description ids у Dialog и Drawer custom slots;
- combobox/listbox/active descendant contract у Command Palette;
- двусторонние tab/tabpanel relationships и отсутствие dangling `aria-controls`;
- пропуск disabled Select options и отсутствие disabled form submission;
- `inert` loading content у SkeletonGate;
- default accessible name у ThemeSwitch;
- polite live statuses для loading/empty Command Palette;
- RTL keyboard direction для MenuBar;
- reduced motion, forced colors и coarse pointer behavior.

Forced-colors contract использует system colors (`Highlight`, `HighlightText`, `Canvas`, `ButtonText`,
`GrayText`) и убирает конфликтующий box-shadow у focused controls. Reduced-motion contract не просто
замедляет animation: scroller переключается на instant behavior, а icon spin прекращается.

Автоматические тесты подтверждают DOM relationships и keyboard event routing. Chromium reflow smoke
дополнительно подтвердил 200%/400% effective viewport без document-level horizontal overflow на Core,
Layouts, CodeBlock и Playground; modal surfaces остаются в границах, touch copy target равен 44×44 px.
Это всё ещё не позволяет заявить полную WCAG-сертификацию. До GA-релиза нужен ручной pass из раздела 6.
В особенности следует проверить:

- announcement cadence Command Palette status regions;
- nested Dialog → Select/Popover/Menu focus flow в VoiceOver/NVDA;
- Windows High Contrast rendering Checkbox/Radio/Switch;
- повторить native browser zoom 200%/400% в Firefox/WebKit/Windows, включая browser chrome и OS scaling;
- touch exploration и copy action на iOS/Android;
- custom renderer/slot cases, где consumer принимает на себя semantic ownership.

Phase 3 не меняла Phase 2 contrast matrix и не корректировала color values. Все ранее зафиксированные
non-color cue exceptions остаются действующими; новый forced-colors слой усиливает platform mode, но не
заменяет product-level icon/text cues.

## 9. DX

DX улучшен там, где consumer получал объективно неверный или неполный contract:

- Layouts subpath autocomplete теперь показывает props конкретного component, а не plugin type.
- Core root экспортирует `VfLinkUnderline`, `VfSwitchThumbContrast` и option types публичных composables:
  `UseClickOutsideOptions`, `UseDisclosureOptions`, `UseEscapeKeyOptions`, `UseFloatingOptions`,
  `UseFocusTrapOptions`, `UseIdOptions`, `UseTableOfContentsOptions` и middleware data.
- Playground UI экспортирует shared/sandbox/component props, tab и height-mode types.
- CodeBlock highlight options/fallback type доступны из root, view и highlight entries.
- Vite plugin исправляет product casing через новые aliases, сохраняя старые names как deprecated.
- Packed consumer tests компилируют реальные imports и intentional `@ts-expect-error`, поэтому наличие
  `.d.ts` файла больше не считается достаточной проверкой.
- Core docs больше не обещают global component registration: plugin отвечает за theme/config defaults,
  а components импортируются прямо.
- Vue peer contract приведён к фактическому минимуму `^3.5.0` в Layouts, CodeBlock и Playground.

### Migration notes

- Переход peer Vue `^3.4.0` → `^3.5.0` — единственное намеренное повышение platform minimum. Оно
  необходимо для request-stable `useId`, narrow hydration mismatch control и согласования с уже
  требовавшими Vue 3.5 Core/Icons. Consumers на Vue 3.4 должны обновить Vue до установки новых версий.
- CommonJS Icons больше не выполняет CSS DOM injection. SSR `require()` теперь безопасен; CommonJS
  browser consumer, которому нужны package styles, должен импортировать опубликованный `style.css`.
  ESM auto-CSS behavior сохранён.
- Controlled AppShell больше не emit'ит initial value и не меняет visual state до обновления prop
  родителем. Это исправление standard controlled contract; код, полагавшийся на mount emit, должен
  инициализировать parent state явно.
- Старые `Vueforge*` Vite plugin types не удалены, поэтому source compatibility сохранена.

## 10. API consistency

В Phase 3 не переименованы существующие component props/events/slots и не введена параллельная naming
system. Исправления public API являются additive либо возвращают implementation к уже заявленному
contract.

| Изменение | Совместимость | Комментарий |
| --- | --- | --- |
| Dialog/Drawer aria props | Additive | Existing title/description defaults сохранены. |
| `VfTabItem.tabId/panelId` | Additive optional fields | Existing internally rendered panels получают generated ids как прежде. |
| Core composable/component type exports | Additive | Runtime behavior не меняется. |
| CodeBlock public option types | Additive | Типы описывают уже существующие runtime options. |
| Playground prop type exports | Additive | Props уже существовали в implementation. |
| Correctly cased Vite plugin aliases | Additive + deprecated compatibility | Legacy spelling сохранено. |
| Layouts dedicated subpath declarations | Corrective | Types теперь совпадают с уже существующим runtime default export. |
| AppShell controlled state | Behavioral bug fix | Удалён unsolicited initial emit; parent остаётся source of truth. |
| `scrollLockTarget=false` | Behavioral bug fix | Значение наконец соответствует public meaning. |
| Vue 3.5 peer minimum | Platform requirement change | Объективно необходимое исключение, описанное в migration notes. |
| Icons CJS entry/style export | Packaging correction | Runtime symbols сохранены; CSS side effect отделён для SSR. |

Массовая унификация `as`/`asChild`, `position`/`placement`, content rendering и localization props не
выполнялась: без major-version design она могла бы уменьшить, а не увеличить API consistency. Такие
решения вынесены в раздел 6.

## 11. Documentation

Исправлены документированные расхождения:

- Core installation/getting-started/API/guides точно описывают theme/configuration plugin и direct
  component imports;
- CodeBlock API содержит реальные helper argument order, `highlightCodeLines`, preload/plain helpers,
  options, props, полный language union, standalone CSS и hydration note;
- Layouts API перечисляет `VfAdminShell`, breakpoints CSS, AppShell/DocumentLayout props и payload emit;
- Playground API описывает `heightMode`, публичные types и точный synchronous `resolveImport` contract;
- peer Vue minimum в CodeBlock docs синхронизирован с package metadata.
- Typography showcase сохраняет смысл no-wrap utility, но локализует её overflow вместо расширения всей
  страницы при 400% zoom.

Docs import ownership продолжает предотвращать примеры, которые случайно используют не тот package
entry. Markdown lint остаётся content-level gate.

Объективный оставшийся пробел: repository не определяет отдельный documentation-site build command.
`npm run build:demo` собирает showcase, а не статический docs portal. Поэтому «documentation build» в
финальной verification table обозначен как not configured; это следует решить до заявления о
публичном hosted documentation с broken-link guarantee.

Отдельный migration guide Phase 3 нужен при публикации release notes прежде всего для Vue 3.5 minimum,
Icons CJS CSS и controlled AppShell mount emit. Этот audit report фиксирует изменения технически, но не
заменяет короткий consumer-facing changelog.

## 12. Test coverage

### Зафиксированный baseline до изменений

- `npm test`: 420 tests — PASS.
- `npm run typecheck`: PASS.
- `npm run lint:all`: PASS.
- Docs import ownership: 284 Markdown files — PASS.
- Deferred demo budget: **FAIL**, 95.90 KiB gzip > 95.00 KiB. Этот baseline failure стал отдельным
  regression contract, а не был скрыт повышением budget.

### Подтверждённые проверки текущих изменений

| Scope | Результат | Что подтверждает |
| --- | --- | --- |
| Docs import ownership | PASS, 285 files | Каждый snippet использует корректный package entry. |
| Core package `check` | PASS, 268 tests | SSR ids/provider, overlay/focus/scroll, runtime/static parity, Command Palette viewport bound, 43 CSS exports и 39 component auto-CSS contracts. |
| Layouts package `check` + build | PASS, 56 tests | State behavior, CSS grammar/parity, 21 CSS exports, 17 JS и 17 declaration subpaths, packed TS consumer. |
| CodeBlock package `check` + build | PASS, 53 tests | SSR hydration, standalone tokens, public types, CSS/export/packed consumer. |
| Playground UI package `check` | PASS, 35/35 | Hydration, external tabpanels, bounded logs, props/export behavior. |
| Playground Core package `check` | PASS, 15/15 | Message validation, source isolation, circular imports/runtime. |
| Playground Vite plugin `check` | PASS, 6/6 | Virtual entries и compatible type aliases. |
| Theme package `check` | PASS, 13/13 | Theme types/runtime и serialization contracts. |
| Icons check/build/packed CJS SSR | PASS | CJS без DOM/CSS require, ESM CSS reference, explicit style export и SSR rendering. |
| Consumer tree-shaking gate | PASS | Core `VfButton` 1.11 KiB gzip; Layouts `VfContainer` 0.65 KiB gzip; unrelated theme graph отсутствует. |
| Deferred runtime budget | PASS | Demo initial entry 90.24 KiB gzip; forbidden deferred runtimes отсутствуют в initial static graph. |

### Финальная verification table

| Требуемая проверка | Статус | Финальное свидетельство |
| --- | --- | --- |
| `npm test` | PASS | 446 Vitest tests во всех test-bearing packages; Icons consumer/render assertions также PASS. |
| `npm run verify` | PASS | Clean install (630 packages), lint, package checks, no-dist tests, build, tree shaking и budgets одной командой. |
| `npm run typecheck` | PASS | Все workspace TypeScript/Vue declarations. |
| `npm run lint:all` | PASS | ESLint, Stylelint, HTMLHint, Markdownlint (287 Markdown files) и Prettier data. |
| `npm run build` | PASS | Все восемь library packages, включая ESM/CJS/declarations/CSS artifacts. |
| `npm run build:demo` | PASS | Production showcase/demo build; route runtimes остаются deferred. |
| CSS exports + full/component-entry parity | PASS | Core/Layout/CodeBlock/Playground packed CSS contracts на final dist. |
| Runtime/static theme parity | PASS | Canonical runtime/static variable maps и scoped modes совпадают; color values не изменены. |
| SSR/hydration aggregate | PASS | Vue server-renderer regressions, clean packed Core/Layout/Icons CJS SSR и hydration cases. |
| Visual regression light/dark/reflow | PASS (Chromium) | 24 screenshots; дополнительно 12 checks (200%, 400%, ultrawide × 4 routes), 3 overlays при 400% и coarse-pointer target. |
| Documentation build | `NOT_CONFIGURED` | Есть Markdown/import gates; отдельной docs-site build command в repository нет. |
| `npm run prepublish:all` | PASS | Dry-run archives всех восьми публикуемых packages содержат CJS/ESM/CSS/declarations согласно exports. |
| `git diff --check` | PASS | Whitespace integrity финального Phase 3 diff. |

PNG container hashes между двумя visual runs различались из-за encoder metadata. Сравнение декодированных
пикселей показало точное совпадение всех Core, CodeBlock и Playground кадров. В семи Colors/CVD кадрах
различалось не более 0.01793% пикселей; палитра и layout визуально не изменились, максимальные расхождения
локализованы в повторном raster/CVD capture и проверены ручным просмотром. Browser/network errors: 0.

Главные новые regressions проверяют именно обнаруженные причины, а не случайные snapshots: два
независимых SSR requests, nested overlay ownership, non-LIFO scroll unlock, malformed foreign iframe
messages, circular path, packed default/type identity, standalone token terminals и static bundle graph.

## 13. Browser compatibility

### Исправленные cross-browser/platform contracts

- Browser-only APIs (`localStorage`, `matchMedia`, media listeners, DOM roots) защищены и не выполняются
  в SSR setup path.
- Storage SecurityError/privacy restrictions не ломают ThemeProvider.
- `prefers-reduced-motion`, `prefers-color-scheme` и `forced-colors` имеют явное fallback behavior.
- Physical left/padding/margin properties заменены logical equivalents в затронутых bidi components;
  MenuBar keyboard direction учитывает ближайший `dir` и root direction.
- Coarse pointer больше не зависит от hover для CodeBlock copy.
- Icons CommonJS не предполагает browser DOM.
- AppShell использует валидные grid longhands, одинаковые в full и component CSS.

### Что доказано, а что нет

Unit tests и package builds доказывают deterministic DOM/API behavior, но JSDOM не является Chrome,
Firefox или Safari layout engine. В Phase 3 выполнен production smoke в Chrome 150 через DevTools:
light/dark/CVD screenshots, RTL transform, reduced-motion, forced-colors, overlay z-order, reflow at
200%/400%/ultrawide и реальные Dialog/Drawer/Command Palette ARIA/focus/scroll assertions. Состояние
расширенной matrix:

| Matrix | Сценарии | Статус |
| --- | --- | --- |
| Chromium light/dark | Nested overlays, z-order, focus, AppShell, CodeBlock, Playground | PASS, 24 captures; 0 browser/network errors |
| Firefox light/dark | Grid, logical properties, focus/scroll behavior | NOT_RUN, engine не установлен в automation |
| WebKit/Safari light/dark | Hydration, storage/media fallbacks, sticky/layout, touch copy | NOT_RUN, engine не настроен в automation |
| Edge/Windows HC | Forced colors focus, checkbox/radio/switch, disabled states | PARTIAL, Chromium emulation PASS; native Windows/Edge NOT_RUN |
| RTL | MenuBar arrows, Switch, NavMenu, ToC, Select and scrollers | PASS для unit contracts и Chromium Switch/runtime smoke |
| Zoom 200%/400% | Overlay fit, text wrapping, horizontal overflow, touch targets | PASS в Chromium effective viewport; native multi-engine repeat остаётся GA gate |

Chromium runtime smoke подтвердил stacking `overlay/drawer/dropdown/popover/tooltip =
1000/1000/1100/1125/1150`, зеркальный Switch transform, transition duration `0.01ms`, остановку icon
spin, `scroll-behavior: auto`, forced-colors outline без box-shadow, modal focus/scroll lock и Command
Palette combobox/listbox linkage.

Reflow probe проверил Core, Layouts, CodeBlock и Playground при effective CSS viewports 720×550@2x,
360×275@4x и 1920×1080@1x. Document-level horizontal scroll отсутствует; при 400% Dialog занимает
328×226 px, Drawer 360×275 px, Command Palette 328×215 px, а coarse-pointer CodeBlock copy action —
44×44 px и видим постоянно.

Nuxt-specific end-to-end fixture также остаётся желательным. Текущие SSR tests используют Vue server
renderer и напрямую проверяют наиболее опасные hydration boundaries, но не охватывают Nuxt plugins,
streaming или application-level theme bootstrap.

## 14. Release readiness

### Изменения, способные повлиять на внешний вид

Палитра и semantic color mapping не изменены, однако нулевой visual diff для Phase 3 не заявляется:
несколько исправлений намеренно меняют только дефектные или preference-specific состояния.

| Изменение | Когда видимо | Ожидаемый эффект |
| --- | --- | --- |
| Overlay z-index `1100/1125/1150` | Dropdown/Popover/Tooltip рядом с modal/drawer | Floating descendant больше не скрывается под modal layer. |
| Motion literals → fast/standard tokens | Hover/focus/state transitions Button, IconButton, Input, Select, Textarea | Длительность становится согласованной (current fast token 220 ms вместо локальных 120/180 ms). |
| Reduced-motion contract | Только при `prefers-reduced-motion: reduce` | Практически мгновенные transitions, без icon spin, без smooth scroll. |
| Forced-colors contract | Только в forced-colors mode | System focus/checked/disabled cues вместо потерянных custom colors/shadows. |
| RTL logical geometry | Только RTL | Правильное зеркалирование thumb, indentation, alignment и menu arrows. |
| Command Palette viewport cap | Короткий viewport/200–400% zoom | Content остаётся внутри доступной высоты и прокручивается во внутреннем body. |
| Typography no-wrap showcase | Только узкий effective viewport | Demo локально прокручивается по горизонтали, не создавая page-level scroll. |
| AppShell grid correction | Granular AppShell CSS и affected responsive layouts | Browser применяет intended columns/areas вместо отбрасывания invalid shorthand. |
| AppShell subheader size parity | Переполняющийся subheader content | Full и component CSS используют один exact block-size contract. |
| CodeBlock standalone fallbacks | CodeBlock без Core CSS | Предсказуемые light/dark материалы, typography и spacing из существующих defaults. |
| CodeBlock touch copy | Coarse/touch pointer | Copy action постоянно видим и имеет 44 px target. |
| Theme browser state after mount | SSR page, если stored/system theme отличается от server default | Hydration остаётся чистой; без app bootstrap возможен краткий first-paint theme switch. |

Остальные изменения относятся к ARIA, focus/keyboard ownership, package metadata, TypeScript declarations,
security validation, tree shaking и tests и не должны менять обычный LTR light/dark rendering.

### Совместимость

- Color palette values: **не изменены**.
- Public color/token names: **не изменены и не удалены**.
- Legacy tokens: **не удалены**.
- Component props/events/slots: существующие names **не переименованы**; новые поля/props additive.
- Runtime/static/full/component-entry theme contract: повторно подтверждён final parity gate.
- Объективные исключения: Vue peer minimum повышен до 3.5; Icons CommonJS CSS стал explicit;
  controlled AppShell больше не emit'ит initial state. Причины и migration notes приведены в разделе 9.

### Итоговый вывод

После реализованных исправлений VueForge имеет архитектуру зрелой публичной UI-библиотеки: package
boundaries проверяются packed consumers, SSR/hydration являются first-class contracts, granular CSS и
tree shaking защищены автоматикой, а accessibility semantics координируются между компонентами.

Корректная формулировка после финального прогона — **engineering release candidate ready**: все
настроенные root/package/CSS/SSR/publication gates и Chromium smoke прошли. Для заявления о полностью
сертифицированном GA уровня крупнейших Design Systems дополнительно нужны постоянная Firefox/WebKit/
Windows matrix, zoom 200%/400%, ручной AT pass и официальный docs-site build. Это разделяет доказанную
engineering readiness и ещё не выполненную platform certification.

### Оценка по 10-балльной шкале

Оценки относятся к финальному состоянию Phase 3 после автоматизированных release gates и Chromium smoke.

| Направление | Оценка | Обоснование |
| --- | ---: | --- |
| Architecture | 8.9/10 | Хорошее package/layer разделение и сильные boundary contracts; stack manager и отдельный async entry остаются будущими улучшениями. |
| API | 8.6/10 | Широкий совместимый typed API; исправлены exports/subpaths, но unified polymorphism/i18n требуют отдельного design. |
| Accessibility | 8.6/10 | Исправлены overlay, ARIA, keyboard, preferences, RTL и Chromium 400% reflow defects; ручная AT/multi-engine certification ещё не выполнена. |
| Design System | 9.1/10 | Зрелые token/color/CSS contracts после Phase 0–2, согласованный motion/stacking слой без субъективного redesign. |
| DX | 8.8/10 | Granular imports, точные declarations и packed consumer tests; docs-site и migration flow можно усилить. |
| Performance | 9.0/10 | Initial graph и single-component imports имеют автоматические budgets; отдельный Playground async entry ещё нужен. |
| Documentation | 8.3/10 | Подтверждённые API drifts исправлены; нет отдельного build/broken-link gate и consumer-facing migration note. |
| Maintainability | 9.0/10 | Причины regressions превращены в contracts, изменения локальны; несколько full/component representations требуют постоянной parity защиты. |
| Testability | 9.2/10 | Сильные unit, SSR, packed consumer, CSS и bundle gates; real-browser/AT automation остаётся пробелом. |
| Release Readiness | 8.9/10 | Root-wide gates, Chromium visual smoke и publication dry-run пройдены; multi-engine/AT/docs-site certification остаётся отдельным GA gate. |
