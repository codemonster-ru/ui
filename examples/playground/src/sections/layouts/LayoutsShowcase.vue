<template>
  <div class="demo-page">
    <div class="demo-container">
      <VfStack>
        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-container">VfContainer</h2>
            <p class="demo-text">Constrains content width and supplies the standard responsive page gutter.</p>
          </div>
          <div class="demo-container-frame">
            <VfSection surface>
              <VfContainer>
                <p class="demo-container-copy">
                  Use container as the default content boundary inside a full-width section.
                </p>
              </VfContainer>
            </VfSection>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-stack">VfStack</h2>
            <p class="demo-text">Arranges related items vertically with a consistent, configurable gap.</p>
          </div>
          <div class="demo-grid demo-grid--two">
            <VfSection surface>
              <VfStack>
                <VfSection surface>Vertical composition</VfSection>
                <VfSection surface>Item</VfSection>
                <VfSection surface>Item</VfSection>
              </VfStack>
            </VfSection>
            <VfSection surface>
              <article class="cm-stack">
                <VfSection surface>Article block</VfSection>
                <VfSection surface>Body section</VfSection>
                <VfSection surface>Related notes</VfSection>
              </article>
            </VfSection>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-inline">VfInline</h2>
            <p class="demo-text">Arranges compact items horizontally and optionally wraps them onto new rows.</p>
          </div>
          <div class="demo-grid demo-grid--two">
            <VfSection surface>
              <VfInline>
                <VfBadge>Default</VfBadge>
                <VfBadge>Wrapped</VfBadge>
                <VfBadge>Inline</VfBadge>
                <VfBadge>Row</VfBadge>
              </VfInline>
            </VfSection>
            <VfSection surface>
              <VfInline :wrap="false">
                <VfBadge>No wrap</VfBadge>
                <VfBadge>Actions</VfBadge>
                <VfBadge>Actions</VfBadge>
              </VfInline>
            </VfSection>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-section">VfSection</h2>
            <p class="demo-text">Creates a semantic content region with optional surface treatment and inset.</p>
          </div>
          <div class="demo-grid demo-grid--two">
            <VfSection>
              <strong>surface: false</strong>
            </VfSection>
            <VfSection surface>
              <strong>surface: true</strong>
            </VfSection>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-grid">VfGrid</h2>
            <p class="demo-text">Builds a responsive auto-fitting grid for cards, summaries, and listings.</p>
          </div>
          <VfStack>
            <VfSection surface>
              <VfGrid>
                <VfCard>Responsive card grid</VfCard>
                <VfCard>Item</VfCard>
                <VfCard>Item</VfCard>
                <VfCard>Item</VfCard>
              </VfGrid>
            </VfSection>
            <VfSection surface>
              <VfGrid>
                <VfCard>Use grid for summaries</VfCard>
                <VfCard>Examples</VfCard>
                <VfCard>Listings</VfCard>
              </VfGrid>
            </VfSection>
          </VfStack>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-foundation">Responsive foundation</h2>
            <p class="demo-text">Inspect shared breakpoints and values that react to the current viewport.</p>
          </div>
          <div class="demo-grid demo-grid--two">
            <VfSection surface>
              <VfStack>
                <strong>Breakpoint values</strong>
                <div v-for="breakpoint in breakpointEntries" :key="breakpoint.name" class="demo-kv">
                  <span>{{ breakpoint.name }}</span>
                  <strong>{{ breakpoint.value }}</strong>
                </div>
              </VfStack>
            </VfSection>
            <VfSection surface>
              <VfStack>
                <strong>Runtime state</strong>
                <div class="demo-kv">
                  <span>current</span>
                  <strong>{{ currentBreakpoint }}</strong>
                </div>
                <strong>Responsive value</strong>
                <VfCard>{{ responsiveValue }}</VfCard>
              </VfStack>
            </VfSection>
          </div>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-error-layout">VfErrorLayout</h2>
            <p class="demo-text">Centers an error status, explanation, and recovery actions on a focused page.</p>
          </div>
          <VfTabs v-if="availableErrorBreakpoints.length" v-model="activeErrorBreakpoint" :items="errorBreakpointTabs">
            <template #panel>
              <article v-if="activeErrorBreakpointConfig" class="demo-shell-card">
                <div class="demo-shell-card__title">
                  {{ activeErrorBreakpointConfig.name }} ·
                  {{ activeErrorBreakpointConfig.value }}
                </div>
                <div
                  class="demo-shell-preview"
                  :class="`demo-shell-preview--${activeErrorBreakpointConfig.name}`"
                  :style="{ maxWidth: activeErrorBreakpointConfig.value }"
                >
                  <div class="demo-shell-frame">
                    <section class="demo-error-recipe">
                      <VfContainer size="md" class="demo-error-recipe__container">
                        <div class="demo-error-recipe__panel">
                          <p class="demo-error-recipe__code">404</p>
                          <h1 class="demo-error-recipe__title">Page not found</h1>
                          <p class="demo-error-recipe__description">
                            The page you requested does not exist or has been moved.
                          </p>
                          <div class="demo-error-recipe__actions">
                            <VfButton variant="primary" type="button"> Go to home page </VfButton>
                          </div>
                        </div>
                      </VfContainer>
                    </section>
                  </div>
                </div>
              </article>
            </template>
          </VfTabs>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-auth-layout">VfAuthLayout</h2>
            <p class="demo-text">Frames sign-in and account forms in a responsive branded panel.</p>
          </div>
          <VfTabs v-if="availableAuthBreakpoints.length" v-model="activeAuthBreakpoint" :items="authBreakpointTabs">
            <template #panel>
              <article v-if="activeAuthBreakpointConfig" class="demo-shell-card">
                <div class="demo-shell-card__title">
                  {{ activeAuthBreakpointConfig.name }} ·
                  {{ activeAuthBreakpointConfig.value }}
                </div>
                <div
                  class="demo-shell-preview"
                  :class="`demo-shell-preview--${activeAuthBreakpointConfig.name}`"
                  :style="{ maxWidth: activeAuthBreakpointConfig.value }"
                >
                  <div
                    class="demo-auth-frame"
                    :class="activeAuthBreakpointConfig.name === 'min' && 'demo-auth-frame--min-preview'"
                  >
                    <main
                      :class="[
                        'demo-auth-recipe',
                        activeAuthBreakpointConfig.name === 'min' && 'demo-auth-layout--min-preview',
                      ]"
                    >
                      <VfContainer size="md" class="demo-auth-recipe__container">
                        <div class="demo-auth-recipe__panel">
                          <header class="demo-auth-recipe__header">
                            <div class="demo-auth-recipe__brand">
                              <img class="demo-auth-brand" :src="vueForgeLogoIcon" alt="VueForge" />
                            </div>
                            <h1 class="demo-auth-recipe__title">Sign in</h1>
                            <p class="demo-auth-recipe__description">
                              Don't have an account?
                              <VfLink href="/" underline="none"> Click here to sign up </VfLink>
                            </p>
                          </header>

                          <div class="demo-auth-recipe__body">
                            <form class="demo-auth-form">
                              <VfInput placeholder="Email" type="email" />
                              <VfPasswordInput placeholder="Password" type="password" password-reveal />
                              <div class="demo-auth-options">
                                <VfCheckbox class="demo-auth-remember"> Remember me </VfCheckbox>
                                <VfLink class="demo-auth-forgot" href="/" underline="none"> Forgot password? </VfLink>
                              </div>
                              <VfButton variant="primary" type="submit"> Sign in </VfButton>
                              <p class="demo-auth-copyright">
                                <span>© 2026 VueForge.</span>
                                <span class="demo-auth-copyright__rights"> All rights reserved. </span>
                              </p>
                            </form>
                          </div>
                        </div>
                      </VfContainer>
                    </main>
                  </div>
                </div>
              </article>
            </template>
          </VfTabs>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-setup-layout">VfSetupLayout</h2>
            <p class="demo-text">Structures an initial configuration flow with progress, content, and actions.</p>
          </div>
          <VfTabs v-if="availableSetupBreakpoints.length" v-model="activeSetupBreakpoint" :items="setupBreakpointTabs">
            <template #panel>
              <article v-if="activeSetupBreakpointConfig" class="demo-shell-card">
                <div class="demo-shell-card__title">
                  {{ activeSetupBreakpointConfig.name }} ·
                  {{ activeSetupBreakpointConfig.value }}
                </div>
                <div
                  class="demo-shell-preview"
                  :class="`demo-shell-preview--${activeSetupBreakpointConfig.name}`"
                  :style="{ maxWidth: activeSetupBreakpointConfig.value }"
                >
                  <div class="demo-shell-frame">
                    <main
                      :class="[
                        'demo-setup-recipe',
                        !activeSetupBreakpointHidesAside && 'demo-setup-recipe--with-aside',
                      ]"
                      @keydown="handleSetupKeydown"
                    >
                      <VfContainer size="lg" class="demo-setup-recipe__container">
                        <div class="demo-setup-recipe__panel">
                          <div class="demo-setup-recipe__brand">
                            <div class="demo-setup-brand-stack">
                              <div class="demo-setup-brand">
                                <img class="demo-setup-brand__mark" :src="annabelLogoIcon" alt="" aria-hidden="true" />
                                <span class="demo-setup-brand__name">Annabel</span>
                              </div>
                              <div
                                v-if="activeSetupBreakpointHidesAside"
                                class="demo-setup-progress"
                                :aria-label="`Step ${activeSetupStepNumber} of ${setupSteps.length}`"
                              >
                                <span>Step {{ activeSetupStepNumber }} of {{ setupSteps.length }}</span>
                                <VfProgressBar
                                  class="demo-setup-progress__bar"
                                  :value="activeSetupStepNumber"
                                  :max="setupSteps.length"
                                  label="Setup progress"
                                />
                              </div>
                            </div>
                          </div>

                          <aside v-if="!activeSetupBreakpointHidesAside" class="demo-setup-recipe__aside">
                            <VfNavMenu
                              v-model="activeSetupStep"
                              :items="setupSteps"
                              variant="pills"
                              aria-label="Installation steps"
                            />
                          </aside>

                          <header class="demo-setup-recipe__header">
                            <div class="demo-setup-recipe__heading">
                              <h1 class="demo-setup-recipe__title">{{ activeSetupStepConfig.label }}</h1>
                              <p class="demo-setup-recipe__description">
                                Configure the CMS environment before the first administrator account is created.
                              </p>
                            </div>
                          </header>

                          <section class="demo-setup-recipe__main">
                            <div class="demo-setup-recipe__body">
                              <form
                                :id="setupFormId"
                                class="cm-stack demo-setup-form"
                                @submit.prevent="goToNextSetupStep"
                              >
                                <div class="demo-setup-fields demo-setup-fields--split">
                                  <VfField
                                    :control-id="`${setupFormId}-host`"
                                    label="Host"
                                    description="Hostname, socket, or private address."
                                  >
                                    <template #default="{ controlId, describedBy, invalid }">
                                      <VfInput
                                        :id="controlId"
                                        :aria-describedby="describedBy"
                                        :invalid="invalid"
                                        placeholder="127.0.0.1"
                                        model-value="127.0.0.1"
                                      />
                                    </template>
                                  </VfField>

                                  <VfField :control-id="`${setupFormId}-port`" label="Port">
                                    <template #default="{ controlId, describedBy, invalid }">
                                      <VfInput
                                        :id="controlId"
                                        :aria-describedby="describedBy"
                                        :invalid="invalid"
                                        placeholder="3306"
                                        model-value="3306"
                                      />
                                    </template>
                                  </VfField>
                                </div>

                                <VfField :control-id="`${setupFormId}-database`" label="Database name">
                                  <template #default="{ controlId, describedBy, invalid }">
                                    <VfInput
                                      :id="controlId"
                                      :aria-describedby="describedBy"
                                      :invalid="invalid"
                                      placeholder="annabel"
                                      model-value="annabel"
                                    />
                                  </template>
                                </VfField>

                                <div class="demo-setup-fields demo-setup-fields--even">
                                  <VfField :control-id="`${setupFormId}-user`" label="Database user">
                                    <template #default="{ controlId, describedBy, invalid }">
                                      <VfInput
                                        :id="controlId"
                                        :aria-describedby="describedBy"
                                        :invalid="invalid"
                                        placeholder="annabel_user"
                                        model-value="annabel_user"
                                      />
                                    </template>
                                  </VfField>

                                  <VfField :control-id="`${setupFormId}-password`" label="Database password">
                                    <template #default="{ controlId, describedBy, invalid }">
                                      <VfPasswordInput
                                        :id="controlId"
                                        :aria-describedby="describedBy"
                                        :invalid="invalid"
                                        placeholder="Password"
                                        type="password"
                                        password-reveal
                                      />
                                    </template>
                                  </VfField>
                                </div>
                              </form>
                            </div>

                            <div class="demo-setup-recipe__actions">
                              <VfButton
                                class="demo-setup-action-back"
                                variant="secondary"
                                type="button"
                                :disabled="isFirstSetupStep"
                                @click="goToPreviousSetupStep"
                              >
                                Back
                              </VfButton>
                              <VfButton variant="primary" type="submit" :form="setupFormId">
                                {{ isLastSetupStep ? 'Finish' : 'Continue' }}
                              </VfButton>
                            </div>
                          </section>
                        </div>
                      </VfContainer>
                    </main>
                  </div>
                </div>
              </article>
            </template>
          </VfTabs>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-app-shell">VfAppShell and shell areas</h2>
            <p class="demo-text">
              Composes header, sidebar, content, aside, and footer regions into an application frame.
            </p>
          </div>

          <VfTabs v-model="activeShellLayout" :items="shellLayoutTabs">
            <template #panel>
              <section v-if="activeShellLayoutConfig" class="demo-shell-layout">
                <div class="demo-shell-layout__header">
                  <div class="demo-shell-layout__title">layout: {{ activeShellLayoutConfig.name }}</div>
                  <VfInline>
                    <VfSwitch v-model="plainShellAreas">Plain columns</VfSwitch>
                    <VfSwitch v-model="showShellSubheader"> Show subheader </VfSwitch>
                    <VfSwitch v-model="showShellContentSubheader"> Show content subheader </VfSwitch>
                    <VfSwitch v-model="stickyShellHeader"> Sticky header </VfSwitch>
                    <VfSwitch v-if="activeShellLayoutConfig.name !== 'content'" v-model="stickyShellSidebar">
                      Sticky sidebar
                    </VfSwitch>
                    <VfSwitch
                      v-if="activeShellLayoutConfig.name === 'sidebar-content-aside'"
                      v-model="stickyShellAside"
                    >
                      Sticky aside
                    </VfSwitch>
                  </VfInline>
                </div>
                <VfTabs
                  v-if="availableShellBreakpoints.length"
                  v-model="activeShellBreakpoint"
                  :items="shellBreakpointTabs"
                >
                  <template #panel>
                    <article v-if="activeShellBreakpointConfig" class="demo-shell-card">
                      <div class="demo-shell-card__title">
                        {{ activeShellBreakpointConfig.name }} ·
                        {{ activeShellBreakpointConfig.value }}
                      </div>
                      <div
                        ref="activeShellPreview"
                        class="demo-shell-preview"
                        :class="`demo-shell-preview--${activeShellBreakpointConfig.name}`"
                      >
                        <div
                          class="demo-shell-frame"
                          :class="{
                            'demo-shell-frame--scroll': true,
                          }"
                        >
                          <div
                            :class="{
                              'demo-app-shell-recipe': true,
                              [`demo-app-shell-recipe--${activeShellLayoutConfig.name}`]: true,
                              'demo-app-shell-recipe--with-subheader': showShellSubheader,
                              'demo-app-shell-recipe--header-sticky': stickyShellHeader,
                              'demo-app-shell-recipe--sidebar-sticky': stickyShellSidebar,
                              'demo-app-shell-recipe--aside-sticky': stickyShellAside,
                              'demo-shell-app--compact-aside':
                                activeShellLayoutConfig.name === 'sidebar-content-aside' &&
                                activeShellBreakpointHidesAside,
                              'demo-shell-app--compact-sidebar':
                                activeShellLayoutConfig.name !== 'content' && activeShellBreakpointHidesSidebar,
                            }"
                          >
                            <header class="demo-app-shell-recipe__header">
                              <VfContainer class="demo-app-shell-recipe__header-container">
                                <div class="demo-shell-header">
                                  <div class="demo-shell-header__start">
                                    <div class="demo-shell-heading">
                                      <strong>Header</strong>
                                    </div>
                                  </div>
                                </div>
                              </VfContainer>
                            </header>

                            <div v-if="showShellSubheader" class="demo-app-shell-recipe__subheader">
                              <VfContainer class="demo-app-shell-recipe__subheader-container">
                                <div class="demo-shell-header">
                                  <div class="demo-shell-header__start">
                                    <div class="demo-shell-heading">
                                      <strong>Subheader</strong>
                                    </div>
                                  </div>
                                </div>
                              </VfContainer>
                            </div>

                            <div class="demo-app-shell-recipe__body">
                              <VfContainer class="demo-app-shell-recipe__body-container">
                                <div class="demo-app-shell-recipe__body-grid">
                                  <aside
                                    v-if="activeShellLayoutConfig.name !== 'content'"
                                    :class="[
                                      'demo-app-shell-recipe__sidebar',
                                      plainShellAreas &&
                                        !activeShellBreakpointHidesSidebar &&
                                        'demo-app-shell-recipe__sidebar--plain',
                                    ]"
                                  >
                                    <div class="demo-app-shell-recipe__sidebar-inner">
                                      <VfStack class="demo-scroll-column">
                                        <strong>Sidebar</strong>
                                        <p
                                          v-for="item in demoSidebarItems"
                                          :key="`shell-sidebar-${item.id}`"
                                          class="demo-scroll-copy"
                                        >
                                          {{ item.title }}. {{ item.text }}
                                        </p>
                                      </VfStack>
                                    </div>
                                  </aside>

                                  <main
                                    :class="[
                                      'demo-app-shell-recipe__content',
                                      plainShellAreas && 'demo-app-shell-recipe__content--plain',
                                    ]"
                                  >
                                    <div
                                      v-if="showShellContentSubheader"
                                      class="demo-app-shell-recipe__content-subheader"
                                    >
                                      <div class="demo-shell-header">
                                        <div class="demo-shell-header__start">
                                          <div class="demo-shell-heading">
                                            <strong>Content subheader</strong>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div class="demo-app-shell-recipe__content-body">
                                      <VfStack
                                        :class="{
                                          'demo-shell-content-area': true,
                                          'demo-shell-content-area--plain': plainShellAreas,
                                          'demo-scroll-column': true,
                                        }"
                                      >
                                        <strong>Content</strong>
                                        <p
                                          v-for="item in demoContentItems"
                                          :key="`shell-content-${item.id}`"
                                          class="demo-scroll-copy"
                                        >
                                          {{ item.title }}. {{ item.text }}
                                        </p>
                                      </VfStack>
                                    </div>
                                  </main>

                                  <aside
                                    v-if="activeShellLayoutConfig.name === 'sidebar-content-aside'"
                                    :class="[
                                      'demo-app-shell-recipe__aside',
                                      plainShellAreas && 'demo-app-shell-recipe__aside--plain',
                                    ]"
                                  >
                                    <div class="demo-app-shell-recipe__aside-inner">
                                      <VfStack class="demo-scroll-column">
                                        <strong>Aside</strong>
                                        <p
                                          v-for="item in demoAsideItems"
                                          :key="`shell-aside-${item.id}`"
                                          class="demo-scroll-copy"
                                        >
                                          {{ item.title }}. {{ item.text }}
                                        </p>
                                      </VfStack>
                                    </div>
                                  </aside>
                                </div>
                              </VfContainer>
                            </div>

                            <footer class="demo-app-shell-recipe__footer">
                              <VfContainer class="demo-app-shell-recipe__footer-container">
                                <strong>Footer</strong>
                              </VfContainer>
                            </footer>
                          </div>
                        </div>
                      </div>
                    </article>
                  </template>
                </VfTabs>
              </section>
            </template>
          </VfTabs>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-admin-layout">VfAdminLayout</h2>
            <p class="demo-text">Provides responsive admin navigation with collapsible desktop and mobile sidebars.</p>
          </div>

          <VfTabs v-if="availableShellBreakpoints.length" v-model="activeAdminBreakpoint" :items="shellBreakpointTabs">
            <template #panel>
              <article v-if="activeAdminBreakpointConfig" class="demo-shell-card">
                <div class="demo-shell-card__title">
                  {{ activeAdminBreakpointConfig.name }} · {{ activeAdminBreakpointConfig.value }}
                </div>
                <div
                  class="demo-shell-preview"
                  :class="`demo-shell-preview--${activeAdminBreakpointConfig.name}`"
                  :style="{ maxWidth: `calc(${activeAdminBreakpointConfig.value} + 2 * var(--cm-border-width))` }"
                >
                  <div class="demo-shell-frame demo-shell-frame--scroll demo-shell-frame--fixed-preview">
                    <div
                      :key="activeAdminBreakpointConfig.name"
                      :class="[
                        'demo-admin-layout-recipe',
                        adminLayoutSidebarCollapsed && 'demo-admin-layout-recipe--sidebar-collapsed',
                        adminLayoutSidebarCompact && 'demo-admin-layout-recipe--sidebar-compact',
                        adminLayoutMobileSidebarOpen && 'demo-admin-layout-recipe--mobile-sidebar-open',
                      ]"
                      @keydown="handleAdminLayoutKeydown"
                    >
                      <aside
                        :id="adminLayoutSidebarId"
                        class="demo-admin-layout-recipe__aside"
                        @mouseenter="adminLayoutSidebarPreviewExpanded = true"
                        @mouseleave="adminLayoutSidebarPreviewExpanded = false"
                        @focusin="adminLayoutSidebarPreviewExpanded = true"
                        @focusout="handleAdminLayoutAsideFocusOut"
                      >
                        <div class="demo-admin-layout-recipe__brand">
                          <div class="demo-admin-layout__brand">
                            <img
                              class="demo-admin-layout__brand-mark"
                              :src="annabelLogoIcon"
                              alt=""
                              aria-hidden="true"
                            />
                            <strong class="demo-admin-layout__brand-label">Annabel</strong>
                          </div>
                        </div>
                        <div class="demo-admin-layout-recipe__aside-content">
                          <VfNavMenu
                            v-model="activeAdminNavigation"
                            :items="adminNavigationItems"
                            variant="sidebar"
                            :compact="adminLayoutSidebarCompact && !activeAdminBreakpointUsesMobileSidebar"
                            aria-label="Admin navigation"
                          />
                        </div>
                      </aside>

                      <div
                        class="demo-admin-layout-recipe__mobile-backdrop"
                        aria-hidden="true"
                        @click="adminLayoutMobileSidebarOpen = false"
                      />

                      <div class="demo-admin-layout-recipe__main">
                        <header class="demo-admin-layout-recipe__header">
                          <div class="demo-admin-layout-recipe__mobile-toggle">
                            <button
                              class="demo-admin-layout-recipe__mobile-toggle-button"
                              type="button"
                              :aria-label="adminLayoutMobileSidebarOpen ? 'Close navigation' : 'Open navigation'"
                              :aria-controls="adminLayoutSidebarId"
                              :aria-expanded="adminLayoutMobileSidebarOpen"
                              @click="adminLayoutMobileSidebarOpen = !adminLayoutMobileSidebarOpen"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                            </button>
                          </div>

                          <div class="demo-admin-layout-recipe__mobile-brand">
                            <div class="demo-admin-layout__mobile-brand">
                              <img
                                class="demo-admin-layout__brand-mark"
                                :src="annabelLogoIcon"
                                alt=""
                                aria-hidden="true"
                              />
                              <strong>Annabel</strong>
                            </div>
                          </div>

                          <div class="demo-admin-layout-recipe__header-content">
                            <VfInline class="demo-admin-layout__header" :wrap="false">
                              <VfIconButton
                                class="demo-admin-layout__desktop-toggle"
                                :label="adminLayoutSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                                variant="ghost"
                                @click="adminLayoutSidebarCollapsed = !adminLayoutSidebarCollapsed"
                              >
                                <VueIconify :icon="icons.bars" />
                              </VfIconButton>
                            </VfInline>
                          </div>
                        </header>

                        <main class="demo-admin-layout-recipe__content">
                          <VfStack class="demo-admin-layout__content">
                            <VfInline class="demo-admin-layout__content-header" :wrap="false">
                              <strong>Dashboard</strong>
                              <VfButton variant="primary" size="sm"> Create post </VfButton>
                            </VfInline>
                            <VfGrid>
                              <VfCard>Published: 24</VfCard>
                              <VfCard>Drafts: 8</VfCard>
                              <VfCard>Views: 12,480</VfCard>
                            </VfGrid>

                            <VfCard v-for="panel in adminLayoutPanels" :key="panel.title">
                              <template #header>
                                <VfInline class="demo-admin-layout__content-header" :wrap="false">
                                  <strong>{{ panel.title }}</strong>
                                  <VfButton size="sm" variant="secondary">{{ panel.action }}</VfButton>
                                </VfInline>
                              </template>
                              <VfStack>
                                <span v-for="item in panel.items" :key="item">{{ item }}</span>
                              </VfStack>
                            </VfCard>
                          </VfStack>
                        </main>

                        <footer class="demo-admin-layout-recipe__footer">
                          <span class="demo-admin-layout__footer"
                            >© {{ currentYear }} VueForge. All rights reserved.</span
                          >
                        </footer>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </template>
          </VfTabs>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-admin-shell">VfAdminShell</h2>
            <p class="demo-text">Provides an opinionated product shell for dense administration workflows.</p>
          </div>

          <VfTabs
            v-if="availableShellBreakpoints.length"
            v-model="activeAdminShellBreakpoint"
            :items="shellBreakpointTabs"
          >
            <template #panel>
              <article v-if="activeAdminShellBreakpointConfig" class="demo-shell-card">
                <div class="demo-shell-card__title">
                  {{ activeAdminShellBreakpointConfig.name }} · {{ activeAdminShellBreakpointConfig.value }}
                </div>
                <div
                  class="demo-shell-preview"
                  :class="`demo-shell-preview--${activeAdminShellBreakpointConfig.name}`"
                  :style="{ maxWidth: activeAdminShellBreakpointConfig.value }"
                >
                  <div class="demo-shell-frame demo-shell-frame--scroll demo-shell-frame--fixed-preview">
                    <VfAdminShell
                      class="demo-admin-shell"
                      :class="{
                        'demo-admin-shell--sidebar-hidden': activeAdminShellBreakpointHidesSidebar,
                      }"
                    >
                      <template #brand>
                        <VfIconButton
                          v-if="activeAdminShellBreakpointHidesSidebar"
                          class="demo-admin-shell__sidebar-toggle"
                          label="Open navigation"
                          variant="ghost"
                          @click="adminShellDrawerOpen = true"
                        >
                          <VueIconify :icon="icons.bars" />
                        </VfIconButton>
                        <VfInline class="demo-admin-shell__brand-identity" :wrap="false">
                          <img class="demo-admin-shell__brand-mark" :src="annabelLogoIcon" alt="" aria-hidden="true" />
                          <strong>Annabel</strong>
                        </VfInline>
                      </template>

                      <template #header-actions>
                        <VfAvatar label="AK" shape="circle" aria-label="User profile" />
                      </template>

                      <template #sidebar>
                        <VfNavMenu
                          v-model="activeAdminNavigation"
                          :items="adminNavigationItems"
                          variant="sidebar"
                          aria-label="Admin shell navigation"
                        />
                      </template>

                      <VfStack>
                        <h3 class="demo-admin-shell__page-title">Warehouse availability</h3>
                        <VfDataTable
                          :columns="adminShellTableColumns"
                          :rows="adminShellTableRows"
                          row-key="id"
                          column-dividers
                          pagination
                          :default-page-size="5"
                          :page-size-options="[5, 10]"
                        />
                      </VfStack>
                    </VfAdminShell>

                    <VfDrawer
                      v-model:open="adminShellDrawerOpen"
                      title="Navigation"
                      placement="left"
                      size="sm"
                      dividers
                      :disable-teleport="true"
                      :scroll-lock-target="false"
                    >
                      <VfNavMenu
                        v-model="activeAdminNavigation"
                        :items="adminNavigationItems"
                        variant="sidebar"
                        aria-label="Mobile admin navigation"
                        @select="adminShellDrawerOpen = false"
                      />
                    </VfDrawer>
                  </div>
                </div>
              </article>
            </template>
          </VfTabs>
        </section>

        <section class="demo-block">
          <div class="demo-block__header">
            <h2 id="demo-document-layout">VfDocumentLayout</h2>
            <p class="demo-text">Organizes documentation with optional navigation, article content, and an aside.</p>
          </div>
          <VfTabs v-model="activeDocumentLayout" :items="documentLayoutTabs">
            <template #panel>
              <section v-if="activeDocumentLayoutConfig" class="demo-document-layouts">
                <div class="demo-document-layouts__header">
                  <div class="demo-document-layouts__title">layout: {{ activeDocumentLayoutConfig.name }}</div>
                  <VfInline>
                    <VfSwitch v-model="plainDocumentColumns"> Plain columns </VfSwitch>
                    <VfSwitch v-model="showDocumentSubheader"> Show subheader </VfSwitch>
                    <VfSwitch v-model="showDocumentContentSubheader"> Show content subheader </VfSwitch>
                    <VfSwitch v-model="documentEdgeNotches"> Edge notches </VfSwitch>
                    <VfSwitch v-model="stickyDocumentHeader"> Sticky header </VfSwitch>
                    <VfSwitch v-if="activeDocumentLayoutConfig.name !== 'content'" v-model="stickyDocumentSidebar">
                      Sticky sidebar
                    </VfSwitch>
                    <VfSwitch
                      v-if="activeDocumentLayoutConfig.name === 'sidebar-content-aside'"
                      v-model="stickyDocumentAside"
                    >
                      Sticky aside
                    </VfSwitch>
                  </VfInline>
                </div>
                <VfTabs
                  v-if="availableDocumentBreakpoints.length"
                  v-model="activeDocumentBreakpoint"
                  :items="documentBreakpointTabs"
                >
                  <template #panel>
                    <article v-if="activeDocumentBreakpointConfig" class="demo-document-card">
                      <div class="demo-document-card__title">
                        {{ activeDocumentBreakpointConfig.name }} ·
                        {{ activeDocumentBreakpointConfig.value }}
                      </div>
                      <div
                        class="demo-document-preview"
                        :class="`demo-shell-preview--${activeDocumentBreakpointConfig.name}`"
                      >
                        <div
                          :class="{
                            'demo-document-preview--compact-container': activeDocumentBreakpointHidesContainerInset,
                          }"
                        >
                          <div
                            class="demo-document-layout-frame"
                            :class="{
                              'demo-document-layout-frame--scroll': true,
                            }"
                          >
                            <VfDocumentLayout
                              :layout="activeDocumentLayoutConfig.name"
                              :edge-notches="documentEdgeNotches"
                              :show-subheader="showDocumentSubheader"
                              :show-content-subheader="showDocumentContentSubheader"
                              :sticky-header="stickyDocumentHeader"
                              :sticky-sidebar="stickyDocumentSidebar"
                              :sticky-aside="stickyDocumentAside"
                              :class="{
                                'demo-document-layout': true,
                                'demo-document-layout--plain-columns': plainDocumentColumns,
                                'demo-document-layout--compact-aside':
                                  activeDocumentLayoutConfig.name === 'sidebar-content-aside' &&
                                  activeDocumentBreakpointHidesAside,
                                'demo-document-layout--compact-sidebar':
                                  activeDocumentLayoutConfig.name !== 'content' && activeDocumentBreakpointHidesSidebar,
                              }"
                            >
                              <template #header>
                                <VfInline :wrap="false" class="demo-document-layout__bar">
                                  <strong>Header</strong>
                                </VfInline>
                              </template>

                              <template #subheader>
                                <VfInline :wrap="false" class="demo-document-layout__bar">
                                  <strong>Subheader</strong>
                                </VfInline>
                              </template>

                              <template #content-subheader>
                                <VfInline :wrap="false" class="demo-document-layout__bar">
                                  <strong>Content subheader</strong>
                                </VfInline>
                              </template>

                              <template v-if="activeDocumentLayoutConfig.name !== 'content'" #sidebar>
                                <VfStack class="demo-scroll-column">
                                  <strong>Sidebar</strong>
                                  <p
                                    v-for="item in demoSidebarItems"
                                    :key="`document-sidebar-${item.id}`"
                                    class="demo-scroll-copy"
                                  >
                                    {{ item.title }}. {{ item.text }}
                                  </p>
                                </VfStack>
                              </template>

                              <VfStack class="demo-scroll-column">
                                <strong>Content</strong>
                                <p
                                  v-for="item in demoContentItems"
                                  :key="`document-content-${item.id}`"
                                  class="demo-scroll-copy"
                                >
                                  {{ item.title }}. {{ item.text }}
                                </p>
                              </VfStack>

                              <template v-if="activeDocumentLayoutConfig.name === 'sidebar-content-aside'" #aside>
                                <VfStack class="demo-scroll-column">
                                  <strong>Aside</strong>
                                  <p
                                    v-for="item in demoAsideItems"
                                    :key="`document-aside-${item.id}`"
                                    class="demo-scroll-copy"
                                  >
                                    {{ item.title }}. {{ item.text }}
                                  </p>
                                </VfStack>
                              </template>

                              <template #footer>
                                <VfInline :wrap="false" class="demo-document-layout__bar">
                                  <strong>Footer</strong>
                                </VfInline>
                              </template>
                            </VfDocumentLayout>
                          </div>
                        </div>
                      </div>
                    </article>
                  </template>
                </VfTabs>
              </section>
            </template>
          </VfTabs>
        </section>
      </VfStack>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VfDataTable, VfDrawer, VfInput as VfPasswordInput, VfNavMenu, VfTabs } from '@codemonster-ru/vueforge-core';
import type { VfDataTableColumn, VfDataTableRow } from '@codemonster-ru/vueforge-core';
import { computed, ref, watch } from 'vue';
import {
  CmAvatar as VfAvatar,
  CmBadge as VfBadge,
  CmButton as VfButton,
  CmCard as VfCard,
  CmCheckbox as VfCheckbox,
  CmContainer as VfContainer,
  CmField as VfField,
  CmGrid as VfGrid,
  CmIconButton as VfIconButton,
  CmInline as VfInline,
  CmInput as VfInput,
  CmLink as VfLink,
  CmProgressBar as VfProgressBar,
  CmSection as VfSection,
  CmStack as VfStack,
  CmSwitch as VfSwitch,
} from '@codemonster-ru/ui-vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import { VfAdminShell, VfDocumentLayout } from '@codemonster-ru/vueforge-layouts';
import { useCssVarBreakpoints } from '@codemonster-ru/vueforge-layouts';
import annabelLogoIcon from '../../assets/annabel-logo-icon.svg';
import vueForgeLogoIcon from '../../assets/vueforge-logo-icon.svg';
import '@codemonster-ru/ui-css/button.css';
import '@codemonster-ru/ui-css/icon-button.css';
import '@codemonster-ru/ui-css/input.css';
import '@codemonster-ru/ui-css/link.css';
import '@codemonster-ru/ui-css/progress-bar.css';

const resolvedBreakpoints = useCssVarBreakpoints();
const currentYear = new Date().getFullYear();

function getViewportWidth() {
  return typeof window === 'undefined' ? 0 : window.innerWidth;
}

const breakpointEntries = computed(() =>
  Object.entries(resolvedBreakpoints.value).map(([name, value]) => ({
    name,
    value: `${value}px`,
  })),
);

const shellLayouts = [
  {
    name: 'content' as const,
  },
  {
    name: 'sidebar-content' as const,
  },
  {
    name: 'sidebar-content-aside' as const,
  },
];

const shellLayoutTabs = shellLayouts.map((layout) => ({
  label: layout.name,
  value: layout.name,
}));
const documentLayoutTabs = shellLayoutTabs;

const activeShellLayout = ref<(typeof shellLayouts)[number]['name']>('content');
const plainShellAreas = ref(false);
const showShellSubheader = ref(false);
const showShellContentSubheader = ref(false);
const stickyShellHeader = ref(false);
const stickyShellSidebar = ref(false);
const stickyShellAside = ref(false);

const activeShellLayoutConfig = computed(() => shellLayouts.find((layout) => layout.name === activeShellLayout.value));

const availableShellBreakpoints = computed(() => {
  const viewportWidth = getViewportWidth();

  return breakpointEntries.value.filter(
    (breakpoint) =>
      viewportWidth >= resolvedBreakpoints.value[breakpoint.name as keyof typeof resolvedBreakpoints.value],
  );
});

const shellBreakpointTabs = computed(() =>
  availableShellBreakpoints.value.map((breakpoint) => ({
    label: breakpoint.name,
    value: breakpoint.name,
  })),
);
const authPreviewSizes = [
  {
    name: 'min',
    value: '320px',
  },
];
const setupSteps = [
  {
    value: 'license',
    label: 'License',
    description: 'Accept terms',
    leadingIcon: 'fileText',
  },
  {
    value: 'database',
    label: 'Database',
    description: 'Connect storage',
    leadingIcon: 'database',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Create account',
    leadingIcon: 'user',
  },
  {
    value: 'finish',
    label: 'Finish',
    description: 'Review setup',
    leadingIcon: 'checkCircle',
  },
];
const setupFormId = 'demo-setup-form';
const activeSetupStep = ref('database');
const activeSetupStepIndex = computed(() =>
  Math.max(
    setupSteps.findIndex((step) => step.value === activeSetupStep.value),
    0,
  ),
);
const activeSetupStepNumber = computed(() => activeSetupStepIndex.value + 1);
const activeSetupStepConfig = computed(() => setupSteps[activeSetupStepIndex.value] ?? setupSteps[0]);
const isFirstSetupStep = computed(() => activeSetupStepIndex.value === 0);
const isLastSetupStep = computed(() => activeSetupStepIndex.value === setupSteps.length - 1);
const availableAuthBreakpoints = computed(() => [...authPreviewSizes, ...availableShellBreakpoints.value]);
const authBreakpointTabs = computed(() =>
  availableAuthBreakpoints.value.map((breakpoint) => ({
    label: breakpoint.name,
    value: breakpoint.name,
  })),
);
const availableSetupBreakpoints = computed(() => availableAuthBreakpoints.value);
const setupBreakpointTabs = computed(() => authBreakpointTabs.value);
const availableErrorBreakpoints = computed(() => availableAuthBreakpoints.value);
const errorBreakpointTabs = computed(() => authBreakpointTabs.value);

function isBelowBreakpoint(breakpointValue: string | undefined, maxWidthExclusive: number) {
  return Number.parseInt(breakpointValue ?? '0', 10) < maxWidthExclusive;
}

function getPreferredBreakpointName(breakpoints: Array<{ name: string; value: string }>, preferredName = 'xl') {
  return (
    breakpoints.find((breakpoint) => breakpoint.name === preferredName)?.name ??
    breakpoints[breakpoints.length - 1]?.name ??
    ''
  );
}

function setSetupStep(index: number) {
  const nextStep = setupSteps[Math.min(Math.max(index, 0), setupSteps.length - 1)];

  if (nextStep) {
    activeSetupStep.value = nextStep.value;
  }
}

function goToNextSetupStep() {
  setSetupStep(activeSetupStepIndex.value + 1);
}

function goToPreviousSetupStep() {
  setSetupStep(activeSetupStepIndex.value - 1);
}

function handleSetupKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    goToPreviousSetupStep();
    return;
  }

  if (event.key !== 'Enter' || event.shiftKey) return;

  const target = event.target;
  if (!(target instanceof HTMLElement) || target.isContentEditable || target.closest('[contenteditable="true"]')) {
    return;
  }
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
  if (
    target instanceof HTMLInputElement &&
    ['button', 'checkbox', 'color', 'file', 'radio', 'range', 'reset', 'submit'].includes(target.type)
  ) {
    return;
  }
  if (target.closest('button,a,[role="button"],[role="link"]')) return;

  event.preventDefault();
  goToNextSetupStep();
}

const activeAuthBreakpoint = ref<string>(getPreferredBreakpointName(availableAuthBreakpoints.value));
const activeErrorBreakpoint = ref<string>(getPreferredBreakpointName(availableErrorBreakpoints.value));
const activeSetupBreakpoint = ref<string>(getPreferredBreakpointName(availableSetupBreakpoints.value));
const activeShellBreakpoint = ref<string>(getPreferredBreakpointName(availableShellBreakpoints.value));
const activeAdminBreakpoint = ref<string>(getPreferredBreakpointName(availableShellBreakpoints.value));
const activeAdminShellBreakpoint = ref<string>(getPreferredBreakpointName(availableShellBreakpoints.value));
const activeAdminNavigation = ref('warehouse-availability');
const adminLayoutSidebarCollapsed = ref(false);
const adminLayoutMobileSidebarOpen = ref(false);
const adminLayoutSidebarPreviewExpanded = ref(false);
const adminLayoutSidebarId = 'demo-admin-layout-sidebar';
const adminLayoutSidebarCompact = computed(
  () => adminLayoutSidebarCollapsed.value && !adminLayoutSidebarPreviewExpanded.value,
);
const adminShellDrawerOpen = ref(false);
const adminNavigationItems = [
  { value: 'dashboard', label: 'Dashboard', leadingIcon: 'grid' },
  {
    value: 'commerce',
    label: 'Commerce',
    leadingIcon: 'file',
    children: [
      {
        value: 'product-catalog',
        label: 'Product catalog',
      },
      {
        value: 'inventory-management',
        label: 'Inventory management',
      },
      {
        value: 'warehouse-availability',
        label: 'Warehouse availability',
      },
    ],
  },
  { value: 'settings', label: 'Settings', leadingIcon: 'gear' },
];
const adminLayoutPanels = [
  {
    title: 'Recent inventory changes',
    action: 'View history',
    items: [
      'Warehouse A · 24 items received',
      'Warehouse B · 8 items reserved',
      'Warehouse C · 3 items returned',
      'Online stock · 12 items sold',
    ],
  },
  {
    title: 'Stock alerts',
    action: 'Review alerts',
    items: [
      'Wireless keyboard · 2 items remaining',
      'USB-C dock · out of stock',
      'Studio monitor · reorder threshold reached',
      'Laptop stand · delivery expected tomorrow',
    ],
  },
];
const adminShellTableColumns: VfDataTableColumn[] = [
  { key: 'product', header: 'Product' },
  { key: 'sku', header: 'SKU' },
  { key: 'warehouse', header: 'Warehouse' },
  { key: 'available', header: 'Available', align: 'end' },
  { key: 'status', header: 'Status' },
];
const adminShellTableRows: VfDataTableRow[] = [
  { id: 1, product: 'Wireless keyboard', sku: 'KB-1042', warehouse: 'North', available: 24, status: 'Available' },
  { id: 2, product: 'USB-C dock', sku: 'DK-2208', warehouse: 'Central', available: 0, status: 'Out of stock' },
  { id: 3, product: 'Studio monitor', sku: 'MN-3410', warehouse: 'North', available: 7, status: 'Low stock' },
  { id: 4, product: 'Laptop stand', sku: 'ST-1184', warehouse: 'West', available: 31, status: 'Available' },
  { id: 5, product: 'Web camera', sku: 'CM-4421', warehouse: 'Central', available: 16, status: 'Available' },
  { id: 6, product: 'Mechanical mouse', sku: 'MS-3097', warehouse: 'West', available: 4, status: 'Low stock' },
  { id: 7, product: 'Desk microphone', sku: 'MC-8073', warehouse: 'North', available: 12, status: 'Available' },
];

const activeAuthBreakpointConfig = computed(
  () =>
    availableAuthBreakpoints.value.find((breakpoint) => breakpoint.name === activeAuthBreakpoint.value) ??
    availableAuthBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableAuthBreakpoints.value),
    ) ??
    availableAuthBreakpoints.value[0],
);

const activeErrorBreakpointConfig = computed(
  () =>
    availableErrorBreakpoints.value.find((breakpoint) => breakpoint.name === activeErrorBreakpoint.value) ??
    availableErrorBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableErrorBreakpoints.value),
    ) ??
    availableErrorBreakpoints.value[0],
);

const activeSetupBreakpointConfig = computed(
  () =>
    availableSetupBreakpoints.value.find((breakpoint) => breakpoint.name === activeSetupBreakpoint.value) ??
    availableSetupBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableSetupBreakpoints.value),
    ) ??
    availableSetupBreakpoints.value[0],
);

const activeSetupBreakpointHidesAside = computed(() =>
  isBelowBreakpoint(activeSetupBreakpointConfig.value?.value, resolvedBreakpoints.value.md),
);

const activeShellBreakpointConfig = computed(
  () =>
    availableShellBreakpoints.value.find((breakpoint) => breakpoint.name === activeShellBreakpoint.value) ??
    availableShellBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableShellBreakpoints.value),
    ) ??
    availableShellBreakpoints.value[0],
);

const activeAdminBreakpointConfig = computed(
  () =>
    availableShellBreakpoints.value.find((breakpoint) => breakpoint.name === activeAdminBreakpoint.value) ??
    availableShellBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableShellBreakpoints.value),
    ) ??
    availableShellBreakpoints.value[0],
);

const activeAdminBreakpointUsesMobileSidebar = computed(
  () => Number.parseFloat(activeAdminBreakpointConfig.value?.value ?? '0') < resolvedBreakpoints.value.lg,
);

function handleAdminLayoutAsideFocusOut(event: FocusEvent) {
  const aside = event.currentTarget as HTMLElement;

  if (event.relatedTarget instanceof Node && aside.contains(event.relatedTarget)) return;

  adminLayoutSidebarPreviewExpanded.value = false;
}

function handleAdminLayoutKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented || !adminLayoutMobileSidebarOpen.value) return;

  event.preventDefault();
  adminLayoutMobileSidebarOpen.value = false;
}

watch(activeAdminBreakpoint, () => {
  adminLayoutMobileSidebarOpen.value = false;
  adminLayoutSidebarPreviewExpanded.value = false;
});
const activeAdminShellBreakpointConfig = computed(
  () =>
    availableShellBreakpoints.value.find((breakpoint) => breakpoint.name === activeAdminShellBreakpoint.value) ??
    availableShellBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableShellBreakpoints.value),
    ) ??
    availableShellBreakpoints.value[0],
);
const activeAdminShellBreakpointHidesSidebar = computed(() =>
  isBelowBreakpoint(activeAdminShellBreakpointConfig.value?.value, resolvedBreakpoints.value.lg),
);

watch(activeAdminShellBreakpointHidesSidebar, (sidebarHidden) => {
  if (!sidebarHidden) {
    adminShellDrawerOpen.value = false;
  }
});

const availableDocumentBreakpoints = computed(() => availableShellBreakpoints.value);
const documentBreakpointTabs = computed(() => shellBreakpointTabs.value);
const activeDocumentBreakpoint = ref<string>(getPreferredBreakpointName(availableDocumentBreakpoints.value));
const activeDocumentLayout = ref<(typeof shellLayouts)[number]['name']>('content');
const plainDocumentColumns = ref(false);
const showDocumentSubheader = ref(false);
const showDocumentContentSubheader = ref(false);
const documentEdgeNotches = ref(false);
const stickyDocumentHeader = ref(false);
const stickyDocumentSidebar = ref(false);
const stickyDocumentAside = ref(false);
const activeDocumentLayoutConfig = computed(() =>
  shellLayouts.find((layout) => layout.name === activeDocumentLayout.value),
);
const activeDocumentBreakpointConfig = computed(
  () =>
    availableDocumentBreakpoints.value.find((breakpoint) => breakpoint.name === activeDocumentBreakpoint.value) ??
    availableDocumentBreakpoints.value.find(
      (breakpoint) => breakpoint.name === getPreferredBreakpointName(availableDocumentBreakpoints.value),
    ) ??
    availableDocumentBreakpoints.value[0],
);

const activeShellBreakpointHidesSidebar = computed(() =>
  isBelowBreakpoint(activeShellBreakpointConfig.value?.value, resolvedBreakpoints.value.lg),
);

const activeShellBreakpointHidesAside = computed(() =>
  isBelowBreakpoint(activeShellBreakpointConfig.value?.value, resolvedBreakpoints.value.xl),
);

const activeDocumentBreakpointHidesSidebar = computed(() =>
  isBelowBreakpoint(activeDocumentBreakpointConfig.value?.value, resolvedBreakpoints.value.lg),
);

const activeDocumentBreakpointHidesAside = computed(() =>
  isBelowBreakpoint(activeDocumentBreakpointConfig.value?.value, resolvedBreakpoints.value.xl),
);

const activeDocumentBreakpointHidesContainerInset = computed(() =>
  isBelowBreakpoint(activeDocumentBreakpointConfig.value?.value, resolvedBreakpoints.value.md),
);

const currentBreakpoint = computed(() => {
  const viewportWidth = getViewportWidth();

  if (viewportWidth >= resolvedBreakpoints.value['2xl']) return '2xl';
  if (viewportWidth >= resolvedBreakpoints.value.xl) return 'xl';
  if (viewportWidth >= resolvedBreakpoints.value.lg) return 'lg';
  if (viewportWidth >= resolvedBreakpoints.value.md) return 'md';
  if (viewportWidth >= resolvedBreakpoints.value.sm) return 'sm';
  if (viewportWidth >= resolvedBreakpoints.value.xs) return 'xs';
  return 'base';
});

const responsiveValue = computed(() => {
  if (currentBreakpoint.value === '2xl' || currentBreakpoint.value === 'xl') {
    return 'xl layout';
  }

  if (currentBreakpoint.value === 'lg') return 'lg layout';
  if (currentBreakpoint.value === 'md') return 'md layout';
  if (currentBreakpoint.value === 'sm') return 'sm layout';

  return 'base layout';
});

function buildDemoItems(section: string, count: number, text: string) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${section}-${index + 1}`,
    title: `${section} ${index + 1}`,
    text,
  }));
}

const demoSidebarItems = buildDemoItems(
  'Sidebar block',
  18,
  'Use this long fixture to validate sticky side column behavior, scrollbar appearance and stable top offsets while scrolling.',
);

const demoContentItems = buildDemoItems(
  'Content paragraph',
  26,
  'This is intentionally verbose demo text for stress-testing long scroll areas under sticky header and subheader combinations.',
);

const demoAsideItems = buildDemoItems(
  'Aside note',
  16,
  'Auxiliary column content is repeated to guarantee overflow and make sticky alignment regressions immediately visible.',
);
</script>

<style scoped>
.demo-error-recipe,
.demo-auth-recipe {
  display: flex;
  min-width: 20rem;
  inline-size: 100%;
  justify-content: center;
  color: var(--cm-color-text-primary);
}

.demo-error-recipe {
  padding-block: var(--cm-space-12);
}

.demo-error-recipe__container,
.demo-auth-recipe__container {
  display: flex;
  min-width: 0;
  inline-size: 100%;
  flex: 1 1 auto;
  align-items: center;
}

.demo-error-recipe__panel,
.demo-auth-recipe__panel {
  display: flex;
  flex-direction: column;
  inline-size: 100%;
  margin-inline: auto;
}

.demo-error-recipe__panel {
  gap: var(--cm-space-4);
  padding: calc(var(--cm-space-6) * 1.5);
  border-radius: var(--cm-radius-surface);
  box-shadow: var(--cm-shadow-none);
  text-align: center;
}

.demo-error-recipe__code,
.demo-error-recipe__title,
.demo-error-recipe__description,
.demo-auth-recipe__title,
.demo-auth-recipe__description {
  margin: 0;
}

.demo-error-recipe__code {
  font-size: clamp(2.25rem, 8vw, 5.5rem);
  font-weight: var(--cm-font-weight-bold);
  line-height: 1;
  letter-spacing: -0.04em;
}

.demo-error-recipe__title {
  font-size: clamp(1.375rem, 3vw, 2rem);
  font-weight: inherit;
  line-height: var(--cm-line-height-tight);
}

.demo-error-recipe__description,
.demo-auth-recipe__description {
  color: var(--cm-color-text-muted);
  line-height: var(--cm-line-height-normal);
}

.demo-error-recipe__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--cm-space-4);
}

.demo-auth-recipe {
  padding-block: var(--cm-space-4);
  background: var(--cm-color-background-surface-subtle);
}

.demo-auth-recipe__panel {
  max-inline-size: 28rem;
  gap: var(--cm-space-6);
  padding: calc(var(--cm-space-6) * 1.5);
  border: var(--cm-border-width) solid var(--cm-color-border-default);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-surface);
  box-shadow: var(--cm-shadow-none);
}

.demo-auth-recipe__header {
  display: flex;
  flex-direction: column;
  gap: var(--cm-space-2);
  text-align: center;
}

.demo-auth-recipe__brand {
  display: flex;
  justify-content: center;
}

.demo-auth-recipe__title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: inherit;
  line-height: var(--cm-line-height-tight);
}

.demo-auth-recipe__body {
  min-width: 0;
}

.demo-auth-layout--min-preview {
  padding-block: 0;
}

.demo-auth-layout--min-preview .demo-auth-recipe__container {
  padding-inline: 0;
}

.demo-auth-layout--min-preview .demo-auth-recipe__panel {
  padding: var(--cm-space-6);
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.demo-setup-recipe {
  display: flex;
  align-items: center;
  min-width: 20rem;
  inline-size: 100%;
  background: var(--cm-color-background-surface-subtle);
  color: var(--cm-color-text-primary);
}

.demo-setup-recipe__container {
  padding-block: var(--cm-space-4);
}

.demo-setup-recipe__panel {
  display: grid;
  grid-template-areas:
    'brand'
    'header'
    'main';
  grid-template-columns: minmax(0, 1fr);
  gap: var(--cm-space-4);
  inline-size: 100%;
  margin-inline: auto;
  padding: calc(var(--cm-space-6) * 1.5);
  border: var(--cm-border-width) solid var(--cm-color-border-default);
  border-radius: var(--cm-radius-surface);
  background: var(--cm-color-background-surface);
  box-shadow: var(--cm-shadow-none);
}

.demo-setup-recipe--with-aside .demo-setup-recipe__panel {
  grid-template-areas:
    'brand'
    'header'
    'main'
    'aside';
}

.demo-setup-recipe__aside,
.demo-setup-recipe__brand,
.demo-setup-recipe__header,
.demo-setup-recipe__main,
.demo-setup-recipe__body {
  min-width: 0;
}

.demo-setup-recipe__aside {
  grid-area: aside;
  align-self: start;
  color: var(--cm-color-text-muted);
}

.demo-setup-recipe__main,
.demo-setup-recipe__header,
.demo-setup-recipe__heading {
  display: flex;
  flex-direction: column;
}

.demo-setup-recipe__main {
  grid-area: main;
  align-self: stretch;
  gap: var(--cm-space-6);
}

.demo-setup-recipe__header {
  grid-area: header;
  align-self: start;
  gap: var(--cm-space-4);
}

.demo-setup-recipe__brand {
  display: flex;
  grid-area: brand;
  align-self: start;
}

.demo-setup-recipe__heading {
  gap: var(--cm-space-2);
}

.demo-setup-recipe__title,
.demo-setup-recipe__description {
  margin: 0;
}

.demo-setup-recipe__title {
  font-size: 1.1875rem;
  font-weight: var(--cm-font-weight-semibold);
  line-height: 1.35;
}

.demo-setup-recipe__description {
  color: var(--cm-color-text-muted);
  line-height: var(--cm-line-height-normal);
}

.demo-setup-recipe__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--cm-space-4);
  margin-block-start: auto;
}

.demo-setup-progress__bar {
  --cm-progress-bar-height: 0.25rem;
}

.demo-shell-preview--min .demo-setup-recipe__container {
  padding: 0;
}

.demo-shell-preview--min .demo-setup-recipe__panel {
  padding: var(--cm-space-4);
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

:is(.demo-shell-preview--md, .demo-shell-preview--lg, .demo-shell-preview--xl, .demo-shell-preview--2xl)
  .demo-setup-recipe--with-aside
  .demo-setup-recipe__panel {
  position: relative;
  grid-template-areas:
    'brand header'
    'aside main';
  grid-template-columns: minmax(0, 16rem) minmax(0, 1fr);
  gap: 0;
  padding: 0;
}

:is(.demo-shell-preview--md, .demo-shell-preview--lg, .demo-shell-preview--xl, .demo-shell-preview--2xl)
  .demo-setup-recipe--with-aside
  .demo-setup-recipe__panel::before {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 16rem;
  inline-size: var(--cm-border-width);
  background: color-mix(in srgb, var(--cm-color-border-default) 70%, transparent);
  content: '';
  pointer-events: none;
}

:is(.demo-shell-preview--md, .demo-shell-preview--lg, .demo-shell-preview--xl, .demo-shell-preview--2xl)
  .demo-setup-recipe--with-aside
  :is(.demo-setup-recipe__brand, .demo-setup-recipe__header, .demo-setup-recipe__aside, .demo-setup-recipe__main) {
  padding-block-start: calc(var(--cm-space-6) * 1.5);
  padding-inline: calc(var(--cm-space-6) * 1.5);
}

:is(.demo-shell-preview--md, .demo-shell-preview--lg, .demo-shell-preview--xl, .demo-shell-preview--2xl)
  .demo-setup-recipe--with-aside
  :is(.demo-setup-recipe__aside, .demo-setup-recipe__main) {
  padding-block-end: calc(var(--cm-space-6) * 1.5);
}

@media (width <= 479.98px) {
  .demo-setup-recipe__container {
    padding: 0;
  }

  .demo-setup-recipe__panel {
    padding: var(--cm-space-4);
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
}

.demo-admin-layout-recipe {
  --demo-admin-layout-sidebar-width: 18rem;
  --demo-admin-layout-sidebar-collapsed-width: 4.75rem;
  --demo-admin-layout-header-height: 4rem;

  min-width: 20rem;
  container-name: demo-admin-layout;
  container-type: inline-size;
  color: var(--cm-color-text-primary);
  background: var(--cm-color-background-surface-subtle);
}

.demo-admin-layout-recipe__aside {
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  z-index: 20;
  inline-size: var(--demo-admin-layout-sidebar-width);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  background: var(--cm-color-background-surface);
  border-inline-end: var(--cm-border-width) solid var(--cm-color-border-default);
  visibility: visible;
  transform: translateX(0);
  transition:
    inline-size var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    transform var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    visibility 0s;
}

.demo-admin-layout-recipe__brand {
  box-sizing: border-box;
  block-size: var(--demo-admin-layout-header-height);
  display: flex;
  align-items: center;
  gap: var(--cm-space-4);
  padding: var(--cm-space-3) var(--cm-space-4);
  border-block-end: var(--cm-border-width) solid var(--cm-color-border-default);
  container-type: inline-size;
}

.demo-admin-layout-recipe__aside-content {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--cm-space-4);
}

.demo-admin-layout-recipe__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  margin-inline-start: var(--demo-admin-layout-sidebar-width);
  transition: margin-inline-start var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.demo-admin-layout-recipe__header {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  inset-inline-start: var(--demo-admin-layout-sidebar-width);
  z-index: 21;
  box-sizing: border-box;
  block-size: var(--demo-admin-layout-header-height);
  display: flex;
  align-items: center;
  gap: var(--cm-space-4);
  padding: var(--cm-space-3) var(--cm-space-4);
  background: var(--cm-color-background-surface);
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-default);
  transition: inset-inline-start var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.demo-admin-layout-recipe__header-content {
  min-width: 0;
  inline-size: 100%;
}

.demo-admin-layout-recipe__mobile-toggle,
.demo-admin-layout-recipe__mobile-brand,
.demo-admin-layout-recipe__mobile-backdrop {
  display: none;
}

.demo-admin-layout-recipe--sidebar-collapsed .demo-admin-layout-recipe__aside {
  inline-size: var(--demo-admin-layout-sidebar-collapsed-width);
}

.demo-admin-layout-recipe--sidebar-collapsed .demo-admin-layout-recipe__main {
  margin-inline-start: var(--demo-admin-layout-sidebar-collapsed-width);
}

.demo-admin-layout-recipe--sidebar-collapsed .demo-admin-layout-recipe__header {
  inset-inline-start: var(--demo-admin-layout-sidebar-collapsed-width);
}

.demo-admin-layout-recipe--sidebar-collapsed .demo-admin-layout-recipe__aside:is(:hover, :has(:focus-visible)) {
  z-index: 22;
  inline-size: var(--demo-admin-layout-sidebar-width);
}

.demo-admin-layout-recipe__content {
  flex: 1 0 auto;
  min-width: 0;
  padding: calc(var(--demo-admin-layout-header-height) + var(--cm-space-4)) var(--cm-space-4) var(--cm-space-4);
  background: var(--cm-color-background-surface-subtle);
}

.demo-admin-layout-recipe__footer {
  margin-top: auto;
  padding: var(--cm-space-4);
  background: var(--cm-color-background-surface);
  border-top: var(--cm-border-width) solid var(--cm-color-border-default);
}

.demo-admin-layout__header,
.demo-admin-layout__content-header {
  justify-content: space-between;
  width: 100%;
}

.demo-admin-layout__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
  width: 100%;
  padding-inline-start: 0.625rem;
}

.demo-admin-layout__brand-mark {
  width: var(--cm-icon-size-xl);
  height: var(--cm-icon-size-xl);
  display: block;
}

.demo-admin-layout__mobile-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--cm-space-2);
  white-space: nowrap;
}

.demo-admin-layout__brand-label {
  min-width: 0;
  max-width: 20rem;
  overflow: hidden;
  opacity: 1;
  white-space: nowrap;
  transition:
    max-width var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    opacity var(--cm-motion-duration-fast) var(--cm-motion-ease-standard);
}

.demo-admin-layout-recipe--sidebar-compact .demo-admin-layout__brand-label {
  max-width: 0;
  opacity: 0;
}

.demo-admin-layout__footer {
  color: var(--cm-color-text-muted);
}

@container demo-admin-layout (width <= 1023.98px) {
  .demo-admin-layout-recipe__aside {
    inset-block-start: 0;
    z-index: 24;
    inline-size: min(var(--demo-admin-layout-sidebar-width), 85cqi);
    visibility: hidden;
    transform: translateX(-100%);
    transition:
      transform var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
      visibility 0s var(--cm-motion-duration-normal);
  }

  [dir='rtl'] .demo-admin-layout-recipe__aside {
    transform: translateX(100%);
  }

  .demo-admin-layout-recipe--mobile-sidebar-open .demo-admin-layout-recipe__aside {
    visibility: visible;
    transform: translateX(0);
    transition:
      transform var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
      visibility 0s;
  }

  .demo-admin-layout-recipe--sidebar-collapsed .demo-admin-layout-recipe__aside {
    inline-size: min(var(--demo-admin-layout-sidebar-width), 85cqi);
  }

  .demo-admin-layout-recipe__main,
  .demo-admin-layout-recipe--sidebar-collapsed .demo-admin-layout-recipe__main {
    margin-inline-start: 0;
  }

  .demo-admin-layout-recipe__header {
    inset-inline-start: 0;
    z-index: 22;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  }

  .demo-admin-layout-recipe--sidebar-collapsed .demo-admin-layout-recipe__header {
    inset-inline-start: 0;
  }

  .demo-admin-layout-recipe__mobile-toggle {
    display: flex;
    justify-self: start;
  }

  .demo-admin-layout-recipe__mobile-toggle-button {
    box-sizing: border-box;
    inline-size: var(--cm-control-height-md);
    block-size: var(--cm-control-height-md);
    display: inline-grid;
    place-items: center;
    padding: 0;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: var(--cm-radius-surface);
    cursor: pointer;
  }

  .demo-admin-layout-recipe__mobile-toggle-button:hover {
    background: color-mix(in srgb, currentColor 8%, transparent);
  }

  .demo-admin-layout-recipe__mobile-toggle-button:focus-visible {
    outline: var(--cm-focus-ring-width) solid var(--cm-color-focus-ring);
    outline-offset: calc(var(--cm-focus-ring-width) * -1);
  }

  .demo-admin-layout-recipe__mobile-toggle-button svg {
    inline-size: var(--cm-icon-size-md);
    block-size: var(--cm-icon-size-md);
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-width: 2;
  }

  .demo-admin-layout-recipe__mobile-brand {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
    grid-column: 2;
  }

  .demo-admin-layout-recipe__header-content {
    inline-size: auto;
    display: flex;
    min-width: 0;
    justify-self: end;
    grid-column: 3;
  }

  .demo-admin-layout-recipe__mobile-backdrop {
    position: fixed;
    inset-block: 0;
    inset-inline: 0;
    z-index: 23;
    display: block;
    background: var(--cm-color-background-backdrop);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
      visibility 0s var(--cm-motion-duration-normal);
  }

  .demo-admin-layout-recipe--mobile-sidebar-open .demo-admin-layout-recipe__mobile-backdrop {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition:
      opacity var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
      visibility 0s;
  }

  .demo-admin-layout-recipe--sidebar-collapsed .demo-admin-layout-recipe__aside:is(:hover, :has(:focus-visible)) {
    z-index: 24;
    inline-size: min(var(--demo-admin-layout-sidebar-width), 85cqi);
  }

  .demo-admin-layout__desktop-toggle {
    display: none;
  }

  .demo-admin-layout-recipe--sidebar-compact .demo-admin-layout__brand-label {
    max-width: 20rem;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-admin-layout-recipe__aside,
  .demo-admin-layout-recipe__main,
  .demo-admin-layout-recipe__header,
  .demo-admin-layout-recipe__mobile-backdrop {
    transition: none;
  }
}

.demo-app-shell-recipe {
  --demo-app-shell-sidebar-width: 18rem;
  --demo-app-shell-aside-width: 20rem;
  --demo-app-shell-header-offset: 4rem;
  --demo-app-shell-subheader-offset: 0rem;
  --demo-app-shell-sticky-offset: var(--demo-app-shell-header-offset);

  display: grid;
  grid-template:
    'header' auto
    'subheader' auto
    'body' minmax(0, 1fr)
    'footer' auto / minmax(0, 1fr);
  min-width: 20rem;
  min-height: 30rem;
  background: var(--cm-color-background-surface-subtle);
  color: var(--cm-color-text-primary);
}

.demo-app-shell-recipe--with-subheader {
  --demo-app-shell-subheader-offset: 2.75rem;
  --demo-app-shell-sticky-offset: calc(var(--demo-app-shell-header-offset) + var(--demo-app-shell-subheader-offset));
}

.demo-app-shell-recipe__header {
  position: relative;
  z-index: 20;
  top: 0;
  display: flex;
  grid-area: header;
  box-sizing: border-box;
  align-items: center;
  gap: var(--cm-space-4);
  block-size: var(--demo-app-shell-header-offset);
  padding-block: var(--cm-space-3);
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface);
}

.demo-app-shell-recipe__header-container,
.demo-app-shell-recipe__subheader-container,
.demo-app-shell-recipe__footer-container,
.demo-app-shell-recipe__body,
.demo-app-shell-recipe__body-grid,
.demo-app-shell-recipe__sidebar,
.demo-app-shell-recipe__content,
.demo-app-shell-recipe__content-body,
.demo-app-shell-recipe__aside {
  min-width: 0;
}

.demo-app-shell-recipe--header-sticky > .demo-app-shell-recipe__header {
  position: sticky;
  top: 0;
  z-index: 20;
}

.demo-app-shell-recipe__subheader {
  position: relative;
  top: 0;
  display: flex;
  grid-area: subheader;
  grid-column: 1 / -1;
  box-sizing: border-box;
  align-items: center;
  gap: var(--cm-space-4);
  inline-size: 100%;
  block-size: var(--demo-app-shell-subheader-offset);
  padding-block: 0.375rem;
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface);
}

.demo-app-shell-recipe--header-sticky > .demo-app-shell-recipe__subheader {
  position: sticky;
  top: var(--demo-app-shell-header-offset);
  z-index: 19;
}

.demo-app-shell-recipe__body {
  grid-area: body;
  min-height: 0;
}

.demo-app-shell-recipe__body-container {
  block-size: 100%;
  padding-inline: 0;
}

.demo-app-shell-recipe__body-grid {
  display: grid;
  grid-template:
    'sidebar content aside' minmax(0, 1fr) / minmax(0, var(--demo-app-shell-sidebar-width)) minmax(0, 1fr)
    minmax(0, var(--demo-app-shell-aside-width));
  min-height: 100%;
}

.demo-app-shell-recipe--sidebar-content > .demo-app-shell-recipe__body .demo-app-shell-recipe__body-grid {
  grid-template-areas: 'sidebar content';
  grid-template-columns: minmax(0, var(--demo-app-shell-sidebar-width)) minmax(0, 1fr);
}

.demo-app-shell-recipe--content > .demo-app-shell-recipe__body .demo-app-shell-recipe__body-grid {
  grid-template-areas: 'content';
  grid-template-columns: minmax(0, 1fr);
}

.demo-app-shell-recipe__sidebar {
  grid-area: sidebar;
  overflow-y: auto;
  border-right: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface);
}

.demo-app-shell-recipe__sidebar--plain {
  border-right: 0;
  background: transparent;
}

.demo-app-shell-recipe__sidebar-inner,
.demo-app-shell-recipe__aside-inner {
  min-width: 0;
  padding: var(--cm-space-4);
}

.demo-app-shell-recipe__content {
  display: grid;
  grid-area: content;
  grid-template-rows: auto minmax(0, 1fr);
  align-content: start;
  padding: var(--cm-space-4);
  background: var(--cm-color-background-surface);
}

.demo-app-shell-recipe__content--plain {
  background: transparent;
}

.demo-app-shell-recipe__content-subheader {
  display: flex;
  align-items: center;
  gap: var(--cm-space-4);
  min-height: 2.75rem;
  margin-block: calc(-1 * var(--cm-space-4)) var(--cm-space-4);
  margin-inline: calc(-1 * var(--cm-space-4));
  padding: 0.375rem var(--cm-space-4);
  border-bottom: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface);
}

.demo-app-shell-recipe__content--plain > .demo-app-shell-recipe__content-subheader {
  border-bottom: 0;
  background: transparent;
}

.demo-app-shell-recipe--header-sticky .demo-app-shell-recipe__content-subheader {
  position: sticky;
  z-index: 18;
  top: var(--demo-app-shell-sticky-offset);
  margin-block-start: 0;
}

.demo-app-shell-recipe--header-sticky .demo-app-shell-recipe__content:has(> .demo-app-shell-recipe__content-subheader) {
  padding-block-start: 0;
}

.demo-app-shell-recipe__content-body {
  min-height: 0;
}

.demo-app-shell-recipe__aside {
  grid-area: aside;
  border-left: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface);
}

.demo-app-shell-recipe__aside--plain {
  border-left: 0;
  background: transparent;
}

.demo-shell-app--compact-aside > .demo-app-shell-recipe__body .demo-app-shell-recipe__body-grid {
  grid-template-areas: 'sidebar content';
  grid-template-columns: minmax(0, var(--demo-app-shell-sidebar-width)) minmax(0, 1fr);
}

.demo-shell-app--compact-aside .demo-app-shell-recipe__aside,
.demo-shell-app--compact-sidebar .demo-app-shell-recipe__sidebar,
.demo-shell-app--compact-sidebar .demo-app-shell-recipe__aside {
  display: none;
}

.demo-shell-app--compact-sidebar > .demo-app-shell-recipe__body .demo-app-shell-recipe__body-grid {
  grid-template-areas: 'content';
  grid-template-columns: minmax(0, 1fr);
}

.demo-app-shell-recipe--sidebar-sticky .demo-app-shell-recipe__sidebar,
.demo-app-shell-recipe--aside-sticky .demo-app-shell-recipe__aside {
  overflow: visible;
}

.demo-app-shell-recipe--sidebar-sticky .demo-app-shell-recipe__sidebar-inner,
.demo-app-shell-recipe--aside-sticky .demo-app-shell-recipe__aside-inner {
  position: sticky;
  top: 0;
  max-height: 100vh;
  overflow: auto;
}

.demo-app-shell-recipe--header-sticky.demo-app-shell-recipe--sidebar-sticky .demo-app-shell-recipe__sidebar-inner,
.demo-app-shell-recipe--header-sticky.demo-app-shell-recipe--aside-sticky .demo-app-shell-recipe__aside-inner {
  top: var(--demo-app-shell-sticky-offset);
  max-height: calc(100vh - var(--demo-app-shell-sticky-offset));
}

.demo-app-shell-recipe__footer {
  grid-area: footer;
  min-width: 0;
  padding-block: var(--cm-space-4);
  border-top: var(--cm-border-width) solid var(--cm-color-border-default);
  background: var(--cm-color-background-surface);
}

@media (width <= 1279.98px) {
  .demo-app-shell-recipe--sidebar-content-aside > .demo-app-shell-recipe__body .demo-app-shell-recipe__body-grid {
    grid-template-areas: 'sidebar content';
    grid-template-columns: minmax(0, var(--demo-app-shell-sidebar-width)) minmax(0, 1fr);
  }

  .demo-app-shell-recipe--sidebar-content-aside .demo-app-shell-recipe__aside {
    display: none;
  }
}

@media (width <= 1023.98px) {
  :is(.demo-app-shell-recipe--sidebar-content, .demo-app-shell-recipe--sidebar-content-aside)
    > .demo-app-shell-recipe__body
    .demo-app-shell-recipe__body-grid {
    grid-template-areas: 'content';
    grid-template-columns: minmax(0, 1fr);
  }

  :is(.demo-app-shell-recipe--sidebar-content, .demo-app-shell-recipe--sidebar-content-aside)
    :is(.demo-app-shell-recipe__sidebar, .demo-app-shell-recipe__aside) {
    display: none;
  }
}
</style>
