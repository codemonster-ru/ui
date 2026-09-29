<!doctype html>
<html lang="en" data-vf-theme="{{ $theme }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge VfTooltip showcase — Razor</title>
{{-- The packaged stylesheet and controller the Razor adapter ships. Nothing is
     imported from the Vue application or from the reference checkout. --}}
<link rel="stylesheet" href="/assets/vueforge-razor.css">
<link rel="stylesheet" href="/assets/razor-showcase.css">
{{-- Room above and beside every trigger for its tooltip, as on the Vue route:
     the tooltip is fixed-position and lies outside the trigger's box, and a
     centred tooltip on a trigger at the left edge would flip or shift. --}}
<style>.razor-showcase__case-body { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.5rem; padding: 4.5rem 0 0 7.5rem; }</style>
</head>
<body>
<header class="razor-showcase-header">
    <div class="razor-showcase-brand">VueForge</div>
    <nav class="razor-showcase-platforms" aria-label="Platform">
        <a class="razor-showcase-platform" data-showcase-platform="vue" data-showcase-platform-link="vue" href="{{ $vueHref }}">Vue</a>
        <span class="razor-showcase-platform razor-showcase-platform--active" data-showcase-platform="razor">Razor</span>
    </nav>
</header>

<main class="razor-showcase" data-showcase-platform-current="razor" data-showcase-component="VfTooltip">
    <div class="razor-showcase__intro">
        <h1>VfTooltip — Razor</h1>
        <p>
            Rendered by the real <code>codemonster-ru/vueforge-razor</code> provider through the Razor engine, from the
            shared case catalog in <code>contracts/tooltip/cases.json</code>. Every case links to the same case in
            the Vue showcase.
        </p>
        <p>
            A trigger wrapper and a <code>span role=&quot;tooltip&quot;</code>. The server renders the wrapper and the trigger, always closed - no tooltip, no id, no <code>aria-describedby</code>, no <code>title</code> - and keeps the body in an inert template; the packaged controller opens it after <code>openDelay</code> (80 ms unless set) on a hover of the wrapper or a focus inside it, teleports it to <code>&lt;body&gt;</code> and positions it with the floater.js 1.0.11 bundled into the same file. The historical behaviour is shown as it is: leaving or losing focus closes it at once - the last event wins - the wrapper is described only while the tooltip is open, even with nothing to render, and no key is handled. Without JavaScript nothing opens.
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

    <section class="razor-showcase__cases" aria-label="VfTooltip cases">
        @foreach ($cases as $case)
            <article class="razor-showcase__case{{ $case['id'] === $requestedCase ? ' razor-showcase__case--focused' : '' }}" data-showcase-case="{{ $case['id'] }}">
                <header class="razor-showcase__case-header">
                    <h2 class="razor-showcase__case-title">{{ $case['title'] ?? $case['id'] }}</h2>
                    <code class="razor-showcase__case-id">{{ $case['id'] }}</code>
                    <a class="razor-showcase__case-link" data-showcase-case-link="vue" data-showcase-case-link-for="{{ $case['id'] }}" href="{{ $caseLinks[$case['id']] }}">Open in Vue</a>
                </header>

                <div class="razor-showcase__case-body">
                    @include('partials.tooltip-case', ['case' => $case, 'members' => isset($case['group']) && is_array($case['group']) ? $case['group'] : [$case['props'] ?? []], 'trigger' => $case['content']['trigger'] ?? [], 'body' => $case['content']['body'] ?? null])
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

{{-- Every selector target a case names, in <body> before the controller runs,
     as on the Vue route and in the parity fixtures. --}}
@foreach ($cases as $case)
    @foreach (isset($case['group']) && is_array($case['group']) ? $case['group'] : [$case['props'] ?? []] as $member)
        @if (is_string($member['teleportTo'] ?? null))
            <div id="{{ substr($member['teleportTo'], 1) }}" class="parity-tooltip-target"></div>
        @endif
    @endforeach
@endforeach

{{-- The packaged bundle every Razor showcase page loads, and the only script
     here: it enhances every tooltip and popover on the page, floater.js included. --}}
<script type="module" src="/assets/vueforge-razor.js"></script>
</body>
</html>
