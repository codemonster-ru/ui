<!doctype html>
<html lang="en" data-vf-theme="{{ $theme }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge VfDropdown showcase — Razor</title>
{{-- The packaged stylesheet and controller the Razor adapter ships. Nothing is
     imported from the Vue application or from the reference checkout. --}}
<link rel="stylesheet" href="/assets/vueforge-razor.css">
<link rel="stylesheet" href="/assets/razor-showcase.css">
{{-- Room below every case for its menu, as on the Vue route: the panel is
     fixed-position and lies outside the trigger's box. --}}
<style>.razor-showcase__case-body { min-height: 12rem; }</style>
</head>
<body>
<header class="razor-showcase-header">
    <div class="razor-showcase-brand">VueForge</div>
    <nav class="razor-showcase-platforms" aria-label="Platform">
        <a class="razor-showcase-platform" data-showcase-platform="vue" data-showcase-platform-link="vue" href="{{ $vueHref }}">Vue</a>
        <span class="razor-showcase-platform razor-showcase-platform--active" data-showcase-platform="razor">Razor</span>
    </nav>
</header>

<main class="razor-showcase" data-showcase-platform-current="razor" data-showcase-component="VfDropdown">
    <div class="razor-showcase__intro">
        <h1>VfDropdown — Razor</h1>
        <p>
            Rendered by the real <code>codemonster-ru/vueforge-razor</code> provider through the Razor engine, from the
            shared case catalog in <code>contracts/dropdown/cases.json</code>. Every case links to the same case in
            the Vue showcase.
        </p>
        <p>
            A trigger wrapper and a <code>role=&quot;menu&quot;</code> panel. The server renders the trigger and, for an initially open case, the menu in place; the packaged controller teleports it to <code>&lt;body&gt;</code> and positions it with the floater.js 1.0.11 bundled into the same file. The historical behaviour is shown as it is: ArrowDown, Enter and Space open it and ArrowUp does not; the arrow keys walk disabled items too, and a disabled button stops the walk; Tab does not close it; any click inside the panel closes it; an outside click closes it and takes focus back to the trigger; Escape closes the most recently opened one; nothing stops two from being open at once. Without JavaScript a closed dropdown stays closed and an open one shows its menu unpositioned, as the reference&rsquo;s own server render does.
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

    <section class="razor-showcase__cases" aria-label="VfDropdown cases">
        @foreach ($cases as $case)
            <article class="razor-showcase__case{{ $case['id'] === $requestedCase ? ' razor-showcase__case--focused' : '' }}" data-showcase-case="{{ $case['id'] }}">
                <header class="razor-showcase__case-header">
                    <h2 class="razor-showcase__case-title">{{ $case['title'] ?? $case['id'] }}</h2>
                    <code class="razor-showcase__case-id">{{ $case['id'] }}</code>
                    <a class="razor-showcase__case-link" data-showcase-case-link="vue" data-showcase-case-link-for="{{ $case['id'] }}" href="{{ $caseLinks[$case['id']] }}">Open in Vue</a>
                </header>

                <div class="razor-showcase__case-body">
                    @include('partials.dropdown-case', ['case' => $case, 'members' => isset($case['group']) && is_array($case['group']) ? $case['group'] : [$case['props'] ?? []], 'menu' => $case['content']['menu'] ?? [], 'trigger' => $case['content']['trigger'] ?? null])
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
     here: it enhances every dropdown on the page, floater.js included. --}}
<script type="module" src="/assets/vueforge-razor.js"></script>
</body>
</html>
