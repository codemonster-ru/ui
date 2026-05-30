---
title: "Theming"
description: "Theme and styling customization for Skeleton"
order: 3
---

# Theming

`VfSkeleton` inherits surface palette and radius from shared core tokens:

- `--vf-color-surface-muted`
- `--vf-radius-overlay`

Skeleton shimmer behavior is also tokenized and can be tuned via CSS custom properties:

- `--vf-skeleton-shimmer-angle`
- `--vf-skeleton-shimmer-stop-1`
- `--vf-skeleton-shimmer-stop-2`
- `--vf-skeleton-shimmer-stop-3`
- `--vf-skeleton-shimmer-tone-1`
- `--vf-skeleton-shimmer-tone-2`
- `--vf-skeleton-shimmer-tone-3`
- `--vf-skeleton-shimmer-duration`
- `--vf-skeleton-shimmer-easing`
- `--vf-skeleton-shimmer-iteration-count`
- `--vf-skeleton-shimmer-inset`
- `--vf-skeleton-shimmer-width`
- `--vf-skeleton-shimmer-rotate`
- `--vf-skeleton-shimmer-start-x`
- `--vf-skeleton-shimmer-end-x`
- `--vf-skeleton-shimmer-blur`

For custom shape/size per-instance, prefer component props (`minHeight`, `radius`) over global CSS overrides.
