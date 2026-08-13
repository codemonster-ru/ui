# Container contract

Status: Active

Component: `Container`

Razor tag: `cm-container`

## Purpose and semantics

Container centers content, applies responsive inline gutters, and limits readable page width. Its
finite `element` choices are `div`, `main`, and `section`; the default is `div`. Consumers must not
use more than one `main` landmark in a document and must name a `section` when its context requires
an accessible name.

`size` is null or `md`, `lg`, `xl`, or `2xl`. It adds the matching stable modifier. `fluid` removes
the maximum inline-size; when true, adapters omit any size modifier even when size was also supplied.
Root attributes and consumer classes reach the selected element.

The default slot is trusted adapter composition. Container adds no behavior, ARIA role, content
interpretation, or viewport JavaScript.
