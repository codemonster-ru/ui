{{-- A real vf-dropdown beside or inside a popover, as the parity fixtures
     build it: a trigger label and two role=menuitem consumer buttons, in place
     when the case asks. Showcase fixture only. --}}
@if ($inPlace)<vf-dropdown :disable-teleport="true"><razor-slot name="trigger"><span>{{ $label }}</span></razor-slot><button type="button" role="menuitem" class="vf-dropdown__item">Edit</button><button type="button" role="menuitem" class="vf-dropdown__item">Duplicate</button></vf-dropdown>@else<vf-dropdown><razor-slot name="trigger"><span>{{ $label }}</span></razor-slot><button type="button" role="menuitem" class="vf-dropdown__item">Edit</button><button type="button" role="menuitem" class="vf-dropdown__item">Duplicate</button></vf-dropdown>@endif
