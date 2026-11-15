const editor = document.querySelector('#playground-editor');
const preview = document.querySelector('#playground-preview');
const status = editor.querySelector('[data-playground-status]');
const startingPreview = preview.srcdoc;

const previewPolicy = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data:',
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function quoteForScript(source) {
  return JSON.stringify(source).replaceAll('<', '\\u003c');
}

editor.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = new FormData(editor);
  const html = quoteForScript(fields.get('html'));
  const css = quoteForScript(fields.get('css'));
  const js = quoteForScript(fields.get('js'));

  preview.srcdoc = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${previewPolicy}">
  <title>Playground preview</title>
</head>
<body>
  <script>
    (() => {
      const style = document.createElement('style');
      style.textContent = ${css};
      document.head.append(style);
      document.body.innerHTML = ${html};
      const script = document.createElement('script');
      script.textContent = ${js};
      document.body.append(script);
    })();
  </script>
</body>
</html>`;
  status.textContent = 'Preview updated.';
});

editor.querySelector('[data-playground-reset]').addEventListener('click', () => {
  editor.reset();
  preview.srcdoc = startingPreview;
  status.textContent = 'Example restored.';
});

editor.querySelector('[data-playground-actions]').hidden = false;
