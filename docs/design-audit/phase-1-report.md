# VueForge: отчёт о реализации Phase 1

Дата завершения: 2026-07-22. Статус: **primitive/semantic architecture внедрена; переход к Phase 2 не выполнялся**.

## Scope и результат

Phase 1 добавила целевой primitive и semantic color contract поверх исправленной в Phase 0 delivery infrastructure. Все существующие VueForge 1.x tokens, palette values, component styles и public component APIs сохранены.

```text
До Phase 1
847 flat preset keys
└── 35 перегруженных root color roles
    └── component aliases and direct component references

После Phase 1
current 1.x component aliases ───────────┐
                                        ├─→ legacy color roots ─→ 29 primitives
77 semantic roles ───────────────────────┘

Phase 2 target: component decisions ─→ semantic roles
```

Built-in preset теперь содержит 952 keys. `colorFocusRing` уже входил в legacy contract и одновременно является semantic role, поэтому 29 primitives + 77 roles дают 105, а не 106 уникальных additions.

## Количественный контракт

| Contract                               | Количество |
| -------------------------------------- | ---------: |
| Primitive tokens                       |     **29** |
| Semantic roles                         |     **77** |
| Новые semantic keys                    |     **76** |
| Сохранённые legacy keys                |    **847** |
| Уникальные additions                   |    **105** |
| Полный built-in preset                 |    **952** |
| Legacy dark overrides                  |     **53** |
| Максимальная canonical alias depth     |      **4** |
| Максимальная custom-prefix alias depth |      **9** |

## Primitive architecture

Добавлены семь sparse material families:

- neutral: 16 stops;
- primary, success, info, danger и help: по два stops;
- warning: три stops, включая тёмный on-solid material.

Все 29 значений уже существовали в текущем preset или его black-alpha recipes. Phase 1 не создаёт промежуточные оттенки и не преобразует runtime source в OKLCH, поэтому исходный sRGB output сохраняется без rounding drift. Primitives mode-independent: light/dark выбирают разные существующие stops через compatibility roots. Hue и chroma не нормализуются; numeric steps фиксируют приблизительный baseline lightness order, а не новую интерполированную шкалу. Neutral `0`/`1000` остаются white/black extremes, `warning950` — отдельным on-solid material.

Полная таблица приведена в [Color Tokens guide](../core/guides/color-tokens.md).

## Semantic architecture

| Категория   |   Роли |
| ----------- | -----: |
| Background  |     11 |
| Text        |      6 |
| Icon        |      4 |
| Border      |      8 |
| Interactive |      8 |
| Status      |     40 |
| **Итого**   | **77** |

Status contract одинаков для success, warning, danger, info и help:

```text
solid background / solid foreground
subtle background / subtle foreground
border / icon
hover background / active background
```

Foreground и solid background имеют разные public names, даже если на Phase 1 временно разрешаются в один primitive. Это отделяет архитектурную миграцию от будущей accessibility palette.

`help` сохранён как самостоятельная family: это отдельный публичный tone Button, IconButton, Badge, Tag, Alert, ProgressBar, ProgressSpinner и text utility. Его объединение с `info` было бы и semantic, и visual breaking change.

## Legacy mapping и совместимость 1.x

Ни один из 847 legacy keys не удалён и не переименован. Default bridge однонаправлен. Phase 1 не вставляет semantic layer в уже существующие component chains:

```text
semantic role ───────────┐
                        ├─→ legacy root → primitive
current component alias ┘

Phase 2 component migration: component decision → semantic role
```

Поэтому прежний override `colorPrimary`, `colorMuted`, `colorBorder` или status root продолжает влиять на semantic aliases. Reverse alias для той же пары запрещён, чтобы не создать цикл.

Основной mapping:

| Legacy family                                  | Semantic target                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `colorBg`, `colorSurface`, `colorSurfaceMuted` | canvas/surface/subtle/elevated/disabled backgrounds                     |
| `colorText`, `colorMuted`                      | раздельные text/icon primary/secondary/muted/disabled/placeholder roles |
| `colorBorder`                                  | subtle/default/strong/interactive/disabled/divider borders              |
| `colorPrimary*`                                | interactive backgrounds/foreground/border, focus/selection roles        |
| `colorContrast*`                               | inverse background/text/icon/border roles                               |
| `overlayBackdrop`                              | `colorBackgroundBackdrop`                                               |
| `{success,warn,danger,info,help}*`             | соответствующий восьмиролевой status contract                           |

Canonical exact-name mapping хранится и тестируется во внутренней Core schema; пользовательская группировка и status formula приведены в [Color Tokens guide](../core/guides/color-tokens.md). Mapping охватывает 36 compatibility sources (35 legacy color roots и `overlayBackdrop`) и 74 direct semantic targets. Ещё три surface roles (`hover`, `active`, `selected`) являются multi-source recipes и потому не приписаны одному legacy source.

Новые primitive и semantic fields являются additive/optional в public preset type. Это сохраняет source compatibility существующих complete custom presets. Core components не мигрированы массово: текущие component aliases продолжают работать как раньше, а Phase 2 должна использовать semantic roles с legacy fallback на период 1.x.

## Alias graph

До Phase 1 canonical preset не имел циклов, его максимальная глубина была равна трём. Primitive bridge увеличил разрешённую logical depth до четырёх. Custom-prefix compatibility из Phase 0 добавляет canonical/requested namespace hops и ограничен глубиной девять.

Автоматический graph validator отклоняет:

- ссылку на неизвестную custom property;
- self-reference;
- прямой или транзитивный цикл;
- canonical/custom-prefix chain выше согласованного лимита.

## Public additive changes

`@codemonster-ru/vueforge-theme` экспортирует:

- `vfPrimitiveColorTokenNames`;
- `vfSemanticColorTokenNames`;
- `VfPrimitiveColorTokenName`;
- `VfPrimitiveColorTokens`;
- `VfSemanticColorTokenName`;
- `VfSemanticColorTokens`.

Core re-exportирует public name tuples/types. Mapping, count/depth constants и graph validation helpers остаются internal schema/build-test infrastructure. Имена сериализуются существующим Phase 0 serializer, включая numeric steps (`paletteNeutral1000` → `--vf-palette-neutral-1000`).

Публичный API расширен только additive. Component props, variants, events и CSS entry paths не изменены.

## Изменения, способные повлиять на внешний вид

Новых palette values и component style migrations нет. Изменилось представление legacy root values: literals теперь проходят через primitive aliases, но computed sRGB values, color-mix recipes и dark overrides эквивалентны baseline.

Это создаёт узкий non-visual compatibility risk только для consumer-кода, который сравнивает raw custom-property declaration strings: например, `getPropertyValue('--vf-color-primary')` теперь может вернуть `var(--vf-palette-primary-600)` вместо HEX literal. Код, использующий переменную в CSS или сравнивающий computed rendered color, получает прежнее значение.

Следовательно, ожидаемый visual diff равен нулю. Semantic hover/active tokens пока равны текущему solid material; существующие Button/IconButton filters продолжают формировать прежние rendered states.

## Deprecated candidates для VueForge 2

На Phase 1 кандидаты только документированы; удаления, runtime warnings и массовые TypeScript `@deprecated` annotations отсутствуют.

- после component migration: все 35 flat legacy `color*` roots;
- Core: `switchTrackHoverBackground`, `tableOfContentsTitleColor`, compatibility-only `shadow`;
- Playground: 20 неиспользуемых aliases;
- CodeBlock: `--vf-codeblock-action-opacity`;
- Layouts: `--vf-layout-surface-subtle`.

Итого зафиксировано 60 уникальных clean-v2 candidates. Ранее недостижимый `colorPrimaryBorderSoft` теперь является compatibility source для `colorInteractivePrimaryBorder`, но остаётся частью общей flat-root migration.

## Regression coverage

Добавленные contracts проверяют:

- точные primitive/semantic/legacy/complete counts;
- порядок и полноту canonical name tuples;
- все primitive values;
- восемь отдельных ролей каждой status family;
- 36-source / 74-target legacy → semantic mapping и фактические direct aliases;
- отсутствие undefined aliases, cycles и excessive depth;
- light/dark parity;
- runtime/static exact map;
- full stylesheet и selective `foundation.css + component entry` delivery;
- custom prefix и canonical bridge;
- scoped light/dark и Provider output;
- fallback CSS и package consumer/export surface;
- сохранение resolved legacy palette values.

## Verification

Перед Phase 1 commit выполнены:

- `npm test`: успешно, 378 Vitest tests в семи пакетах, Core CSS/export/consumer contracts и Icons render smoke;
- Core suite: 23 test files / 219 tests, 43 CSS exports и 39 auto-CSS exports, packed Core/Theme consumer type contracts;
- `npm run typecheck`: успешно для всего workspace;
- `npm run lint:all`: ESLint, Stylelint, Prettier и Markdownlint успешно; Markdownlint проверил 285 файлов без ошибок;
- `npm run build`: успешно для всех library workspaces; Core full stylesheet — 152.59 kB, gzip 17.58 kB;
- `npm run build:demo`: успешно, documentation/showcase build обработал 382 modules;
- runtime/static/root/scoped comparison: одинаковые 952-key maps, включая 53 dark overrides; full stylesheet и `foundation.css + component entry` содержат тот же theme contract;
- graph contracts: canonical depth 4, custom-prefix depth 9, undefined aliases/cycles/depth overflow отклоняются;
- packed declaration smoke подтвердил, что Core сохраняет внешний import из `@codemonster-ru/vueforge-theme`, а legacy-only custom preset остаётся типобезопасным.

Visual smoke выполнен в реальном headless Chrome для light/dark режимов: восемь снимков покрыли Core runtime/fallback, противоположные scoped boundaries, CodeBlock и Playground. Runtime и fallback дали одинаковый computed palette, legacy override `colorPrimary` продолжил влиять на semantic primary aliases, 2410 component nodes отрисовались без browser/page errors. Все восемь снимков просмотрены вручную: заметного color/geometry drift, clipping или skeleton-state capture нет.

## Изменённые файлы

### Shared contract

- `packages/theme/src/color-token-contract.ts`
- `packages/theme/src/types.ts`
- `packages/theme/src/index.ts`
- `packages/theme/__tests__/runtime.spec.ts`

### Core schema, preset и delivery contracts

- `packages/core/src/theme/color-token-schema.ts`
- `packages/core/src/theme/color-token-schema.spec.ts`
- `packages/core/src/theme/default-preset-source.ts`
- `packages/core/src/theme/index.ts`
- `packages/core/src/theme/public.ts`
- `packages/core/src/types/theme.ts`
- `packages/core/src/index.ts`
- `packages/core/src/theme/theme-contract.spec.ts`
- `packages/core/src/theme/theme.spec.ts`
- `packages/core/src/providers/VfThemeProvider.spec.ts`
- `packages/core/src/styles/component-entry-parity.spec.ts`
- `packages/core/build/theme-css-artifacts.ts`
- `packages/core/scripts/smoke-css-export.mjs`
- `packages/core/scripts/smoke-consumer-auto-css.mjs`
- `packages/core/scripts/smoke-theme-types.mjs`
- `packages/core/package.json`
- `packages/core/vite.config.ts`

### Documentation

- `docs/core/guides/color-tokens.md`
- `docs/core/guides/index.md`
- `packages/core/docs/theme-api.md`
- `docs/design-audit/color-audit-report.md`
- `docs/design-audit/color-inventory.md`
- `docs/design-audit/phase-1-report.md`

Phase 0 report намеренно не изменялся.

## Publication risks и version bump

Core импортирует новые public contract exports из Theme, поэтому публиковать Core раньше совместимой Theme нельзя. Минимальная точная рекомендация для Phase 1:

1. `@codemonster-ru/vueforge-theme` `1.3.0 → 1.4.0`;
2. Core dependency `@codemonster-ru/vueforge-theme` `^1.3.0 → ^1.4.0`;
3. `@codemonster-ru/vueforge-core` `1.35.1 → 1.36.0`.

Если релиз объединяет ещё не опубликованные Phase 0 changes, рекомендуемый coordinated train также включает Layouts `1.21.0 → 1.22.0`, CodeBlock `3.6.1 → 3.7.0`, Playground Core `1.1.1 → 1.2.0` и Playground `2.5.1 → 2.6.0`, с dependency floors, поднятыми до версий этого train. Сам Phase 1 не добавляет новый API этим четырём пакетам.

Package versions и dependency ranges намеренно не изменялись внутри architecture commit: их следует обновить единым release commit после принятия coordinated train.

## Что остаётся для Phase 2

- целевая OKLCH palette и browser/fallback policy;
- независимые accessible foreground/solid/hover/active materials;
- migration Core component states с legacy fallback;
- control boundary и focus contrast;
- disabled/placeholder/read-only/indeterminate semantics;
- compound-state precedence;
- устранение color-only cues;
- CodeBlock syntax palette и copy focus;
- automated contrast, keyboard и screenshot-diff gates.

Phase 1 останавливается на architecture/contract boundary и не выполняет эти изменения.
