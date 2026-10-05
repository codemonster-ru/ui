<!doctype html>
<html lang="en" data-vf-theme="{{ $theme }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge VfTable showcase — Razor</title>
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

<main class="razor-showcase" data-showcase-platform-current="razor" data-showcase-component="VfTable">
    <div class="razor-showcase__intro">
        <h1>VfTable — Razor</h1>
        <p>
            Rendered by the real <code>codemonster-ru/vueforge-razor</code> provider through the Razor engine, from the
            shared case catalog in <code>contracts/table/cases.json</code>. Every case links to the same case in
            the Vue showcase.
        </p>
        <p>
            Two wrappers and a native <code>table</code> rendered by the server: <code>div.vf-table-wrap</code> carries every consumer attribute, <code>div.vf-table-scroll</code> owns the horizontal overflow, and the table carries only its own classes - the four modifiers in their fixed order. The caption comes from the prop or the caption slot; each row group opens for the presence of its slot. One engine limit is visible on this page and recorded rather than hidden: a template invocation with only named slots still declares the default slot, so the head-only, foot-only and head-and-foot tables (and the second of the two instances) show an empty <code>tbody</code> the Vue page does not have. The parity fixture hands slots over through the PHP API, where absence is explicit. There is no browser controller.
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

    <section class="razor-showcase__cases" aria-label="VfTable cases">
        @foreach ($cases as $case)
            <article class="razor-showcase__case{{ $case['id'] === $requestedCase ? ' razor-showcase__case--focused' : '' }}" data-showcase-case="{{ $case['id'] }}">
                <header class="razor-showcase__case-header">
                    <h2 class="razor-showcase__case-title">{{ $case['title'] ?? $case['id'] }}</h2>
                    <code class="razor-showcase__case-id">{{ $case['id'] }}</code>
                    <a class="razor-showcase__case-link" data-showcase-case-link="vue" data-showcase-case-link-for="{{ $case['id'] }}" href="{{ $caseLinks[$case['id']] }}">Open in Vue</a>
                </header>

                <div class="razor-showcase__case-body">
                                        @foreach ((isset($case['group']) && is_array($case['group']) ? $case['group'] : [array_merge($case['props'] ?? [], ['attrs' => $case['attrs'] ?? [], 'content' => $case['content'] ?? []])]) as $member)
                        @include('partials.table-case', ['member' => $member, 'attrs' => $member['attrs'] ?? [], 'content' => $member['content'] ?? [], 'combo' => implode('+', array_keys($member['content'] ?? [])), 'headerRows' => array_fill(0, (int) ($member['content']['header']['rows'] ?? 0), true), 'bodyRows' => array_slice($tableMembers, 0, (int) ($member['content']['body']['rows'] ?? 0)), 'footerRows' => array_fill(0, (int) ($member['content']['footer']['rows'] ?? 0), true)])
                    @endforeach
                    @if (($case['attrs']['aria-describedby'] ?? null) === 'table-consumer-hint')
                        <p id="table-consumer-hint" class="parity-hint">Seats renew monthly.</p>
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

<script type="module" src="/assets/vueforge-razor.js"></script>
</body>
</html>
