<!doctype html>
<html lang="en" data-vf-theme="{{ $theme }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge VfProgressBar showcase — Razor</title>
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

<main class="razor-showcase" data-showcase-platform-current="razor" data-showcase-component="VfProgressBar">
    <div class="razor-showcase__intro">
        <h1>VfProgressBar — Razor</h1>
        <p>
            Rendered by the real <code>codemonster-ru/vueforge-razor</code> provider through the Razor engine, from the
            shared case catalog in <code>contracts/progress-bar/cases.json</code>. Every case links to the same case in
            the Vue showcase.
        </p>
        <p>
            A determinate progress indicator by default: a missing <code>value</code> is 0 of 100, not indeterminate. The root is a <code>progressbar</code> with an accessible name &mdash; <code>label</code>, &ldquo;Progress&rdquo; by default &mdash; and writes <code>aria-valuemin=0</code>, <code>aria-valuemax</code> and <code>aria-valuenow</code> from the same resolved number that sizes the fill: a <code>max</code> that is not a finite positive number falls back to 100, a value is clamped into that range and never rounded, and the width is the raw ratio serialised as JavaScript serialises it. <code>indeterminate</code> drops all three value attributes and the fill&rsquo;s inline size and leaves the sweep to the stylesheet. <code>showValue</code> renders the rounded percentage inside the fill and never as the accessible name. <code>tone</code> is paint &mdash; <code>primary</code> emits no modifier, every other tone does &mdash; and <code>animated</code> needs <code>striped</code>. <code>height</code> is a custom property, never a block size. A consumer <code>role</code>, <code>aria-label</code> or <code>aria-value*</code> replaces the component&rsquo;s own on the attribute while the fill keeps the prop. There is no browser controller &mdash; a bar is complete on the server &mdash; and nothing here reaches <code>vf-progress-spinner</code>: the two share a role name and no code.
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

    <section class="razor-showcase__cases" aria-label="VfProgressBar cases">
        @foreach ($cases as $case)
            <article class="razor-showcase__case{{ $case['id'] === $requestedCase ? ' razor-showcase__case--focused' : '' }}" data-showcase-case="{{ $case['id'] }}">
                <header class="razor-showcase__case-header">
                    <h2 class="razor-showcase__case-title">{{ $case['title'] ?? $case['id'] }}</h2>
                    <code class="razor-showcase__case-id">{{ $case['id'] }}</code>
                    <a class="razor-showcase__case-link" data-showcase-case-link="vue" data-showcase-case-link-for="{{ $case['id'] }}" href="{{ $caseLinks[$case['id']] }}">Open in Vue</a>
                </header>

                <div class="razor-showcase__case-body">
                    @include('partials.progress-bar-case', ['case' => $case])
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
