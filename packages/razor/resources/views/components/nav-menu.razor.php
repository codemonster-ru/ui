<!-- prettier-ignore -->
<nav class="{{ $classes }}" aria-label="{{ $ariaLabel }}" data-cm-controller="nav-menu"{!! $attributes !!}><ul class="cm-nav-menu__list">@foreach ($nodes as $node)@include('components.nav-menu-node', ['node' => $node])@endforeach</ul></nav>
