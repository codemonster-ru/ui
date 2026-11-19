# CodeMonster UI reference integration

This integration starts at Reference Quality `195777fd43ac685712265b4f4653bf23305e2b6c`.
The visual candidate is [PR #27](https://github.com/codemonster-ru/ui/pull/27) at
`d2057806365725c58e72d419e3193cfa17d5c46e`. The stable candidate is
[PR #29](https://github.com/codemonster-ru/ui/pull/29) at
`f2e42fb2aa6bc2f68716f0e19e84c2c94db3f74c`. Each PR's hosted evidence belongs to its
own revision.

## Consolidation decisions

| Change | Decision and evidence |
| --- | --- |
| Approved visual work | PR #29 already contains PR #27 as an ancestor. Merge the reviewed parents once at `2f8ddc98622bc713d002951ec89b84028c0bc6eb`. The approved palette, focus and popup changes, stage layout, and checked-in visual reference cohort come from that ancestry. |
| Stable package preparation | Keep the seven aligned `2.0.0` manifests, matching changelogs and package exports. The candidate follows the unpublished checkout workflow and the scoped tag gate on release. |
| README and release checks | Keep Reference Quality's package, support and contribution entry points with PR #29's actual dev, build and preview workflows. The showcase budget checks all three Vue entries and the production Vanilla files at the existing limits. Standalone Code Block and Playground remain separate example pages. |
| Skeleton | Keep one stable element and apply styles in caller then component order. Read the fallthrough set during render. The mounted regression changes style and adds then removes an initially absent data attribute without replacing the element. |
| DatePicker and Tooltip | Retain Reference Quality trigger ownership and live attributes, with PR #27 popup geometry and keyboard reflow. Focus and portal ownership were separately exercised inside a native HTML modal in both adapters on the three browser engines. |
| Admin layouts | PR #29 already contains the precision branch's AdminShell keyboard clearance and responsive AdminLayout geometry. The integrated observer also reacts when a class-only AdminShell starts or stops matching after mount. |
| Stepper and navigation | Port the proven connector, label and chevron geometry from the precision line and retain the reviewed state indicators. The new MenuBar icon fixture is canonical and broadens the existing regression runner. |
| Other precision changes | The precision branch combines a different CSS state design, separate reference artifacts and a temporary audit exception. The integration adopts scoped fixes backed by reproduced defects. |

## Review coverage

Use the [visual quality matrix](reference-visual-quality.md) with the
[contract coverage matrix](../components/quality-matrix.md). The integration artifact directory
contains browser logs, captures, geometry records and reproduction commands.

| Independent review | Findings and correction |
| --- | --- |
| Visual design | Compared the complete contract catalog in both adapters and verified that baseline agreement can coexist with shared layout defects. Reproduced Stepper connector overlap and icon spacing and direction failures. The corrected artifacts include long labels, keyboard focus and RTL. |
| Architecture | Reviewed the actual merge instead of the parent branches in isolation. Found a missing class-only AdminShell lifecycle path, with a red and green runtime test. |
| Public API | Verified DatePicker's native form ownership and Tooltip's controlled relationship across portals inside a native dialog. Reviewed SSR-safe import boundaries and the seven package manifests and contracts. |
| Accessibility | Isolated visible clipping of the Select option in Safari to the shortlist preview frame. Verified changed geometry and keyboard behavior independently. Native reader speech and a Windows session have their own acceptance criteria. |
| Documentation and DX | Checked active commands, package roles, all 64 exported components and references in the guides. Corrected the Stepper fallback documentation and the preview server instructions. |
| Repository and GitHub | Verified the default branch rules, live About metadata, issue and contribution entry points, and source workflow definitions. Every verify step maps to a CI check. The publication workflow still requires a scoped package tag. |

## Native acceptance

Check both adapters from their built showcase. Record the product SHA, OS, browser, reader, spoken
output or captions, and keyboard focus at the end of each action.

1. In Safari with VoiceOver and in Firefox or Chrome with NVDA, open Dialog using the keyboard.
   Hear its title and description, traverse its close control, press Escape and hear focus
   return to the opener.
2. Open Select and DatePicker. Hear the control name, expanded state, and choices. For DatePicker,
   also hear the named grid, current month and full date. Commit a choice, reopen, press Escape
   and verify the announced value and restored focus.
3. In Windows High Contrast, tab through Button, Input, Checkbox, Radio, Switch and the MenuBar.
   Distinguish focus, selection and disabled cues. Open Select and DatePicker and distinguish
   the active choice, active day and today's date. Repeat in a second contrast theme.

On macOS 27.2.1 (26B131), Safari 27.2 exposed the names and states and exercised Escape
dismissal across both adapters. VoiceOver 10 was started through System Settings and restored
to its original off state. The desktop bridge timed out when opening the VoiceOver utility
surface and did not expose the system caption panel. Its repeat/save-phrase shortcuts reached
a native probe field as control input. The accessible snapshots of author-provided listboxes
exposed only the first child even in a separate control fixture. Reader speech and option
announcements therefore remain pending. Parallels 27.1.0 listed zero registered guests, so NVDA
and native Windows High Contrast remain blocked in this environment. Details are retained in
`artifacts/reference-integration/native-accessibility.md`.

The browser and accessibility tree evidence describes semantics and focus. A native speech
result needs an observable reader announcement. Native Windows evidence needs a Windows session.

## Continuation

Match the final product SHA to its verification logs. Use that revision for any hosted rerun.
Resolve remaining native acceptance using the short scenario above. Then apply the
[release checklist](../release-checklist.md) and retain exact revised evidence. The
[PR #29 release handoff](../release/FINAL_READINESS.md) retains the earlier candidate record.
