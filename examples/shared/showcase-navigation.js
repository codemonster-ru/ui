export function revealShowcaseLink({ target }) {
  if (target instanceof HTMLAnchorElement) {
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
