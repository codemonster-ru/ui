# Badge contract

Status: Active

Badge renders one non-interactive `span.cm-badge`. A non-neutral tone adds
`cm-badge--{tone}`; neutral uses only the base class. Consumer root attributes and classes are
preserved, while adapters own the stable contract classes. Default-slot content remains visible
text and must not rely on color alone to convey critical state.
