{{-- The consumer content a VfMenu case declares, by name.

     Its own partial so the two branches of menu-case cannot drift from each
     other. Named rather than spelled as markup in the catalog, so this file
     and the Vue route build the same nodes from the same word. --}}
@if (($case['content']['children'] ?? 'none') === 'text')<span class="parity-menu-text">Plain content</span>@elseif (($case['content']['children'] ?? null) === 'spans')<span class="parity-menu-child">One</span><span class="parity-menu-child">Two</span><span class="parity-menu-child">Three</span>@elseif (($case['content']['children'] ?? null) === 'nested')<div class="parity-menu-group"><span class="parity-menu-child">Deep</span></div>@elseif (($case['content']['children'] ?? null) === 'button')<button type="button" class="consumer-control">Consumer action</button>@endif
