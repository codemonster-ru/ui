<!doctype html>
<html lang="en" data-vf-theme="{{ $theme }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge VfSkeleton showcase — Razor</title>
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

<main class="razor-showcase" data-showcase-platform-current="razor" data-showcase-component="VfSkeleton">
    <div class="razor-showcase__intro">
        <h1>VfSkeleton — Razor</h1>
        <p>
            Rendered by the real <code>codemonster-ru/vueforge-razor</code> provider through the Razor engine, from the
            shared case catalog in <code>contracts/skeleton/cases.json</code>. Every case links to the same case in
            the Vue showcase.
        </p>
        <p>
            A loading placeholder with no slot, no children and no browser controller: the shimmer is a CSS animation on a pseudo-element. Four historical details are reproduced rather than corrected: <code>aria-hidden</code> is written on every skeleton and a consumer attribute of the same name replaces it; the animation modifier is present at the default rather than absent; an empty <code>radius</code> drops the declaration instead of meaning zero; and a numeric <code>min-height</code> becomes pixels, so <code>0</code> is a length rather than an absence.
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

    <section class="razor-showcase__cases" aria-label="VfSkeleton cases">
        @foreach ($cases as $case)
            <article class="razor-showcase__case{{ $case['id'] === $requestedCase ? ' razor-showcase__case--focused' : '' }}" data-showcase-case="{{ $case['id'] }}">
                <header class="razor-showcase__case-header">
                    <h2 class="razor-showcase__case-title">{{ $case['title'] ?? $case['id'] }}</h2>
                    <code class="razor-showcase__case-id">{{ $case['id'] }}</code>
                    <a class="razor-showcase__case-link" data-showcase-case-link="vue" data-showcase-case-link-for="{{ $case['id'] }}" href="{{ $caseLinks[$case['id']] }}">Open in Vue</a>
                </header>

                <div class="razor-showcase__case-body">
                    @include('partials.m16-case', ['case' => $case, 'component' => 'skeleton'])
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
