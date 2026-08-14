# Authentication page recipe

This recipe replaces `VfAuthLayout` with semantic application markup and the stable Container,
Stack, Section, and Button components. It is intentionally not a `CmAuthLayout`: the application
owns its product mark, page heading, form action, account links, and choice of page landmark.

Load `@codemonster-ru/ui-tokens/tokens.css` and `@codemonster-ru/ui-css/styles.css` once at the
application entry point. Keep the small recipe classes with the application shell.

## Vue

```vue
<script setup lang="ts">
import { CmButton, CmContainer, CmSection, CmStack } from '@codemonster-ru/ui-vue';
</script>

<template>
  <CmContainer element="main" size="md" class="auth-page" aria-labelledby="sign-in-title">
    <CmStack>
      <a class="auth-page__brand" href="/" aria-label="Acme home">Acme</a>

      <header>
        <h1 id="sign-in-title">Sign in</h1>
        <p class="auth-page__description">Use your account to continue.</p>
      </header>

      <CmSection element="section" surface aria-label="Sign-in form">
        <form class="auth-page__form" action="/sessions" method="post">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" required />

          <label for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
          />

          <CmButton type="submit">Sign in</CmButton>
        </form>
      </CmSection>

      <footer class="auth-page__footer">
        <a href="/password/reset">Forgot password?</a>
        <a href="/register">Create account</a>
      </footer>
    </CmStack>
  </CmContainer>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-block-size: 100dvh;
  align-content: center;
  padding-block: var(--cm-space-8);
}

.auth-page__brand {
  justify-self: center;
}

.auth-page__description {
  color: var(--cm-color-text-secondary);
}

.auth-page__form {
  display: grid;
  gap: var(--cm-space-3);
}

.auth-page__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--cm-space-4);
}
</style>
```

## Annabel Razor

The same recipe uses native form semantics. Interpolated product text and validation output remain
escaped by Razor.

```razor
<cm-container element="main" size="md" class="auth-page" aria-labelledby="sign-in-title">
  <cm-stack>
    <a class="auth-page__brand" href="/" aria-label="Acme home">Acme</a>

    <header>
      <h1 id="sign-in-title">Sign in</h1>
      <p class="auth-page__description">Use your account to continue.</p>
    </header>

    <cm-section element="section" :surface="true" aria-label="Sign-in form">
      <form class="auth-page__form" action="/sessions" method="post">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required />

        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />

        <cm-button type="submit">Sign in</cm-button>
      </form>
    </cm-section>

    <footer class="auth-page__footer">
      <a href="/password/reset">Forgot password?</a>
      <a href="/register">Create account</a>
    </footer>
  </cm-stack>
</cm-container>
```

Reuse the application CSS from the Vue example; none of its selectors are part of the CodeMonster
UI contract.

## Application-owned policy

- Use `element="main"` only when this recipe owns the document's single main landmark. Use the
  default `div` inside an existing shell.
- Keep authentication, CSRF protection, validation, pending submission state, redirects, and focus
  after server errors in the application. `CmButton` can expose the application's loading state but
  does not submit credentials itself.
- Preserve the document's heading hierarchy. The recipe does not generate a heading or accessible
  name from optional props.
- Product branding, recovery links, registration policy, viewport centering, and responsive spacing
  are application content and CSS, not adapter behavior.

