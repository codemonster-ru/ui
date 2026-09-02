# Redesign Reference Set

The first stage contains 30 existing icons. It deliberately spans open signs, closed containers,
curves, diagonals, repeated details, asymmetric objects, and dense SaaS contexts. Names and
semantics are unchanged.

## Selection and treatment

| Icon              | Why included / language tested           | Baseline issue                                       | Treatment       |
| ----------------- | ---------------------------------------- | ---------------------------------------------------- | --------------- |
| `arrowRight`      | Canonical horizontal movement            | Head/shaft rhythm differed across variants           | Refinement      |
| `arrowDown`       | Rotational consistency for arrows        | Vertical balance differed from horizontal arrow      | Refinement      |
| `chevronRight`    | Compact navigation sign                  | Leg reach and optical point placement                | Refinement      |
| `chevronDown`     | Rotational chevron pair                  | Different apparent center in disclosure controls     | Refinement      |
| `check`           | Canonical confirmation mark              | Ad-hoc transform and oversized stroke                | Refinement      |
| `xmark`           | Canonical dismiss mark                   | Reach did not match check/plus                       | Refinement      |
| `plus`            | Canonical additive mark                  | Needed common terminal and reach rules               | Refinement      |
| `magnifyingGlass` | Circle-to-diagonal join                  | Large lens and blunt handle relationship             | Refinement      |
| `gear`            | Radial complexity and counter            | Dense mask-based mechanical silhouette               | Complete redraw |
| `house`           | Symmetric object plus counter            | Heavy masked body and small doorway                  | Complete redraw |
| `user`            | Canonical head and shoulders             | Closed solid mass, family scale drift                | Complete redraw |
| `users`           | Overlap and plural metaphor              | Heavy multi-person silhouette and inconsistent heads | Complete redraw |
| `file`            | Document fold primitive                  | Mask construction and dense page body                | Complete redraw |
| `folder`          | Folder tab and object baseline           | Low solid mass and unrelated tab geometry            | Complete redraw |
| `calendar`        | Frame, header, repeated detail           | Two heavy slabs with little calendar information     | Complete redraw |
| `bell`            | Asymmetric curve and notification object | Very dense body and detached clapper                 | Complete redraw |
| `warning`         | Pointed container plus micro-mark        | Mask-heavy triangle and mismatched internal symbol   | Complete redraw |
| `infoCircle`      | Status circle and canonical info mark    | Full-canvas dense circle                             | Complete redraw |
| `lock`            | Security container and shackle           | Blocky solid body and weak counter                   | Complete redraw |
| `grid`            | Dashboard/layout metaphor                | Uniform filled grid did not read as dashboard        | Complete redraw |
| `chartBar`        | Axis and data stroke                     | Read as a horizontal list rather than chart          | Complete redraw |
| `columns`         | Table frame and dividers                 | Heavy frame/cells and inconsistent layout grammar    | Complete redraw |
| `mail`            | Rounded container and fold               | Dense masked envelope with narrow negative cut       | Complete redraw |
| `cloud`           | Organic continuous curve                 | Low, wide solid blob required a large offset         | Complete redraw |
| `database`        | Repeated curved stages                   | Three dense cylinders with excessive fill            | Complete redraw |
| `pencil`          | Diagonal object and tip                  | Solid tool did not share system weight               | Complete redraw |
| `trash`           | Container, lid, internal detail          | Heavy bin with no useful interior structure          | Complete redraw |
| `download`        | Arrow plus tray composition              | Tray indicator competed with transfer metaphor       | Complete redraw |
| `upload`          | Paired transfer composition              | Bottom-heavy geometry and 0.1084 optical offset      | Complete redraw |
| `message`         | Speech tail and text detail              | Dense bubble and inconsistent tail                   | Complete redraw |

## Self-review

Scores are 1–5. `P` proportions, `O` optical balance, `S` semantic clarity, `F` family consistency,
`R` small-size readability, and `Q` overall refinement. All averages are at least 4.

| Icons                         |   P |   O |   S |   F |   R |   Q | Average |
| ----------------------------- | --: | --: | --: | --: | --: | --: | ------: |
| `arrowRight`, `arrowDown`     |   5 |   5 |   5 |   5 |   5 |   4 |    4.83 |
| `chevronRight`, `chevronDown` |   5 |   4 |   5 |   5 |   5 |   4 |    4.67 |
| `check`, `xmark`, `plus`      |   5 |   5 |   5 |   5 |   5 |   4 |    4.83 |
| `magnifyingGlass`             |   5 |   5 |   5 |   5 |   5 |   5 |    5.00 |
| `gear`                        |   4 |   4 |   5 |   4 |   4 |   4 |    4.17 |
| `house`                       |   5 |   5 |   5 |   5 |   5 |   4 |    4.83 |
| `user`, `users`               |   5 |   5 |   5 |   5 |   4 |   4 |    4.67 |
| `file`, `folder`              |   5 |   5 |   5 |   5 |   5 |   4 |    4.83 |
| `calendar`                    |   5 |   5 |   5 |   5 |   4 |   4 |    4.67 |
| `bell`                        |   4 |   4 |   5 |   5 |   4 |   4 |    4.33 |
| `warning`, `infoCircle`       |   5 |   5 |   5 |   5 |   5 |   4 |    4.83 |
| `lock`                        |   5 |   5 |   5 |   5 |   5 |   4 |    4.83 |
| `grid`, `columns`             |   5 |   5 |   5 |   5 |   4 |   5 |    4.83 |
| `chartBar`                    |   5 |   4 |   5 |   5 |   5 |   4 |    4.67 |
| `mail`, `message`             |   5 |   5 |   5 |   5 |   4 |   4 |    4.67 |
| `cloud`                       |   5 |   4 |   5 |   5 |   5 |   4 |    4.67 |
| `database`                    |   5 |   5 |   5 |   5 |   4 |   4 |    4.67 |
| `pencil`                      |   5 |   5 |   5 |   5 |   4 |   4 |    4.67 |
| `trash`                       |   5 |   5 |   5 |   5 |   4 |   4 |    4.67 |
| `download`, `upload`          |   5 |   5 |   5 |   5 |   5 |   4 |    4.83 |

### Review notes

- Compact chevrons are intentionally smaller in area; inflating them would make disclosure
  controls look clumsy.
- `gear` remains the densest reference icon. Its radial detail is at the accepted limit and should
  be compared again when more radial icons enter the system.
- Calendar dots and user-family side profiles are the first details to inspect at 16 px; neither
  should be made smaller in derived variants.
- Badge overlays are specified but not redrawn in this stage. `userPlus`, `userMinus`, and
  `userCheck` must use the new user primitive and one shared badge in the next approved batch.
- Toolbar and dense-table contexts no longer require per-reference `inset` corrections. New
  geometry owns its optical balance.
