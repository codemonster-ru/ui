{{-- One VfTable instance of a shared case.

     The tag is repeated once per slot combination the catalog uses, because
     the engine collects named slots when it compiles. A table with no slot is
     self-closing and declares no default slot. A combination with named slots
     and no body still declares the default slot - the engine limit recorded in
     plan section У.8 - so those tables render an empty tbody here that the Vue
     page does not; the routes gate counts exactly those. The parity fixture
     uses the PHP API instead.

     The rows are consumer content; the button is a real consumer control.
     Showcase fixture only: the wrappers, the attribute placement, the caption
     rule, the row-group presence and the modifiers live in the component. --}}
@if ($combo === '')
<vf-table
    :caption="$member['caption'] ?? null"
    :column-dividers="$member['columnDividers'] ?? null"
    :compact="$member['compact'] ?? null"
    :striped="$member['striped'] ?? null"
    :sticky-header="$member['stickyHeader'] ?? null"
    :class="$attrs['class'] ?? null"
    :style="$attrs['style'] ?? null"
    :id="$attrs['id'] ?? null"
    :data-testid="$attrs['data-testid'] ?? null"
    :role="$attrs['role'] ?? null"
    :aria-label="$attrs['aria-label'] ?? null"
    :tabindex="$attrs['tabindex'] ?? null"
    :aria-describedby="$attrs['aria-describedby'] ?? null"
/>
@elseif ($combo === 'body')
<vf-table
    :caption="$member['caption'] ?? null"
    :column-dividers="$member['columnDividers'] ?? null"
    :compact="$member['compact'] ?? null"
    :striped="$member['striped'] ?? null"
    :sticky-header="$member['stickyHeader'] ?? null"
    :class="$attrs['class'] ?? null"
    :style="$attrs['style'] ?? null"
    :id="$attrs['id'] ?? null"
    :data-testid="$attrs['data-testid'] ?? null"
    :role="$attrs['role'] ?? null"
    :aria-label="$attrs['aria-label'] ?? null"
    :tabindex="$attrs['tabindex'] ?? null"
    :aria-describedby="$attrs['aria-describedby'] ?? null"
>@foreach ($bodyRows as $row)<tr>@foreach ($row as $cell)<td>{{ $cell }}</td>@endforeach</tr>@endforeach @if (($content['body']['control'] ?? false) === true)<tr><td colspan="3"><button type="button">Invite member</button></td></tr>@endif</vf-table>
@elseif ($combo === 'header')
<vf-table
    :caption="$member['caption'] ?? null"
    :column-dividers="$member['columnDividers'] ?? null"
    :compact="$member['compact'] ?? null"
    :striped="$member['striped'] ?? null"
    :sticky-header="$member['stickyHeader'] ?? null"
    :class="$attrs['class'] ?? null"
    :style="$attrs['style'] ?? null"
    :id="$attrs['id'] ?? null"
    :data-testid="$attrs['data-testid'] ?? null"
    :role="$attrs['role'] ?? null"
    :aria-label="$attrs['aria-label'] ?? null"
    :tabindex="$attrs['tabindex'] ?? null"
    :aria-describedby="$attrs['aria-describedby'] ?? null"
><razor-slot name="header">@foreach ($headerRows as $row)<tr><th>Name</th><th>Role</th><th>Status</th></tr>@endforeach</razor-slot></vf-table>
@elseif ($combo === 'footer')
<vf-table
    :caption="$member['caption'] ?? null"
    :column-dividers="$member['columnDividers'] ?? null"
    :compact="$member['compact'] ?? null"
    :striped="$member['striped'] ?? null"
    :sticky-header="$member['stickyHeader'] ?? null"
    :class="$attrs['class'] ?? null"
    :style="$attrs['style'] ?? null"
    :id="$attrs['id'] ?? null"
    :data-testid="$attrs['data-testid'] ?? null"
    :role="$attrs['role'] ?? null"
    :aria-label="$attrs['aria-label'] ?? null"
    :tabindex="$attrs['tabindex'] ?? null"
    :aria-describedby="$attrs['aria-describedby'] ?? null"
><razor-slot name="footer">@foreach ($footerRows as $row)<tr><td colspan="3">Seats used: 8 of 10</td></tr>@endforeach</razor-slot></vf-table>
@elseif ($combo === 'header+body')
<vf-table
    :caption="$member['caption'] ?? null"
    :column-dividers="$member['columnDividers'] ?? null"
    :compact="$member['compact'] ?? null"
    :striped="$member['striped'] ?? null"
    :sticky-header="$member['stickyHeader'] ?? null"
    :class="$attrs['class'] ?? null"
    :style="$attrs['style'] ?? null"
    :id="$attrs['id'] ?? null"
    :data-testid="$attrs['data-testid'] ?? null"
    :role="$attrs['role'] ?? null"
    :aria-label="$attrs['aria-label'] ?? null"
    :tabindex="$attrs['tabindex'] ?? null"
    :aria-describedby="$attrs['aria-describedby'] ?? null"
><razor-slot name="header">@foreach ($headerRows as $row)<tr><th>Name</th><th>Role</th><th>Status</th></tr>@endforeach</razor-slot>@foreach ($bodyRows as $row)<tr>@foreach ($row as $cell)<td>{{ $cell }}</td>@endforeach</tr>@endforeach @if (($content['body']['control'] ?? false) === true)<tr><td colspan="3"><button type="button">Invite member</button></td></tr>@endif</vf-table>
@elseif ($combo === 'body+footer')
<vf-table
    :caption="$member['caption'] ?? null"
    :column-dividers="$member['columnDividers'] ?? null"
    :compact="$member['compact'] ?? null"
    :striped="$member['striped'] ?? null"
    :sticky-header="$member['stickyHeader'] ?? null"
    :class="$attrs['class'] ?? null"
    :style="$attrs['style'] ?? null"
    :id="$attrs['id'] ?? null"
    :data-testid="$attrs['data-testid'] ?? null"
    :role="$attrs['role'] ?? null"
    :aria-label="$attrs['aria-label'] ?? null"
    :tabindex="$attrs['tabindex'] ?? null"
    :aria-describedby="$attrs['aria-describedby'] ?? null"
><razor-slot name="footer">@foreach ($footerRows as $row)<tr><td colspan="3">Seats used: 8 of 10</td></tr>@endforeach</razor-slot>@foreach ($bodyRows as $row)<tr>@foreach ($row as $cell)<td>{{ $cell }}</td>@endforeach</tr>@endforeach @if (($content['body']['control'] ?? false) === true)<tr><td colspan="3"><button type="button">Invite member</button></td></tr>@endif</vf-table>
@elseif ($combo === 'header+footer')
<vf-table
    :caption="$member['caption'] ?? null"
    :column-dividers="$member['columnDividers'] ?? null"
    :compact="$member['compact'] ?? null"
    :striped="$member['striped'] ?? null"
    :sticky-header="$member['stickyHeader'] ?? null"
    :class="$attrs['class'] ?? null"
    :style="$attrs['style'] ?? null"
    :id="$attrs['id'] ?? null"
    :data-testid="$attrs['data-testid'] ?? null"
    :role="$attrs['role'] ?? null"
    :aria-label="$attrs['aria-label'] ?? null"
    :tabindex="$attrs['tabindex'] ?? null"
    :aria-describedby="$attrs['aria-describedby'] ?? null"
><razor-slot name="header">@foreach ($headerRows as $row)<tr><th>Name</th><th>Role</th><th>Status</th></tr>@endforeach</razor-slot><razor-slot name="footer">@foreach ($footerRows as $row)<tr><td colspan="3">Seats used: 8 of 10</td></tr>@endforeach</razor-slot></vf-table>
@elseif ($combo === 'header+body+footer')
<vf-table
    :caption="$member['caption'] ?? null"
    :column-dividers="$member['columnDividers'] ?? null"
    :compact="$member['compact'] ?? null"
    :striped="$member['striped'] ?? null"
    :sticky-header="$member['stickyHeader'] ?? null"
    :class="$attrs['class'] ?? null"
    :style="$attrs['style'] ?? null"
    :id="$attrs['id'] ?? null"
    :data-testid="$attrs['data-testid'] ?? null"
    :role="$attrs['role'] ?? null"
    :aria-label="$attrs['aria-label'] ?? null"
    :tabindex="$attrs['tabindex'] ?? null"
    :aria-describedby="$attrs['aria-describedby'] ?? null"
><razor-slot name="header">@foreach ($headerRows as $row)<tr><th>Name</th><th>Role</th><th>Status</th></tr>@endforeach</razor-slot><razor-slot name="footer">@foreach ($footerRows as $row)<tr><td colspan="3">Seats used: 8 of 10</td></tr>@endforeach</razor-slot>@foreach ($bodyRows as $row)<tr>@foreach ($row as $cell)<td>{{ $cell }}</td>@endforeach</tr>@endforeach @if (($content['body']['control'] ?? false) === true)<tr><td colspan="3"><button type="button">Invite member</button></td></tr>@endif</vf-table>
@elseif ($combo === 'caption+body')
<vf-table
    :caption="$member['caption'] ?? null"
    :column-dividers="$member['columnDividers'] ?? null"
    :compact="$member['compact'] ?? null"
    :striped="$member['striped'] ?? null"
    :sticky-header="$member['stickyHeader'] ?? null"
    :class="$attrs['class'] ?? null"
    :style="$attrs['style'] ?? null"
    :id="$attrs['id'] ?? null"
    :data-testid="$attrs['data-testid'] ?? null"
    :role="$attrs['role'] ?? null"
    :aria-label="$attrs['aria-label'] ?? null"
    :tabindex="$attrs['tabindex'] ?? null"
    :aria-describedby="$attrs['aria-describedby'] ?? null"
><razor-slot name="caption">{{ $content['caption']['text'] ?? '' }}@if (($content['caption']['markup'] ?? null) === 'rich')<strong>Team</strong> members@endif</razor-slot>@foreach ($bodyRows as $row)<tr>@foreach ($row as $cell)<td>{{ $cell }}</td>@endforeach</tr>@endforeach @if (($content['body']['control'] ?? false) === true)<tr><td colspan="3"><button type="button">Invite member</button></td></tr>@endif</vf-table>
@else
    <p class="razor-showcase__unsupported">This partial has no branch for the slot combination [{{ $combo }}].</p>
@endif
