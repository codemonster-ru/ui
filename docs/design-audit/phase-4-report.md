# VueForge — Phase 4: аудит публикации, упаковки и дистрибуции

Дата подготовки: 2026-07-23. Область аудита: восемь публикуемых npm-пакетов VueForge,
их dependency graph, package metadata, exports, tarballs, consumer-сценарии, bundle delivery,
release automation и документация обновления.

## 1. Executive summary

Phase 4 проверила VueForge в том виде, в котором библиотеку увидит внешний потребитель: не через
workspace aliases и исходники monorepo, а через реальные tarballs, чистую установку и только
заявленные package exports.

До исправлений локальные сборки и тесты не гарантировали корректную публикацию. Были подтверждены
следующие объективные release-дефекты:

- часть browser entrypoints с автоматическим CSS выбиралась также прямым Node ESM import и была
  непригодна для SSR без CSS loader;
- CommonJS runtime и его TypeScript declarations разрешались через разные module systems;
- опубликованные declarations содержали extensionless relative imports, CSS side-effect imports и
  ссылки на локальные dependency shims;
- `main`, `module` и `types` у CodeBlock и Playground расходились с намеренно отсутствующим modern
  root export и требовали явного решения о legacy compatibility;
- Layouts собирал full stylesheet, но не экспортировал его как `./styles.css`;
- внутренние dependency floors допускали установку пакетов до Phase 0–3, несовместимых с текущей
  сборкой;
- Shiki ошибочно оставался production dependency CodeBlock, хотя runtime использует уже собранные
  deferred chunks;
- package manager, engine, repository и side-effect metadata были неполными или неодинаковыми;
- release workflow не фиксировал npm toolchain и не различал stable/prerelease dist-tags;
- release toolchain удерживал уязвимые транзитивные patch-версии и не имел security gate для
  production graph и high/critical development advisories;
- lockfile допускал невалидный Vue companion graph: `vue@3.5.35` мог получить deduplicated
  `@vue/compiler-dom`/`@vue/shared@3.5.33`, а clean-install gate не запускал `npm ls`;
- не существовало одного автоматического контракта, проверяющего все manifests, exports, tarballs,
  TypeScript modes, SSR и package-manager consumers.

После исправлений все восемь пакетов имеют согласованный release train, существующие export targets,
CSS-free Node paths, корректные declaration conditions и воспроизводимую publication sequence. Реальные
tarballs успешно установлены и использованы в чистых consumers через npm 11.9.0, pnpm 10.34.5 и Yarn
Classic 1.22.22.

Phase 4 не меняла component markup, component CSS, публичные design tokens, значения палитры или
визуальное поведение. Единственное изменение runtime-source — локализация публичной структурной формы
типов `useFloating`, чтобы declarations Core не переносили в consumer дефектные внутренние specifiers
стороннего пакета; выполняемый runtime-код и допустимые placement/strategy values не изменены.

Рекомендуемый статус после этой фазы — **Ready for Stable Release** в границах packaging и
distribution. Registry smoke, provenance/integrity и остановка train при первом сбое остаются
обязательными шагами самого release process: их невозможно выполнить до появления первого пакета в
registry, но для них есть последовательный gate и rollback plan.

## 2. Package graph

Публикуемый граф состоит ровно из восьми пакетов:

```text
@codemonster-ru/vueforge-theme ───────────────┐
                                              ├──► vueforge-core ───► vueforge-layouts
@codemonster-ru/vueforge-icons ───────────────┘          │
             │                                           ├──► vueforge-playground
             └──► vueforge-codeblock ────────────────────┘             ▲
                                                                        │
@codemonster-ru/vueforge-playground-core ───────────────────────────────┘

@codemonster-ru/vueforge-playground-vite-plugin
  independent build-time integration; Vite is a peer
```

`vueforge-layouts` также напрямую зависит от Theme, а Playground — от Core, CodeBlock и Playground
Core. Циклических внутренних runtime/peer-зависимостей нет.

### Manifest consistency

| Пакет                  | Export keys | Root JS                            | Module delivery | CSS delivery                               | Node engine |
| ---------------------- | ----------: | ---------------------------------- | --------------- | ------------------------------------------ | ----------- |
| Theme                  |           1 | Да                                 | ESM             | Нет собственного CSS entry                 | `>=18`      |
| Icons                  |           2 | Да                                 | ESM + CJS       | Browser auto + `style.css`                 | `>=18`      |
| Core                   |          85 | Да                                 | ESM + root CJS  | Full, 38 component и 4 support CSS entries | `>=18`      |
| Layouts                |          40 | Да                                 | ESM + root CJS  | Full и 21 granular entries                 | `>=18`      |
| CodeBlock              |           6 | Нет, только `/view` и `/highlight` | ESM + CJS       | Auto `/view` + 4 explicit entries          | `>=20`      |
| Playground Core        |           1 | Да                                 | ESM             | Нет                                        | `>=18`      |
| Playground Vite Plugin |           1 | Да                                 | ESM             | Нет                                        | `>=18`      |
| Playground             |           6 | Нет, только `/ui` и `/runtime`     | ESM             | Auto `/ui` + 4 explicit entries            | `>=20`      |

Для каждого пакета проверены `name`, `description`, `license`, `author`, `keywords`, `files`,
`publishConfig`, `repository`, `repository.directory`, `homepage`, `bugs`, `engines` и export map.
Все packages публикуют только `dist` и имеют `publishConfig.access: public`. README, LICENSE и
`package.json` добавляются npm автоматически и присутствуют в dry-run tarballs.

Funding metadata отсутствует у всех пакетов. Это не скрытая несогласованность: в проекте не задан
официальный funding URL, поэтому добавление фиктивного значения было бы хуже осознанного отсутствия.
Отдельное поле `browser` не требуется: browser bundlers получают `exports.import.default`, а CSS-free
SSR получает более приоритетный `exports.import.node` там, где browser entry имеет side effect.

CodeBlock и Playground с major 3 и 2 соответственно по-прежнему не объявляют modern root export:
поддерживаемый API использует явные subpaths. Их существующие `main`/`module`/`types` сохранены как
совместимость для старых resolvers, игнорирующих `exports`, и указывают на реальные artifacts. Это не
расширяет modern package API и не ломает legacy consumers в minor release.

## 3. Dependency audit

### Runtime and peer edges

| Пакет                  | Production dependencies                                      | Peer dependencies                     |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------- |
| Theme                  | —                                                            | —                                     |
| Icons                  | —                                                            | Vue `^3.5.0`                          |
| Core                   | Floater `^1.0.8`, Theme `^1.4.0`, Icons `^1.6.0`             | Vue `^3.5.0`                          |
| Layouts                | Theme `^1.4.0`                                               | Core `^1.36.0`, Vue `^3.5.0`          |
| CodeBlock              | Icons `^1.6.0`                                               | Vue `^3.5.0`                          |
| Playground Core        | TypeScript `^5.8.2`                                          | —                                     |
| Playground Vite Plugin | —                                                            | Vite `^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0` |
| Playground             | Core `^1.36.0`, CodeBlock `^3.7.0`, Playground Core `^1.2.0` | Vue `^3.5.0`                          |

`optionalDependencies` не используются. Vue остаётся peer у Vue-компонентов, чтобы consumer владел
единственным application runtime. Core является peer Layouts, потому что Layouts использует его
публичные contracts, но не должен устанавливать вторую копию UI layer. Vite является peer build-time
plugin. TypeScript намеренно остаётся production dependency Playground Core: браузерный sandbox
реально загружает compiler runtime по требованию.

Объективные cleanup-изменения:

- `shiki` перенесён из production dependencies CodeBlock в devDependencies вместе с прямыми
  `@shikijs/core` и `@shikijs/langs`: библиотечная сборка уже содержит lazy chunks, а чистый consumer
  не должен повторно устанавливать исходный Shiki graph;
- Icons теперь явно объявляет Sass compiler, используемый его Vue sources: прежде clean build
  случайно зависел от транзитивного dev dependency другого инструмента;
- удалены неиспользуемые CodeBlock devDependencies на Core, Layouts и Sass;
- добавлены фактически используемые audit/build dependencies Icons, Core, Layouts, Playground,
  Playground Core и Vite plugin;
- удалён root override `vue-router`, которого нет в фактическом install graph;
- sibling packages в devDependencies по-прежнему используют явные `file:../...`, а publishable
  runtime/peer edges — только SemVer ranges.

Root `markdownlint-cli2` обновлён до 0.23.1; устаревшие global overrides `js-yaml@4.2.0` и
`markdown-it@14.2.0` удалены, чтобы зависимости получали поддерживаемые исправленные версии. Lockfile
также поднял уязвимые `brace-expansion`, `fast-uri` и `linkify-it` в рамках объявленных ranges.
`npm audit --omit=dev` сообщает 0 vulnerabilities, а `npm audit --audit-level=high` проходит. Полный
audit оставляет один принятый low dev-only advisory в `tsup → esbuild`; он описан в remaining risks.
Deprecated `glob@10.5.0` и `whatwg-encoding@3.1.1`, видимые при чистой установке, разрешаются только
через test/dev tooling и не входят ни в один consumer tarball.

Vue companion resolution в lockfile выровнен: runtime `vue@3.5.35` получает точные compiler/shared
3.5.35, а совместимые 3.5.33 остаются изолированы внутри development language-tooling branches.
`npm ls --all` проходит и теперь выполняется автоматически сразу после временного clean `npm ci`,
поэтому повторная невалидная дедупликация блокирует `verify` до тестов и сборки.

Автоматический graph contract проверяет все внутренние edges во всех трёх runtime fields, точные
минимальные версии release train и отсутствие cycles. Packed consumer дополнительно доказывает, что
каждый установленный пакет находится вне monorepo и что production graph не содержит Shiki.

## 4. Versioning

Предыдущие версии из левого столбца опубликованы в npm, а все пакеты получили публично значимые
изменения в Phase 0–3 или packaging corrections в Phase 4. Поэтому подготовлен согласованный minor
release train:

| Пакет                  | Опубликованная версия | Следующая версия | Основание                                                  |
| ---------------------- | --------------------: | ---------------: | ---------------------------------------------------------- |
| Theme                  |               `1.3.0` |          `1.4.0` | Расширенный theme/token contract и release metadata        |
| Icons                  |               `1.5.0` |          `1.6.0` | SSR-safe Node/CJS delivery и declaration contract          |
| Core                   |              `1.35.1` |         `1.36.0` | Phase 0–3 contracts, exports и SSR package paths           |
| Layouts                |              `1.21.0` |         `1.22.0` | Исправленные component types, full CSS export и Node paths |
| CodeBlock              |               `3.6.1` |          `3.7.0` | SSR/deferred runtime и package dependency correction       |
| Playground Core        |               `1.1.1` |          `1.2.0` | Runtime hardening и additive contracts                     |
| Playground Vite Plugin |               `0.1.1` |          `0.2.0` | Additive typings/naming и package metadata                 |
| Playground             |               `2.5.1` |          `2.6.0` | Runtime/UI hardening и explicit SSR paths                  |

На дату аудита все восемь target versions свободны в npm registry. Major bump не требуется в принятой
compatibility policy: ни один documented modern export, prop, event или token не удалён, а legacy root
metadata CodeBlock/Playground сохранены. Новые `engines` фиксируют уже фактические floors toolchain и
Shiki 4 (`>=20` для CodeBlock/Playground), а не удаляют поддерживаемый runtime. Vue `^3.5.0` фиксирует
фактическое требование согласованного graph. Для pre-1.0 Vite plugin переход `0.1.1` → `0.2.0` выбран
явно; additive изменение достаточно значимо для pre-stable minor.

Internal dependency floors указывают на версии из этой таблицы. Это исключает ситуацию, когда новый
Playground или Layouts устанавливается с более старым Core/Theme, который не содержит требуемых
Phase 0–3 contracts.

Stable tags публикуются под npm dist-tag `latest`; SemVer prerelease tags — под `next`. Это поведение
закреплено отдельными tests release-preparation script.

## 5. Packaging

### Export architecture

Browser ESM component subpaths Core/Layout, Icons root, CodeBlock `/view` и Playground `/ui` сохраняют
автоматическое подключение CSS. Для прямого Node ESM import добавлены CSS-free `node` conditions.
CommonJS существует только для реально поддерживаемых surfaces:

- Icons root;
- Core root, `/foundation`, `/theme`;
- Layouts root;
- CodeBlock `/view`, `/highlight`.

У каждого CJS runtime теперь есть `.d.cts` facade. ESM types остаются `.d.ts`; `types` расположен внутри
соответствующей `import`/`require` ветки до runtime conditions. Core и Layouts component subpaths,
CodeBlock `/view`, Playground `/ui` и Icons root выбирают CSS-free Node artifact без изменения browser
default.

Theme, Playground Core и Playground Vite Plugin являются осознанно ESM-only. Playground UI/runtime
не заявляет CommonJS. Legacy Node 10 resolution не обещан и не имитируется compatibility wrappers.

Общий build finalizer делает generated declarations пригодными для современного Node resolution:

- разрешает relative declaration target до файла или directory index;
- добавляет runtime-safe `.js`/`index.js` specifier;
- удаляет бессмысленные CSS side-effect imports из `.d.ts`;
- аварийно завершает build, если небезопасный specifier остаётся.

На полном build нормализовано 4 specifiers Icons, 242 Core, 65 Layouts, 15 CodeBlock и 6 Playground;
из Playground declarations удалены 3 CSS imports. Core/Layout build дополнительно исключает workspace
dependency shims из опубликованного declaration graph.

### Tarball inventory

| Пакет                        | Файлов | Packed bytes | Unpacked bytes |
| ---------------------------- | -----: | -----------: | -------------: |
| Theme 1.4.0                  |     27 |        9,267 |         38,374 |
| Icons 1.6.0                  |     19 |      130,960 |        587,402 |
| Core 1.36.0                  |    530 |      289,147 |      2,119,117 |
| Layouts 1.22.0               |    109 |       39,561 |        275,666 |
| CodeBlock 3.7.0              |     53 |      371,637 |      1,982,163 |
| Playground Core 1.2.0        |      5 |        7,864 |         25,277 |
| Playground Vite Plugin 0.2.0 |      5 |        3,043 |          8,623 |
| Playground 2.6.0             |     17 |       13,043 |         54,311 |

Для каждого tarball подтверждено наличие всех targets из `exports`, `main`, `module`, `types` и
`style`; отсутствующих targets — 0. `files: ["dist"]` не пропускает tests, source aliases или
workspace-only files.

Дополнительно все восемь архивов были созданы по одному разу вне workspace и переданы как точные
`.tgz` в `npm publish <archive> --dry-run --ignore-scripts`; каждый dry-run прошёл. Это локально
подтверждает тот же immutable-artifact path, который использует release workflow.

Publint не находит ошибок ни в одном пакете. Два предупреждения фиксируют намеренное различие:
CodeBlock и Playground сохраняют legacy `main`, но не добавляют modern root export после major 3/2.
Are The Types Wrong проходит для всех JavaScript entrypoints в Node16 ESM и bundler modes, а также для
всех заявленных CJS branches. Оставшиеся 296 `NoResolution` cells относятся к 74 CSS subpaths в
четырёх TypeScript modes: инструмент рассматривает их как TypeScript imports, хотя файлы физически
присутствуют в tarballs и предназначены для CSS loaders. Это tool limitation, а не потерянный export.

### Changed file groups

- package contracts: root `package.json`/lockfile и восемь package manifests;
- generated artifact logic: Vite configs Core, Layouts, Icons, CodeBlock и declaration finalizer;
- release gates: package-contract, packed-consumer, tree-shaking, deferred-runtime и tag-preparation
  scripts/tests;
- automation: `.github/workflows/release-from-tag.yml`;
- user guidance: README/CHANGELOG каждого пакета, installation guides, migration guide, release notes
  и release checklist;
- one type-only source correction: `packages/core/src/composables/useFloating.ts`.

CSS и Vue component implementation files в Phase 4 не изменялись.

## 6. Consumer verification

Один и тот же сценарий запускается для npm, pnpm и Yarn вне workspace. Fixture создаётся в system
temporary directory, собирает восемь реальных `.tgz`, устанавливает только их и после проверки
удаляется. До появления новых версий в registry pnpm overrides и Yarn resolutions указывают
транзитивные internal ranges на те же локальные tarballs; это моделирует атомарно доступный release
train, не подменяя package contents workspace links. npm и Yarn caches также изолированы внутри
fixture, чтобы повторный прогон не мог получить архив с тем же version/path от предыдущей сборки.

| Сценарий        | Версии                                                | Результат |
| --------------- | ----------------------------------------------------- | --------- |
| npm install     | npm 11.9.0                                            | PASS      |
| pnpm install    | pnpm 10.34.5, strict peers                            | PASS      |
| Yarn install    | Yarn Classic 1.22.22                                  | PASS      |
| Framework       | Vue + server renderer 3.5.35                          | PASS      |
| TypeScript      | 5.9.3, Bundler + NodeNext, `skipLibCheck: false`      | PASS      |
| Browser build   | Vite 6.4.3                                            | PASS      |
| Node ESM SSR    | Все public JS ESM specifiers и все UI packages        | PASS      |
| CommonJS SSR    | Все заявленные `require` branches без DOM shim        | PASS      |
| Minimum engines | Node 18.20.8 и Node 20.x ESM/CJS entry smoke          | PASS      |
| CSS             | Representative auto CSS + все 74 explicit CSS exports | PASS      |
| Isolation       | Нет resolution в monorepo, версии graph точны         | PASS      |

Consumer импортирует только specifiers, доступные через опубликованный `exports`. Он отдельно проверяет
direct CSS entries, browser auto-CSS, Node CSS-free entries, CodeBlock `/view`/`/highlight`, Playground
`/ui`/`/runtime`, Vite plugin и SSR render. Ни один тест не использует source alias или `dist` другого
workspace-пакета.

Полная registry installation остаётся post-publish gate: локальный tarball может доказать package
contents и resolution semantics, но не npm dist-tag, registry replication, provenance или integrity
metadata.

## 7. Tree shaking

Regression gate покрывает один компонент, несколько компонентов, namespace import, granular subpath и
CSS side effects.

| Import scenario                         | Minified JS raw |   JS gzip | Результат                    |
| --------------------------------------- | --------------: | --------: | ---------------------------- |
| Core root → `VfButton`                  |        2.22 KiB |  1.01 KiB | PASS                         |
| Core `/button`                          |        2.00 KiB |  0.91 KiB | PASS, button CSS retained    |
| Core root → Button + Dialog + DataTable |       25.66 KiB |  8.56 KiB | PASS                         |
| Core full namespace                     |      201.44 KiB | 45.81 KiB | Expected full API            |
| Layouts root → `VfContainer`            |        0.91 KiB |  0.54 KiB | PASS                         |
| Layouts `/container`                    |        0.91 KiB |  0.54 KiB | PASS, container CSS retained |

В packed consumer независимая Vite build одного Core Button дала 2,769 bytes JS / 1,064 bytes gzip и
10.27 kB CSS / 1.78 kB gzip. Button CSS сохранён, Accordion CSS отсутствует. Таким образом precise
`sideEffects` не позволяет bundler удалить нужные styles и не удерживает unrelated component styles.

Small imports также проверяются на отсутствие OKLCH palette graph и theme application runtime.
Автоматические CSS wrappers помечены side-effectful точечно; Theme, Playground Core и Vite Plugin
помечены `sideEffects: false`. Generic Icons renderer по своей природе включает dynamic-name catalog
(около 24.18 KiB gzip); для статически известного icon это осознанная API-модель, а не потеря tree
shaking во всём VueForge graph.

## 8. Bundle analysis

Vite warning о chunk больше 500 kB воспроизводится и локализован. Его источник — TypeScript compiler,
который Playground Core загружает для браузерной sandbox compilation:

- minified chunk: 3.61 MB;
- gzip: 1,009.52 KiB;
- около 99.6% содержимого относится к TypeScript;
- chunk загружается только после активации sandbox session;
- initial application graph не содержит TypeScript, Playground runtime или Shiki.

Предупреждение не маскируется повышением глобального `chunkSizeWarningLimit`: это скрыло бы будущие
регрессии других chunks. Ручное разбиение compiler internals не уменьшает суммарную загрузку и может
увеличить request/parse overhead. Объективной причины менять runtime в Phase 4 нет; вместо этого
установлен отдельный deferred compiler budget 1,100 KiB gzip и проверка отсутствия compiler в static
route graph.

Showcase initial entry составляет 90.24 KiB gzip при budget 95 KiB. Route chunks: Core 23.56 KiB,
Layouts 10.42 KiB, Icons 1.32 KiB, CodeBlock 2.00 KiB, Playground 3.97 KiB gzip. CodeBlock route не
включает Shiki статически; суммарные Shiki-related deferred chunks составляют около 174.81 KiB gzip.

Итог: large compiler chunk влияет на download/parse только при запуске Playground, не увеличивает
базовый VueForge runtime и не свидетельствует о неработающем tree shaking. Его размер должен
оставаться наблюдаемым отдельным budget, а не блокировать Core/Layout consumers.

## 9. Installation UX

README всех восьми пакетов и основные installation guides теперь описывают одинаковый contract:

- package-specific Node requirement и Vue/Vite peer requirement;
- команды npm, pnpm и Yarn;
- полный и granular import paths;
- browser auto-CSS, explicit full CSS и CSS-free Node conditions;
- SSR placement CSS imports в client entry;
- CodeBlock `/view` и `/highlight` вместо несуществующего root import;
- Playground `/ui`, `/runtime`, component mode и lazy sandbox behavior;
- Theme runtime usage и Vite virtual modules.

Для обычного Core consumer обязательны только установка Vue/Core и один выбранный CSS strategy.
Layouts может использовать единый новый `@codemonster-ru/vueforge-layouts/styles.css` вместо знания
внутреннего dist path. CodeBlock и Playground явно разделяют UI и runtime, поэтому server build не
должен угадывать browser entry.

Упрощение не потребовало нового facade package, global setup или fallback API. Modern resolvers
однозначно используют documented subpaths CodeBlock/Playground, а прежние `main`/`module`/`types`
оставлены только для legacy resolvers. Documented imports одинаковы в Vite, TypeScript и Node.

## 10. Migration

Создан единый [migration guide](../migration-guide.md) для coordinated release train. Он включает:

- таблицу всех версий, Node/Vue/Vite и внутренних floors;
- команду согласованного обновления packages;
- требование обновлять Vue и `@vue/server-renderer` вместе до 3.5;
- явные CodeBlock и Playground subpaths;
- правила browser/SSR CSS;
- Icons CommonJS correction и explicit client CSS;
- совместимость token names и сохранённые legacy aliases;
- список исправленных behavior contracts, которые стоит перепроверить приложению.

Документ не объявляет packaging correction фиктивным redesign. Публичные token names не переименованы,
публичные component exports не удалены, Phase 4 не меняет OKLCH values. Accidental malformed CSS custom
property spellings старого serializer не обещаются как API; canonical token names и legacy aliases,
закреплённые после Phase 0, остаются.

Release notes и package CHANGELOGs разделяют breaking changes, compatibility requirements, новые
возможности и исправления. Единственные обязательные migration actions — соблюдать Vue/Node floors,
использовать уже документированные subpaths CodeBlock/Playground и импортировать CSS на client side
для Node/CJS scenarios.

## 11. Release checklist

Канонический [release checklist](../release-checklist.md) охватывает:

1. выбор `latest` или `next`;
2. чистый release commit и matching package/tag/changelog versions;
3. полный repository verification sequence;
4. dry-run, создание и ручную инспекцию каждого tarball;
5. повторные clean consumers npm/pnpm/Yarn;
6. последовательную публикацию в topological order;
7. post-publish registry, provenance, integrity и signature smoke;
8. rollback через dist-tag/deprecation и forward patch;
9. финальную проверку всех восьми registry packages.

Порядок публикации:

1. Theme 1.4.0;
2. Icons 1.6.0;
3. Playground Core 1.2.0;
4. Playground Vite Plugin 0.2.0;
5. Core 1.36.0;
6. CodeBlock 3.7.0;
7. Layouts 1.22.0;
8. Playground 2.6.0.

GitHub workflow принимает только scoped tag формата `@scope/package@x.y.z`, сверяет package version и
непустой matching CHANGELOG section, запускает полный `verify` со всеми тремя package managers, один
раз создаёт target `.tgz`, инспектирует его через publish dry-run и публикует именно тот же файл с
`--provenance`, explicit access и вычисленным dist-tag. Повторная lifecycle-пересборка между inspection
и publication исключена. Prerelease version также помечает GitHub Release как prerelease. Node 24 и
npm 11.9.0 зафиксированы; workflow actions используют Node 24 majors. Глобальная concurrency не
позволяет двум package publications выполняться одновременно.

Rollback не использует unpublish как основной путь: останавливается train, `latest`/`next`
возвращается на известную рабочую версию, дефектная версия deprecate-ится и выпускается forward patch.

### Final verification matrix

<!-- PHASE4_FINAL_VERIFICATION_START -->

| Команда                           | Статус                                                      |
| --------------------------------- | ----------------------------------------------------------- |
| `npm test`                        | PASS                                                        |
| `npm run audit:release`           | PASS — production 0; high/critical tooling 0; one low noted |
| `npm run verify`                  | PASS — clean install and complete release gate              |
| `npm run typecheck`               | PASS                                                        |
| `npm run lint:all`                | PASS — 291 Markdown files                                   |
| `npm run build`                   | PASS — all eight packages                                   |
| `npm run build:demo`              | PASS                                                        |
| `npm run prepublish:all`          | PASS — eight package dry-runs                               |
| `npm run check:package-contracts` | PASS — eight manifests and built exports                    |
| `npm run check:packed-consumers`  | PASS — final npm/pnpm/Yarn repeat                           |
| `git diff --check`                | PASS                                                        |

<!-- PHASE4_FINAL_VERIFICATION_END -->

## 12. Remaining risks

Не осталось известного дефекта package contents или export resolution, блокирующего beta. Остаются
риски, которые нельзя корректно закрыть локальной prepublication проверкой:

- новые versions ещё не существуют в npm, поэтому dist-tags, registry replication, provenance,
  integrity, signatures и registry-only transitive resolution проверяются после публикации каждого
  пакета;
- npm Trusted Publisher и ownership каждого scoped package являются внешней настройкой registry;
  release owner должен подтвердить привязку именно к `.github/workflows/release-from-tag.yml`;
- Yarn проверен в поддерживаемом Classic 1.22 mode; Yarn Berry Plug'n'Play не заявлен отдельным
  compatibility target и требует отдельной сертификации, если проект решит его обещать;
- packed browser consumer проверен на Vite 6.4.3; заявленный peer range также допускает Vite 7/8,
  которые остаются отдельной compatibility matrix для последующей сертификации;
- latest `tsup@8.5.1` разрешает `esbuild@0.27.7`, для которого зарегистрирован один low advisory,
  относящийся к Windows development server. В VueForge этот dependency используется только командой
  build и отсутствует в production package graph; принудительный переход на `esbuild@0.28.1` не
  выполнен, потому что он находится вне объявленного `tsup` range. Security gate блокирует все
  production и high/critical tooling advisories, а этот pin нужно снять штатным обновлением `tsup`;
- локальный финальный прогон выполняется на Node 24/macOS, CI — на Node 24/Linux; заявленные minimum
  Node 18/20 entrypoints прошли отдельный runtime smoke, но полный cross-platform test matrix не
  заменён одним workstation run;
- Are The Types Wrong не моделирует CSS loaders и поэтому продолжает показывать ожидаемые CSS
  `NoResolution`; JS/types resolution при этом зелёный;
- intentional ESM-only packages и component subpaths не получают искусственный CommonJS facade;
  consumer должен соблюдать exports matrix;
- TypeScript compiler Playground остаётся крупным deferred payload и требует наблюдения по отдельному
  budget;
- Phase 3 platform risks — Firefox/WebKit, Windows High Contrast, native zoom и реальные assistive
  technologies — не становятся закрытыми от package audit;
- hosted documentation должна быть задеплоена с этим release train; локальные docs сами по себе не
  обновляют уже опубликованный сайт.

Operational mitigation для подготовленного stable train: публиковать строго по одному пакету в
topological order, после каждого шага выполнять registry smoke и немедленно останавливать train при
ошибке. Если команда отдельно решит провести canary, тот же workflow поддерживает SemVer prerelease под
`next`, но подготовленные в manifests/changelogs версии являются stable и предназначены для `latest`.

## 13. Overall release readiness

### Ready for Internal Release — да

Все package contracts, builds, tests, packed installs, SSR paths, types и tarball contents проверяются
автоматически. Внутренний релиз не имеет известных blocker-ов; package graph и rollback procedure
однозначны.

### Ready for Public Beta — да

Публичная beta при желании может быть опубликована под `next`: consumers npm/pnpm/Yarn проходят на
реальных tarballs, documentation и migration path готовы, large payload изолирован, а публичные
component/token contracts не удалены. Это доступный дополнительный этап, но не обязательный вывод
аудита.

### Ready for Stable Release — да, рекомендуемый итоговый статус

Подготовленный train использует stable SemVer versions и не имеет известного local release blocker.
Exact tarball publication, cross-manager packed consumers, SSR/type resolution, dependency floors,
package contracts и changelog extraction автоматизированы; migration и rollback подробно
документированы. Поэтому с точки зрения Phase 4 система готова к stable release.

В ходе публикации обязательны следующие stop-the-line gates:

1. все восемь packages публикуются последовательно и получают provenance/integrity;
2. полный consumer повторён только с registry versions;
3. подтверждены npm dist-tags и internal dependency resolution;
4. при первом installation/SSR regression дальнейшие tags не создаются;
5. hosted documentation развёрнута, а оставшиеся platform risks явно приняты release owner.

Эти проверки являются частью stable rollout, а не основанием публиковать уже подготовленные stable
versions как beta. Итоговая оценка Phase 4: **Ready for Stable Release**.
