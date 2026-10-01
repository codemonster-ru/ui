{{-- One shared case for VfNavMenu.

     Every member of a group, or the one menu of a plain case, renders as its
     own real vf-nav-menu in its own measurement box - `box` pixels wide or
     filling the case - as the parity fixture renders it. There is no showcase
     script: every menu on the page is live through the packaged controller
     alone.

     Showcase fixture only. Nothing here is product implementation: the tree,
     the ARIA, the transition, the selection and the measurement live in the
     component and its controller. `case` and `members` are handed in by the
     view. --}}
@foreach ($members as $index => $member)
    <div class="nav-menu-showcase__box{{ (isset($case['group']) ? ($case['content']['boxes'][$index] ?? null) : ($case['content']['box'] ?? null)) === null ? '' : ' nav-menu-showcase__box--sized' }}" style="{{ (isset($case['group']) ? ($case['content']['boxes'][$index] ?? null) : ($case['content']['box'] ?? null)) === null ? '' : 'width: ' . (isset($case['group']) ? $case['content']['boxes'][$index] : $case['content']['box']) . 'px' }}"><vf-nav-menu
        :items="$member['items'] ?? []"
        :default-value="$member['defaultValue'] ?? null"
        :model-value="$member['modelValue'] ?? null"
        :aria-label="$member['ariaLabel'] ?? null"
        :expand-mode="$member['expandMode'] ?? null"
        :variant="$member['variant'] ?? null"
        :compact="$member['compact'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        :title="$case['attrs']['title'] ?? null"
        :style="$case['attrs']['style'] ?? null"
    ></vf-nav-menu></div>
@endforeach
