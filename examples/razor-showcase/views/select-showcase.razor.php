<!doctype html>
<html lang="en" data-vf-theme="{{ $theme }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge VfSelect showcase — Razor</title>
{{-- The packaged stylesheet and controller the Razor adapter ships. Nothing is
     imported from the Vue application or from the reference checkout. --}}
<link rel="stylesheet" href="/assets/vueforge-razor.css">
<link rel="stylesheet" href="/assets/razor-showcase.css">
{{-- Room below every case for its listbox, as on the Vue route: the listbox
     is fixed-position and lies outside the trigger's box; sibling selects sit
     in a row so an open listbox does not cover the next trigger. --}}
<style>.razor-showcase__case-body { min-height: 14rem; } .select-showcase__row { display: flex; gap: 16px; align-items: flex-start; }</style>
</head>
<body>
<header class="razor-showcase-header">
    <div class="razor-showcase-brand">VueForge</div>
    <nav class="razor-showcase-platforms" aria-label="Platform">
        <a class="razor-showcase-platform" data-showcase-platform="vue" data-showcase-platform-link="vue" href="{{ $vueHref }}">Vue</a>
        <span class="razor-showcase-platform razor-showcase-platform--active" data-showcase-platform="razor">Razor</span>
    </nav>
</header>

<main class="razor-showcase" data-showcase-platform-current="razor" data-showcase-component="VfSelect">
    <div class="razor-showcase__intro">
        <h1>VfSelect — Razor</h1>
        <p>
            Rendered by the real <code>codemonster-ru/vueforge-razor</code> provider through the Razor engine, from the
            shared case catalog in <code>contracts/select/cases.json</code>. Every case links to the same case in
            the Vue showcase.
        </p>
        <p>
            A <code>&lt;button&gt;</code> trigger and a <code>role=&quot;listbox&quot;</code> of option buttons. The server renders the closed select, its hidden input for a name and the options inert; the packaged controller creates the listbox on open, teleports it to <code>&lt;body&gt;</code> and positions it with the floater.js 1.0.11 bundled into the same file. There is no controlled mode: a selection or a clear is applied by the controller itself. The historical behaviour is shown as it is: ArrowDown, ArrowUp, Enter and Space open it on the selected option, or the first enabled one; the arrows skip disabled options and wrap; Tab does not close it; a pointer selection leaves focus where the click put it and a keyboard selection puts it on the trigger; an outside click closes it without moving focus; Escape closes the most recently opened one. Without JavaScript the select shows its value and its hidden input submits it; nothing opens.
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

    <section class="razor-showcase__cases" aria-label="VfSelect cases">
        @foreach ($cases as $case)
            <article class="razor-showcase__case{{ $case['id'] === $requestedCase ? ' razor-showcase__case--focused' : '' }}" data-showcase-case="{{ $case['id'] }}">
                <header class="razor-showcase__case-header">
                    <h2 class="razor-showcase__case-title">{{ $case['title'] ?? $case['id'] }}</h2>
                    <code class="razor-showcase__case-id">{{ $case['id'] }}</code>
                    <a class="razor-showcase__case-link" data-showcase-case-link="vue" data-showcase-case-link-for="{{ $case['id'] }}" href="{{ $caseLinks[$case['id']] }}">Open in Vue</a>
                </header>

                <div class="razor-showcase__case-body">
                    @if (isset($case['content']['form']))
                        <form class="select-showcase__row" onsubmit="event.preventDefault()">@include('partials.select-case', ['case' => $case, 'members' => isset($case['group']) && is_array($case['group']) ? $case['group'] : [$case['props'] ?? []]])</form>
                    @else
                        <div class="select-showcase__row">@include('partials.select-case', ['case' => $case, 'members' => isset($case['group']) && is_array($case['group']) ? $case['group'] : [$case['props'] ?? []]])</div>
                    @endif
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

{{-- The packaged bundle every Razor showcase page loads, and the only script
     here: it enhances every select on the page, floater.js included. --}}
<script type="module" src="/assets/vueforge-razor.js"></script>
</body>
</html>
