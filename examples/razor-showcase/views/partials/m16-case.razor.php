{{-- One shared case for VfSkeleton, VfAvatar or VfCard.

     The tag is repeated per component because the engine resolves component
     tags when it compiles, so which component renders has to be a branch
     rather than a variable. That constraint is useful here for the same reason
     it was in M15: a branch is visibly three components rather than one
     parameterised renderer.

     Showcase fixture only. Nothing here is product implementation: the class
     merging, the fallback chain, the region rules and the style merging all
     live in the components. --}}
@if ($component === 'skeleton')
    {{-- VfSkeleton is width:100%; height:100%, so it fills whatever box it is
         given and is zero pixels tall in a container that has none. Reserving
         space for content that has not arrived is the consumer's job; this
         frame is that consumer. --}}
    <div class="razor-showcase__skeleton-frame">
        <vf-skeleton
            :min-height="$case['props']['minHeight'] ?? null"
            :radius="isset($case['props']['radius']) ? $case['props']['radius'] : null"
            :animated="array_key_exists('animated', $case['props'] ?? []) ? ($case['props']['animated'] ? 'true' : 'false') : null"
            :class="$case['attrs']['class'] ?? null"
            :style="$case['attrs']['style'] ?? null"
            :aria-hidden="$case['attrs']['aria-hidden'] ?? null"
            :role="$case['attrs']['role'] ?? null"
            :aria-label="$case['attrs']['aria-label'] ?? null"
            :data-testid="$case['attrs']['data-testid'] ?? null"
        />
    </div>
@elseif ($component === 'avatar')
    <vf-avatar
        :image="$case['props']['image'] ?? null"
        :image-alt="$case['props']['imageAlt'] ?? null"
        :label="$case['props']['label'] ?? null"
        :icon="$case['props']['icon'] ?? null"
        :size="$case['props']['size'] ?? null"
        :shape="$case['props']['shape'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
    >{{ $case['content']['text'] ?? '' }}</vf-avatar>
@else
    {{-- The card, once per slot combination.

         The engine collects named slots when it compiles, so a slot wrapped in
         @if would still be declared - the same constraint the Input and Button
         partials work around by repeating the tag. Every one of the card's
         wrappers is keyed on the slot being present rather than on what it
         renders, so a fixture that passed all three unconditionally would make
         every card render every wrapper and would hide the component's whole
         contract behind the chrome.

         One combination the engine cannot express, and it is worth naming
         because VfCard is the first slot container migrated. A component
         invocation with any content at all declares a default slot, even when
         its content is only named slots, so a template cannot say "a footer and
         no body" the way a Vue consumer says it with a single #footer template.
         Cases with a named slot and no body therefore show an empty
         div.vf-card__body here that the Vue route does not show. The component
         itself is exact - the parity gate drives it through the PHP API, where
         slot presence is explicit - so this is a limitation of the template
         slot model rather than of the adapter, and it is recorded as such
         instead of being papered over by loosening the component.

         The buttons are real consumer controls, written here the way any
         consumer would write them. The card owns no interaction; what is in
         its slots is the consumer's. --}}
    @if (array_key_exists('header', $case['content'] ?? []) && array_key_exists('body', $case['content'] ?? []) && array_key_exists('footer', $case['content'] ?? []))
        <vf-card
        :title="$case['props']['title'] ?? null"
        :compact="($case['props']['compact'] ?? false) ? true : null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="header">{{ $case['content']['header']['text'] ?? '' }}@if (isset($case['content']['header']['control']))<button type="button">{{ $case['content']['header']['control']['text'] }}</button>@endif</razor-slot>{{ $case['content']['body']['text'] ?? '' }}@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif<razor-slot name="footer">{{ $case['content']['footer']['text'] ?? '' }}@if (isset($case['content']['footer']['control']))<button type="button">{{ $case['content']['footer']['control']['text'] }}</button>@endif</razor-slot></vf-card>
    @elseif (array_key_exists('header', $case['content'] ?? []) && array_key_exists('body', $case['content'] ?? []) && !array_key_exists('footer', $case['content'] ?? []))
        <vf-card
        :title="$case['props']['title'] ?? null"
        :compact="($case['props']['compact'] ?? false) ? true : null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="header">{{ $case['content']['header']['text'] ?? '' }}@if (isset($case['content']['header']['control']))<button type="button">{{ $case['content']['header']['control']['text'] }}</button>@endif</razor-slot>{{ $case['content']['body']['text'] ?? '' }}@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif</vf-card>
    @elseif (array_key_exists('header', $case['content'] ?? []) && !array_key_exists('body', $case['content'] ?? []) && array_key_exists('footer', $case['content'] ?? []))
        <vf-card
        :title="$case['props']['title'] ?? null"
        :compact="($case['props']['compact'] ?? false) ? true : null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="header">{{ $case['content']['header']['text'] ?? '' }}@if (isset($case['content']['header']['control']))<button type="button">{{ $case['content']['header']['control']['text'] }}</button>@endif</razor-slot><razor-slot name="footer">{{ $case['content']['footer']['text'] ?? '' }}@if (isset($case['content']['footer']['control']))<button type="button">{{ $case['content']['footer']['control']['text'] }}</button>@endif</razor-slot></vf-card>
    @elseif (array_key_exists('header', $case['content'] ?? []) && !array_key_exists('body', $case['content'] ?? []) && !array_key_exists('footer', $case['content'] ?? []))
        <vf-card
        :title="$case['props']['title'] ?? null"
        :compact="($case['props']['compact'] ?? false) ? true : null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="header">{{ $case['content']['header']['text'] ?? '' }}@if (isset($case['content']['header']['control']))<button type="button">{{ $case['content']['header']['control']['text'] }}</button>@endif</razor-slot></vf-card>
    @elseif (!array_key_exists('header', $case['content'] ?? []) && array_key_exists('body', $case['content'] ?? []) && array_key_exists('footer', $case['content'] ?? []))
        <vf-card
        :title="$case['props']['title'] ?? null"
        :compact="($case['props']['compact'] ?? false) ? true : null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        >{{ $case['content']['body']['text'] ?? '' }}@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif<razor-slot name="footer">{{ $case['content']['footer']['text'] ?? '' }}@if (isset($case['content']['footer']['control']))<button type="button">{{ $case['content']['footer']['control']['text'] }}</button>@endif</razor-slot></vf-card>
    @elseif (!array_key_exists('header', $case['content'] ?? []) && array_key_exists('body', $case['content'] ?? []) && !array_key_exists('footer', $case['content'] ?? []))
        <vf-card
        :title="$case['props']['title'] ?? null"
        :compact="($case['props']['compact'] ?? false) ? true : null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        >{{ $case['content']['body']['text'] ?? '' }}@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif</vf-card>
    @elseif (!array_key_exists('header', $case['content'] ?? []) && !array_key_exists('body', $case['content'] ?? []) && array_key_exists('footer', $case['content'] ?? []))
        <vf-card
        :title="$case['props']['title'] ?? null"
        :compact="($case['props']['compact'] ?? false) ? true : null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="footer">{{ $case['content']['footer']['text'] ?? '' }}@if (isset($case['content']['footer']['control']))<button type="button">{{ $case['content']['footer']['control']['text'] }}</button>@endif</razor-slot></vf-card>
    @elseif (!array_key_exists('header', $case['content'] ?? []) && !array_key_exists('body', $case['content'] ?? []) && !array_key_exists('footer', $case['content'] ?? []))
        <vf-card
        :title="$case['props']['title'] ?? null"
        :compact="($case['props']['compact'] ?? false) ? true : null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        />
    @endif
@endif
