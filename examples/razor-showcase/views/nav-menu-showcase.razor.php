<!doctype html>
<html lang="en" data-vf-theme="{{ $theme }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge VfNavMenu showcase — Razor</title>
{{-- The packaged stylesheet and controller the Razor adapter ships. Nothing is
     imported from the Vue application or from the reference checkout. --}}
<link rel="stylesheet" href="/assets/vueforge-razor.css">
<link rel="stylesheet" href="/assets/razor-showcase.css">
{{-- Sibling menus sit in a row, each in its own measurement box, as on the
     Vue route and the parity page. --}}
<style>.nav-menu-showcase__row { display: flex; gap: 16px; align-items: flex-start; } .nav-menu-showcase__box { flex: 1 1 auto; min-width: 0; } .nav-menu-showcase__box--sized { flex: 0 0 auto; }</style>
</head>
<body>
<header class="razor-showcase-header">
    <div class="razor-showcase-brand">VueForge</div>
    <nav class="razor-showcase-platforms" aria-label="Platform">
        <a class="razor-showcase-platform" data-showcase-platform="vue" data-showcase-platform-link="vue" href="{{ $vueHref }}">Vue</a>
        <span class="razor-showcase-platform razor-showcase-platform--active" data-showcase-platform="razor">Razor</span>
    </nav>
</header>

<main class="razor-showcase" data-showcase-platform-current="razor" data-showcase-component="VfNavMenu">
    <div class="razor-showcase__intro">
        <h1>VfNavMenu — Razor</h1>
        <p>
            Rendered by the real <code>codemonster-ru/vueforge-razor</code> provider through the Razor engine, from the
            shared case catalog in <code>contracts/nav-menu/cases.json</code>. Every case links to the same case in
            the Vue showcase.
        </p>
        <p>
            A <code>&lt;nav&gt;</code> landmark over a recursive list: a native button per branch, a native button or anchor per leaf. The server renders the tree with the initial value's ancestry open and every closed subtree waiting in an inert template; the packaged controller opens and closes branches with the reference's own transition, moves the current item and announces it, and measures a sidebar with a ResizeObserver. There is no controlled mode: a selection is applied by the controller itself. The historical behaviour is shown as it is: closing a branch keeps what was open below it; in single mode opening a branch closes its siblings and every branch below them, but not a sibling group; a disabled link keeps its address, leaves the tab order and its click is prevented; there is no arrow-key navigation. Without JavaScript the open ancestry is shown and every link works; a branch does not open. Every link is a hash link.
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

    <section class="razor-showcase__cases" aria-label="VfNavMenu cases">
        @foreach ($cases as $case)
            <article class="razor-showcase__case{{ $case['id'] === $requestedCase ? ' razor-showcase__case--focused' : '' }}" data-showcase-case="{{ $case['id'] }}">
                <header class="razor-showcase__case-header">
                    <h2 class="razor-showcase__case-title">{{ $case['title'] ?? $case['id'] }}</h2>
                    <code class="razor-showcase__case-id">{{ $case['id'] }}</code>
                    <a class="razor-showcase__case-link" data-showcase-case-link="vue" data-showcase-case-link-for="{{ $case['id'] }}" href="{{ $caseLinks[$case['id']] }}">Open in Vue</a>
                </header>

                <div class="razor-showcase__case-body nav-menu-showcase__row">@include('partials.nav-menu-case', ['case' => $case, 'members' => isset($case['group']) && is_array($case['group']) ? $case['group'] : [$case['props'] ?? []]])</div>

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

{{-- The packaged bundle every Razor showcase page loads, and the only script
     here: it enhances every nav menu on the page. --}}
<script type="module" src="/assets/vueforge-razor.js"></script>
</body>
</html>
