# CodeMonster UI 2.0 known issues

| Issue | Release impact | Evidence and next action |
| --- | --- | --- |
| Native screen reader coverage | Blocking | VoiceOver speech and Windows NVDA remain unverified. Follow the [manual acceptance script](../verification/codemonster-ui-2.0-rc.2.md#manual-assistive-technology-acceptance). |
| Default branch protection | Blocking | GitHub reports no protection or effective rules on `main`. Confirm the intended production policy with the owner. |
| Local stored screenshot differences | Use the pinned hosted gate | The earlier local candidate and control produced byte-identical PNGs while both differed from the stored hosted images. [Renderer investigation](../verification/stored-visual-renderer.md) |
| Avatar dark-theme comparison | Monitor exact candidate run | A prior run on the precision branch reported 28 changed pixels around a rounded image; preserve the threshold and diagnose any recurrence against the accepted control. [Prior run](https://github.com/codemonster-ru/ui/actions/runs/44344594092) |
