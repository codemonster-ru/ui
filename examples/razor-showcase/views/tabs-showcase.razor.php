<!doctype html>
<html lang="en" data-vf-theme="{{ $theme }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge VfTabs showcase — Razor</title>
{{-- The packaged stylesheet and controller the Razor adapter ships. Nothing is
     imported from the Vue application or from the reference checkout. --}}
<link rel="stylesheet" href="/assets/vueforge-razor.css">
<link rel="stylesheet" href="/assets/razor-showcase.css">
</head>
<body>
<header class="razor-showcase-header">
    <div class="razor-showcase-brand">VueForge</div>
    <nav class="razor-showcase-platforms" aria-label="Platform">
        <a class="razor-showcase-platform" data-showcase-platform="vue" data-showcase-platform-link="vue" href="{{ $vueHref }}">Vue</a>
        <span class="razor-showcase-platform razor-showcase-platform--active" data-showcase-platform="razor">Razor</span>
    </nav>
</header>

<main class="razor-showcase" data-showcase-platform-current="razor" data-showcase-component="VfTabs">
    <div class="razor-showcase__intro">
        <h1>VfTabs — Razor</h1>
        <p>
            Rendered by the real <code>codemonster-ru/vueforge-razor</code> provider through the Razor engine, from the
            shared case catalog in <code>contracts/tabs/cases.json</code>. Every case links to the same case in
            the Vue showcase.
        </p>
        <p>
            The third component that owns controls, and the first whose controls carry an explicit interactive role: one native <code>button[role=tab]</code> per item with <code>aria-selected</code>, a roving <code>tabindex</code> and <code>aria-controls</code>, the two scroll buttons of the internal scroller, and at most one <code>tabpanel</code> labelled by the selected tab. The server renders the state the props resolve to &mdash; <code>model-value</code> wins over <code>default-value</code>, the fallback is the first enabled tab, an unknown value selects nothing &mdash; exactly as the reference renders before it mounts: both scroll buttons hidden and inert, the indicator at its seed, the active panel present and every other panel&rsquo;s content waiting in an inert <code>&lt;template&gt;</code>. Without JavaScript the state is truthful and nothing switches. With the packaged <code>vueforge-razor.js</code> every tabs on this page is live through the same controller a host ships: a click selects (the current tab included, which notifies again), Enter and Space activate natively, the four arrows, Home and End move the selection and the focus between the enabled tabs, the panel is patched, the indicator is measured to the fraction of a pixel, the scroller shows its buttons and fades when the list overflows, and each selection dispatches <code>vf-tabs:change</code>. Nothing here is showcase-only script.
        </p>
    </div>

    @if ($unknownCase !== null)
        <section class="razor-showcase__unknown" data-showcase-unknown-case="true" role="alert">
            <h2>Unknown case</h2>
            <p>
                <code>{{ $unknownCase }}</code> is not in the shared catalog, so there is nothing to render. This is not
                a default case: an address that does not exist has to look like one.
            </p>
        </section>
    @endif

    <section class="razor-showcase__cases" aria-label="VfTabs cases">
        @foreach ($cases as $case)
            <article class="razor-showcase__case{{ $case['id'] === $requestedCase ? ' razor-showcase__case--focused' : '' }}" data-showcase-case="{{ $case['id'] }}">
                <header class="razor-showcase__case-header">
                    <h2 class="razor-showcase__case-title">{{ $case['title'] ?? $case['id'] }}</h2>
                    <code class="razor-showcase__case-id">{{ $case['id'] }}</code>
                    <a class="razor-showcase__case-link" data-showcase-case-link="vue" data-showcase-case-link-for="{{ $case['id'] }}" href="{{ $caseLinks[$case['id']] }}">Open in Vue</a>
                </header>

                <div class="razor-showcase__case-body">
                    @include('partials.tabs-case', ['case' => $case, 'members' => isset($case['group']) && is_array($case['group']) ? $case['group'] : [$case['props'] ?? []], 'panel' => $case['content']['panel'] ?? null, 'numbered' => ($case['content']['tab']['numbered'] ?? false) === true, 'before' => $case['content']['before']['control'] ?? null])
                </div>

            </article>
        @endforeach
    </section>

    <section class="razor-showcase__catalog" aria-label="Component catalog">
        <h2>Component catalog</h2>
        <p>
            The frozen public catalog of the reference commit. A component without a Razor adapter stays listed and is
            never counted as parity-supported.
        </p>
        <ul class="razor-showcase__catalog-list">
            @foreach ($catalog as $entry)
                <li class="razor-showcase__catalog-item" data-showcase-catalog-component="{{ $entry['name'] }}" data-showcase-razor-status="{{ $entry['platforms']['razor']['status'] }}">
                    <span class="razor-showcase__catalog-name">{{ $entry['name'] }}</span>
                    <span class="razor-showcase__badge razor-showcase__badge--ok">Vue</span>
                    @if ($entry['platforms']['razor']['status'] === 'implemented')
                        <span class="razor-showcase__badge razor-showcase__badge--ok">Razor</span>
                    @else
                        <span class="razor-showcase__badge razor-showcase__badge--missing">Razor not implemented yet</span>
                    @endif
                </li>
            @endforeach
        </ul>
    </section>
</main>

<script type="module" src="/assets/vueforge-razor.js"></script>
</body>
</html>
