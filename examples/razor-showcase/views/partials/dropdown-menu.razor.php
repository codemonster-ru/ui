{{-- The default slot of one shared VfDropdown case: the consumer's own menu
     content, built from the same catalog words the Vue route reads - a
     consumer input, raw role=menuitem buttons in the .vf-dropdown__item
     family, a real vf-menu of real vf-menu-items, a paragraph. The
     controller clones this markup into every menu it renders.

     Showcase fixture only. --}}
@if (isset($menu['control']))<input class="parity-menu-control" aria-label="{{ $menu['control']['text'] }}">@endif
@foreach ($menu['items'] ?? [] as $item)<button type="button" role="menuitem" class="vf-dropdown__item{{ ($item['active'] ?? false) ? ' vf-dropdown__item--active' : '' }}">{{ $item['label'] }}</button>@endforeach
@if (isset($menu['menuItems']))<vf-menu>@foreach ($menu['menuItems'] as $item)<vf-menu-item :label="$item['label']" :disabled="$item['disabled'] ?? null" :href="$item['href'] ?? null" :tone="$item['tone'] ?? null"></vf-menu-item>@endforeach</vf-menu>@endif
@if (isset($menu['note']))<p class="parity-menu-note">{{ $menu['note'] }}</p>@endif
