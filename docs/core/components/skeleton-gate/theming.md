---
title: "Theming"
description: "Theme and styling customization for Skeleton Gate"
order: 3
---

# Theming

`VfSkeletonGate` reuses the same radius and muted surface semantics as `VfSkeleton`.

- Use `radius` to synchronize corner shape between loaded content and overlay.
- Use `fadeDuration` to tune perceived transition speed.
- Use CSS tokens for global defaults:
  - `--vf-skeleton-gate-fade-duration`
  - `--vf-skeleton-gate-fade-easing`
  - `--vf-skeleton-gate-overflow`
  - `--vf-skeleton-gate-fade-duration-default`
  - `--vf-skeleton-gate-fade-easing-default`
  - `--vf-skeleton-gate-overflow-default`

For palette changes, adjust shared core tokens (for example `--vf-color-surface-muted`) so both gate and skeleton stay visually consistent.
