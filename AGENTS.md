# Development checks

- For small changes, run the relevant tests and lint or type checks. Use the Vue or Vanilla
  development showcase when browser behavior or visual output needs checking.
- For package changes, check the package and its affected published dependants.
- Use the full check for shared contracts, configuration and lockfile changes.
- Let PR CI run the automated check and Chromium smoke for applicable changes. Use the
  [release checklist](docs/release-checklist.md) for the full release checks.
- Repeat a successful check when its inputs change or when diagnosing a failure. Summarize
  routine checks in the task or PR. Keep standalone verification records for release needs.
