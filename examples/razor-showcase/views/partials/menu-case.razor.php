{{-- One shared case for VfMenu.

     The tag is repeated once for the role, and that duplication is the point
     rather than an accident of the engine. Every other binding here is safe to
     pass as null - the component writes none of them itself, so a null simply
     renders nothing. `role` is the one attribute vf-menu writes a default for,
     and a forwarded null *erases* it, exactly as `:role="null"` erases it in
     Vue. Passing `?? null` unconditionally, the way the vf-link partial can,
     would therefore render every menu on this page without its role and make
     the showcase disagree with the component. So the attribute is bound only
     when the case declares one.

     The consumer content is named rather than spelled as markup, so this
     partial and the Vue route build the same nodes from the same word. Only
     the `button` name is focusable, and nothing here carries an explicit
     interactive role: VfMenu owns no control, and every focusable element in
     a menu is the consumer's.

     Nothing here renders a vf-menu-item. That component has its own route and
     its own catalog; vf-menu owns no control and knows nothing about it.

     Showcase fixture only. Nothing here is product implementation. --}}
@if (isset($case['attrs']['role']))
<vf-menu
    :role="$case['attrs']['role']"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :tabindex="$case['attrs']['tabindex'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :aria-describedby="$case['attrs']['aria-describedby'] ?? null"
>@include('partials.menu-children', ['case' => $case])</vf-menu>
@else
<vf-menu
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :tabindex="$case['attrs']['tabindex'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :aria-describedby="$case['attrs']['aria-describedby'] ?? null"
>@include('partials.menu-children', ['case' => $case])</vf-menu>
@endif
@if (($case['attrs']['aria-describedby'] ?? null) === 'aria-described-hint')
    <p id="aria-described-hint" class="parity-hint">Shown in workspace settings.</p>
@endif
