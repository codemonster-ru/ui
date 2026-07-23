# VueForge — Phase 5: документация и финальная готовность к GA

Дата подготовки: 2026-07-23. Область аудита: публичный путь от первого открытия репозитория до
production build, документация восьми npm-пакетов, компонентные и theme-контракты, accessibility,
SSR, Playground, migration path и материалы публичного релиза.

## 1. Executive Summary

Phase 5 проверила VueForge глазами разработчика, который не знаком с репозиторием и использует
только публичные пакеты и документацию. До исправлений package/runtime verification из Phase 4 уже
проходила, но документационный слой не давал такого же уровня гарантий. Были подтверждены следующие
объективные дефекты:

- корневой README не содержал воспроизводимого пути от установки до темы, первого компонента и
  production build;
- README восьми пакетов неодинаково описывали требования, package-manager commands, quick start,
  документацию, лицензию и версии согласованного release train;
- Icons описывал установку только через npm и не объяснял явный CSS/SSR contract;
- не существовало единого актуального руководства по runtime-настройке темы, scoped themes, custom
  prefix, fallback behavior, accessibility и SSR/Vite/Nuxt;
- API-таблицы ряда компонентов расходились с реальными props, emits, slots и defaults;
- примеры Button, Tag, DataTable, SkeletonGate, CodeBlock и Playground содержали устаревшие или
  неполные вызовы;
- Playground documentation смешивала sandbox/component modes и неполно описывала renderer props,
  runtime exports и theme inheritance;
- локальные ссылки, якоря, package subpaths, install targets и кодовые примеры не имели общего
  автоматического regression gate;
- новый documentation-example extractor не ограничивал `file=` и relative SFC import paths своей
  временной fixture, что делало CI небезопасным для недоверенного Markdown из pull request;
- production showcase не объявлял favicon, поэтому чистый browser profile получал `/favicon.ico`
  404 и загрязнял release smoke.

Исправления выполнены в документации, приватном root tooling и shell production showcase.
Исходники CSS, design tokens, палитра, manifests восьми публикуемых пакетов и публичные TypeScript
shapes не изменялись. Единственное runtime-исключение — исправление уже публичного
`componentSourceLanguage`, который игнорировался для single-source и extensionless component
files. Подготовлен автоматический contract-аудит 296 Markdown-файлов, 58 catalog component API и
восьми package README, а также реальный `vue-tsc`-прогон 207 fixtures из complete/runnable examples
и проверяемых public imports.

Итоговая рекомендация: документация и локальный release candidate готовы к публичному stable
rollout. Публикация не выполнялась. Hosted documentation deployment, registry-only smoke,
provenance и ручные platform/accessibility checks остаются обязательными stop-the-line gates самого
релиза.

## 2. Documentation Audit

### README и первый пользовательский путь

Корневой [README](../../README.md) теперь содержит:

- назначение экосистемы и минимальные Vue/Node requirements;
- команды npm, pnpm и Yarn для Core;
- полный browser setup с CSS и Core plugin;
- `VfThemeProvider`, `VfThemeSwitch` и первый компонент;
- production build command;
- таблицу всех восьми пакетов с согласованными версиями;
- ссылки на hosted documentation, migration guide, release notes и MIT License.

README каждого публикуемого пакета приведён к единому минимальному контракту: purpose,
requirements, installation, quick start, documented public import, current coordinated version,
documentation и license. Package-specific различия сохранены: CodeBlock и Playground используют
явные subpaths, Theme и Playground Core не требуют Vue, Vite plugin документирует peer Vite, а
browser CSS не приписан CSS-free Node entries.

### Consistency и regression gates

Добавлены две release-проверки:

- `check:docs` проверяет exact-case локальных ссылок и изображений, anchors, существование VueForge
  packages/subpath exports, install targets, синтаксис TS/JS/Vue snippets, package README sections и
  соответствие документированных props/emits/slots реальным SFC;
- `check:docs:examples` извлекает complete SFC, `playground-src`, runnable file examples, Quick Start
  TypeScript и публичные imports, после чего проверяет их через реальный `vue-tsc` и собранные
  declarations. Все генерируемые paths проходят cross-platform containment check; отдельные
  regression tests отклоняют `..`, absolute, backslash и UNC escapes до записи fixture.

Обе проверки включены в основной `check`/`verify`, поэтому повторный drift блокирует release gate.
Существующий ownership check подтверждает корректную принадлежность package imports. Markdown,
JSON/YAML и whitespace проверяются штатными linters.

Одноразовый внешний HTTP audit подтвердил доступность корневого hosted docs route и разделов Core,
Layouts, Icons, CodeBlock и Playground, а также использованных официальных Vue, Vite, Nuxt и W3C
references. Ссылки на новые локальные release documents станут доступны на GitHub только после push
release commit; npm package pages ограничивают автоматические HTML-запросы, поэтому registry state
проверяется release workflow через `npm view`, а не scraping.

## 3. Installation Experience

Путь нового Core consumer сводится к трём действиям: установить Vue/Core выбранным package manager,
импортировать `styles.css` в browser entry и установить Core plugin. Компоненты импортируются явно,
а provider добавляется только там, где приложение использует reactive theme state.

Документация последовательно различает:

- npm `install`, pnpm `add` и Yarn `add`;
- full stylesheet, component-entry auto CSS и manual/granular CSS;
- browser entry с CSS side effects и CSS-free Node/SSR conditions;
- Core/Layout root imports и обязательные `/view`, `/highlight`, `/ui`, `/runtime` subpaths;
- Node 18 baseline и Node 20 requirement CodeBlock/Playground.

Core, Layouts, CodeBlock, Icons и Playground getting-started pages получили явные следующие шаги,
чтобы пользователь мог перейти от установки к API, theme, accessibility и SSR без поиска по
исходникам. Нового facade package, global component registration или compatibility layer не
потребовалось.

## 4. Component Documentation

Сформирован source-derived inventory 58 catalog/API-tab Vue components из Core, Layouts, Icons,
CodeBlock и Playground. Для каждого элемента этого inventory release gate требует существующую
API-страницу и точное совпадение множеств props, emits и slots с SFC contract. Отдельные integration
components также документированы на своих канонических страницах: `VfThemeProvider` — в Theme
Configuration, а `VfPlaygroundAsync` — в Playground features; generic API-table gate к ним не
применяется.

Исправлены подтверждённые расхождения, включая Avatar, Breadcrumbs, Command Palette, Link, Select,
Switch, Table of Contents, Theme Switch и Error Layout. Документация теперь отражает реальные
optional/required props, events, scoped slots и defaults. Feature pages Button, DataTable,
IconButton, Input, Link, Radio, Switch, Tag и Theme Switch больше не обещают неподдерживаемое
поведение, не импортируют undeclared transitive packages и используют актуальные примеры.

CodeBlock API дополнен реальными plugin/theme options, legacy constants и exports
`/view`/`/highlight`. Playground API разделяет sandbox и component discriminated props, описывает
renderer contracts, layout slot, runtime behavior и доступные exports. Полные SFC, multi-file
playground examples, Quick Start/file-marked TypeScript входят в автоматический typecheck; короткие
TS/JS/template fragments проходят syntax/compiler validation, а их публичные imports проверяются
против собранных declarations.

## 5. Theme Documentation

Создано единое руководство [Theme Configuration](../core/guides/theme-configuration.md), которое
описывает текущую архитектуру без изменения самой системы:

- primitive, semantic, VueForge 1.x component и fallback layers;
- `extend`, mode-specific overrides и complete custom presets;
- `VfThemeProvider`, `useTheme()` и `VfThemeSwitch`;
- light, dark и system resolution;
- nested/reversed scoped themes через `data-vf-theme`/`data-theme`;
- custom root, attribute, storage key, style id и custom prefix с canonical `--vf-*` aliases;
- static CSS, no-JavaScript fallback и runtime style injection;
- границу между Core integration и low-level Theme engine.

Старые theme API pages и visual-baseline links синхронизированы с каноническим руководством.
Примеры используют существующие exports и реальные option shapes. Значения палитры, token names,
legacy aliases и runtime serialization не менялись.

## 6. Accessibility Documentation

Создано приложение-ориентированное руководство [Accessibility](../core/guides/accessibility.md).
Оно покрывает все запрошенные области:

- keyboard-only navigation и composite widget patterns;
- initial focus, focus trap, restoration и visible focus indicators;
- ARIA roles, relationships, labels и ответственность custom slots;
- `prefers-reduced-motion` и недопустимость возврата длинных consumer animations;
- `forced-colors` и границы browser emulation;
- RTL, logical geometry и mixed-direction content;
- VoiceOver/NVDA/JAWS manual screen-reader scenarios;
- WCAG 2.2, contrast revalidation и отсутствие blanket conformance claim.

Формулировки feature pages скорректированы там, где прежний текст делал более широкое обещание,
чем реализация. Автоматические tests остаются regression signal, а не заменой реальной assistive
technology или Windows High Contrast verification.

## 7. SSR Documentation

Создано руководство [SSR and Hydration](../core/guides/ssr.md) для Vue SSR, Vite SSR и Nuxt. Оно
фиксирует:

- fresh app factory на каждый request и одинаковую server/client configuration;
- размещение CSS в client graph при CSS-free Node conditions;
- deterministic `VfThemeProvider` initial render и безопасный theme bootstrap;
- Nuxt universal plugin и global CSS setup без несуществующего Nuxt module;
- правила для custom runtime token CSS и CSP nonce;
- hydration constraints, request-stable IDs, Teleports и initial overlay state;
- SSR/lazy behavior CodeBlock и Playground.

Документация явно не заявляет непроверенное: в репозитории нет Nuxt end-to-end fixture, hosted SSR
deployment или edge-runtime matrix. Эти проверки перенесены в remaining release risks.

## 8. Playground Audit

Getting Started, API, features, theming и guide index Playground сверены с `VfPlayground.vue`,
публичными types и runtime exports. Исправлены mode requirements, defaults, custom renderer props,
theme inheritance и lazy runtime guidance. Multi-file `playground-src` examples теперь собираются
как связанные fixtures, а не проверяются как изолированные fragments.

Showcase navigation, theme switch, CodeBlock и Playground routes проходят demo typecheck/build.
Большой TypeScript compiler остаётся deferred и не был затронут. Единственная runtime correction
Phase 5 заставляет существующий `componentSourceLanguage` реально управлять single-source и
extensionless examples; regression tests покрывают оба сценария. Bundle architecture не менялась.

Production Chromium smoke на чистом profile проверил desktop/mobile и light/dark для Color System,
Core, CodeBlock и Playground: 16 route/mode/viewport snapshots и восемь CVD screenshots, без
browser console errors и network failures. Проверка подтверждает видимый Playground content
surface, inherited theme, CodeBlock highlighting/focus и отсутствие horizontal overflow. В ходе
этой проверки найден и исправлен отсутствующий showcase favicon; повторный clean-profile run
прошёл полностью. Это Chromium smoke, а не замена multi-engine или assistive-technology matrix.

## 9. Migration Guide Review

Исторический release-train guide заменён актуальным
[VueForge 2 migration guide](../migration-to-v2.md). На момент Phase 5 он был повторно проверен
против package manifests, exports, versions и Phase 4 release notes и включал:

- полный coordinated version/floor matrix;
- совместное обновление Vue и Vue server renderer;
- поддерживаемые CodeBlock/Playground subpaths;
- browser/Node CSS behavior;
- Icons CommonJS correction;
- token compatibility и сохранённые aliases;
- список behavior corrections и post-upgrade checks.

Объективных пропусков после Phase 4 не обнаружено, поэтому документ не менялся ради формального
diff. Release notes получили ссылку на copy-ready public release assets.

## 10. Release Assets

Создан [Public release assets](../public-release-assets.md) с готовыми к использованию материалами:

- кратким project description и feature list;
- точными npm descriptions из package manifests;
- coordinated GitHub Release introduction;
- release announcement, публикуемым только после registry smoke;
- ссылками на authoritative release notes, migration guide и package changelogs.

Материалы не заменяют package-specific CHANGELOG sections, которые release workflow использует для
scoped GitHub Releases. Публикация, теги, GitHub Release и announcement в Phase 5 не выполнялись.

### Final verification matrix

<!-- PHASE5_FINAL_VERIFICATION_START -->

| Команда                           | Результат                                                                  |
| --------------------------------- | -------------------------------------------------------------------------- |
| `npm test`                        | **PASS** — все workspace suites; Playground: 36 tests                      |
| `npm run verify`                  | **PASS** — полный clean-install и release gate                             |
| `npm run typecheck`               | **PASS** — восемь packages и showcase                                      |
| `npm run lint:all`                | **PASS** — source/styles/HTML/data и 296 Markdown files                    |
| `npm run build`                   | **PASS** — восемь публикуемых packages                                     |
| `npm run build:demo`              | **PASS** — production showcase, 385 modules                                |
| `npm run prepublish:all`          | **PASS** — build и dry-run pack всех восьми packages                       |
| `npm run check:docs`              | **PASS** — 296 Markdown, 58 catalog API, 8 package README                  |
| `npm run check:docs:examples`     | **PASS** — 207 fixtures и 3 path-containment tests                         |
| `npm run check:package-contracts` | **PASS** — 8 publishable manifests и built exports                         |
| `npm run check:packed-consumers`  | **PASS** — npm 11.9.0, pnpm 10.34.5 и Yarn 1.22.22                         |
| `npm run audit:release`           | **PASS** — 0 production; принят один low dev-only `tsup`/`esbuild` finding |
| `npm run visual:phase2`           | **PASS** — 16 snapshots, 8 CVD, 0 browser/network errors                   |
| `git diff --check`                | **PASS**                                                                   |

<!-- PHASE5_FINAL_VERIFICATION_END -->

## 11. Remaining Risks

Известного локального documentation/runtime defect, блокирующего release candidate, не осталось.
Следующие риски нельзя честно закрыть до публикации или на одной macOS workstation:

- npm Trusted Publishing, provenance, signatures, integrity, registry propagation и dist-tags;
- fresh registry-only npm/pnpm/Yarn installation после появления всех восьми target versions;
- фактическое создание GitHub Releases и доступность новых repository-relative links после push;
- deployment и rendering hosted documentation: repository не содержит его generator/config;
- Nuxt end-to-end, streaming SSR, edge runtimes и framework-specific Teleport integration;
- VoiceOver, NVDA и JAWS speech/browse-mode behavior;
- native Windows High Contrast и platform focus rendering;
- Firefox/WebKit automation, Windows/Linux browser matrix и реальный 400% zoom/reflow pass;
- Yarn Berry Plug'n'Play и полная Vite 7/8 compatibility matrix, которые не входят в текущую
  заявленную consumer certification;
- deferred Playground TypeScript compiler остаётся примерно 3.61 MB minified / 1.03 MB gzip и
  контролируется budget, но загружается при запуске sandbox;
- принятый Phase 4 low dev-only advisory в `tsup`/`esbuild` остаётся вне production package graph.

Release owner должен выполнить topological publication и stop после первого failed registry smoke.
Hosted docs следует развернуть с тем же release commit до announcement. Platform/accessibility
риски требуют ручной фиксации результатов в release issue; их отсутствие нельзя вывести из
unit/DOM tests.

## 12. Final Recommendation

### Documentation Ready — да

Новый пользователь получает согласованный путь installation → CSS → Core plugin → ThemeProvider →
component → production build. Все package README имеют обязательный контракт, component API
сверяется с source, локальные links/anchors и public imports проверяются автоматически, а runnable
examples компилируются и typecheck-ятся.

### Release Ready — да

Документация, migration path, release notes, announcement assets и локальные tarball consumers
согласованы с stable release train. Изменения Phase 5 не расширяют публичный API, не меняют CSS или
визуальную систему; runtime correction восстанавливает заявленное поведение существующего prop.
Перед созданием следующего package tag обязательны hosted-docs deploy и последовательные
registry/provenance checks из release checklist.

### Production Ready — да для release artifact в пределах заявленной support matrix

VueForge имеет полный локальный release gate для tests, types, builds, package contracts, real
tarballs, npm/pnpm/Yarn consumers, SSR, tree shaking, deferred budgets и documentation examples.
Поэтому известного инженерного blocker для production use нет.

Статус не является обещанием непроверенных платформ. GA rollout считается завершённым только после
успешной публикации всех восьми packages, registry-only ecosystem smoke, deployment документации и
явного принятия manual accessibility/browser risks. До выполнения этих внешних шагов корректная
операционная формулировка — **production-ready release candidate**, готовый к последовательной GA
публикации.
