{{-- The default slot of one VfAccordion case: text, the article markup, a real
     consumer button, and a real nested vf-accordion with its own title, seed
     and text. Rendered inside the panel when open and into the deferred
     template when closed; the component decides which. --}}
@if ($body !== null){{ $body['text'] ?? '' }}@if (($body['markup'] ?? null) === 'article')<h4>Billing period</h4><p>Storage, seats and outbound transfer for the current period.</p><ul><li>Storage: 42 GB</li><li>Seats: 12</li></ul>@endif @if (isset($body['control']))<button type="button">{{ $body['control']['text'] }}</button>@endif @if (isset($body['accordion']))<vf-accordion :title="$body['accordion']['title'] ?? null" :default-open="$body['accordion']['defaultOpen'] ?? null">{{ $body['accordion']['text'] ?? '' }}</vf-accordion>@endif @endif
