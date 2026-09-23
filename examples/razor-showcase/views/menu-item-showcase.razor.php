<!doctype html>
<html lang="en" data-vf-theme="{{ $theme }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge VfMenuItem showcase — Razor</title>
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

<main class="razor-showcase" data-showcase-platform-current="razor" data-showcase-component="VfMenuItem">
    <div class="razor-showcase__intro">
        <h1>VfMenuItem — Razor</h1>
        <p>
            Rendered by the real <code>codemonster-ru/vueforge-razor</code> provider through the Razor engine, from the
            shared case catalog in <code>contracts/menu-item/cases.json</code>. Every case links to the same case in
            the Vue showcase.
        </p>
        <p>
            One native control per item carrying <code>role=&quot;menuitem&quot;</code>, rendered by the real <code>codemonster-ru/vueforge-razor</code> provider through the Razor engine: an anchor when <code>href</code> is truthy &mdash; so <code>href=&quot;&quot;</code> renders the <em>button</em>, where <code>VfLink</code> keeps an empty href on its anchor &mdash; and a <code>button[type=button]</code> otherwise. <code>rel</code> is written exactly as given and never derived, so <code>target=&quot;_blank&quot;</code> with no <code>rel</code> writes no <code>rel</code> at all; that is where this component differs from <code>VfLink</code> and <code>VfBreadcrumbs</code>, and this adapter deliberately does not call their rule. A disabled anchor drops its href, keeps target and rel and takes <code>aria-disabled</code> and <code>tabindex=&quot;-1&quot;</code>; a disabled button takes the native attribute and no tabindex; neither takes a modifier class. <code>active</code> is a class and no accessibility state. Attrs are bound first, so a consumer <code>role</code> cannot replace <code>role=&quot;menuitem&quot;</code>. An icon name no registry holds falls back to the <code>moon</code> glyph rather than throwing. There is no router branch, no browser controller and no stand-in for the Vue <code>select</code> emit: the server DOM and the browser&rsquo;s native semantics are the whole cross-platform contract.
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

    <section class="razor-showcase__cases" aria-label="VfMenuItem cases">
        @foreach ($cases as $case)
            <article class="razor-showcase__case{{ $case['id'] === $requestedCase ? ' razor-showcase__case--focused' : '' }}" data-showcase-case="{{ $case['id'] }}">
                <header class="razor-showcase__case-header">
                    <h2 class="razor-showcase__case-title">{{ $case['title'] ?? $case['id'] }}</h2>
                    <code class="razor-showcase__case-id">{{ $case['id'] }}</code>
                    <a class="razor-showcase__case-link" data-showcase-case-link="vue" data-showcase-case-link-for="{{ $case['id'] }}" href="{{ $caseLinks[$case['id']] }}">Open in Vue</a>
                </header>

                <div class="razor-showcase__case-body">
                    @include('partials.menu-item-case', ['case' => $case])
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

{{-- The packaged bundle every Razor showcase page loads. It enhances nothing
     here: a menu item is a full-width flex row with no controller at all, and the routes gate asserts
     zero enhanced roots on this page. --}}
<script type="module" src="/assets/vueforge-razor.js"></script>
</body>
</html>
