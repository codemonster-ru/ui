---
title: "Theming"
description: "Theme and styling customization for Skeleton"
order: 3
---

# Theming

`VfSkeleton` inherits surface palette and radius from shared core tokens:

- `--vf-color-surface-muted`
- `--vf-color-text`
- `--vf-radius-surface`

Skeleton shimmer behavior is also tokenized and can be tuned via CSS custom properties:

- `--vf-skeleton-background`
- `--vf-skeleton-shimmer-background`
- `--vf-skeleton-shimmer-duration`
- `--vf-skeleton-shimmer-easing`
- `--vf-skeleton-shimmer-iteration-count`
- `--vf-skeleton-shimmer-start-x`
- `--vf-skeleton-shimmer-end-x`

For custom shape/size per-instance, prefer component props (`minHeight`, `radius`) over global CSS overrides.
