# Badge contract

Status: Active

Badge renders one non-interactive `span.cm-badge`. The default `filled` variant uses the base
class. The `outline` variant adds `cm-badge--outline` and uses a transparent background. A
non-neutral tone adds `cm-badge--{tone}` in either variant. The historical `warn` spelling
renders `cm-badge--warning`. Consumer root attributes and classes are preserved, while adapters
own the stable contract classes. Default-slot content remains visible text and must also convey
any critical state expressed by color.
