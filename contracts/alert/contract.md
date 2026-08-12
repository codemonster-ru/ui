# Alert contract

Status: Active

Alert renders `section.cm-alert[role=status]` with a tone modifier except for the default `info`
tone. An optional icon slot renders in `cm-alert__icon` with `aria-hidden=true`. Content is wrapped
by `cm-alert__content`; a supplied title slot or non-empty title prop renders
`p.cm-alert__title`, followed by the required `div.cm-alert__body`.

The polite status role is suitable for contextual and asynchronously inserted non-urgent feedback.
Applications requiring interruptive error announcement explicitly override the root role to
`alert`; adapters preserve that consumer choice. Iconography is decorative and cannot be the sole
carrier of meaning.
