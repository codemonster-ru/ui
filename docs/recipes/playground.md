# Vanilla playground recipe

Run `npm run dev:vanilla` from the repository root and open `playground-example.html` on the local server. For deployment, run `npm run build:vanilla` and serve `examples/vanilla/dist` over HTTP. [Example HTML](../../examples/vanilla/playground-example.html) · [Styles](../../examples/vanilla/playground-example.css) · [Preview module](../../examples/vanilla/playground-example.mjs)

Enter a body fragment in HTML, styles in CSS, and a browser script in JavaScript. Run replaces the preview with a fresh document. Reset restores the sample source and starting preview. The example source and starting preview are visible with JavaScript disabled. The recipe accepts HTML, CSS, and JavaScript directly. Vue single-file component compilation requires the Vue playground.

The preview runs in an iframe with an opaque origin and only `allow-scripts`. Its content policy blocks network requests for resources and permits inline scripts and styles and embedded data images. The iframe has its own navigation, so treat the recipe as a local authoring tool, with no guarantee of complete network containment. Keep the sandbox and the policy when adapting the example. The page does not run the edited source in its own document or receive messages from the preview.
