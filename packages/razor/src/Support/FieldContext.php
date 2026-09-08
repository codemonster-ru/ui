<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

use Closure;

/**
 * The channel between a field and the control it wraps, for one render.
 *
 * Vue splits this across two mechanisms: the default slot's scope carries the
 * control id, the described-by value and the invalid flag *down*, and
 * provide/inject carries the filled and floating-support signals back *up*.
 * Razor slots are not scoped - they are pre-compiled closures that take no
 * arguments - so neither half can be expressed the same way.
 *
 * What both platforms need is the same, though: the control has to learn its
 * id before it renders, and the field has to learn what the control reported
 * before it can pick its classes. A render-time context gives both, because
 * slot closures are invoked synchronously from inside the field's render():
 *
 *   1. the field computes the ids and describedBy, which depend only on props
 *   2. it installs this context and renders the slot
 *   3. the control reads the ids, and reports back what it is
 *   4. the field removes the context and composes its markup
 *
 * Deliberately not a general dependency-injection container or a nested
 * provide/inject port. One field, one control relationship, one render.
 *
 * @internal
 */
final class FieldContext
{
    private static ?self $current = null;

    private bool $filled = false;

    private bool $floatingSupported = false;

    private bool $consumed = false;

    public function __construct(
        public readonly string $controlId,
        public readonly ?string $describedBy,
        public readonly bool $invalid,
        public readonly bool $required,
        public readonly string $labelPlacement,
    ) {
    }

    /** The field currently rendering its control, if any. */
    public static function current(): ?self
    {
        return self::$current;
    }

    /**
     * Renders the control with this context installed.
     *
     * The previous context is restored rather than cleared, so a field nested
     * inside another field's slot cannot silently detach the outer one. The
     * restore runs in a finally block: a control that throws must not leave the
     * context installed for the rest of the request.
     *
     * @param Closure(): string $render
     */
    public function renderControl(Closure $render): string
    {
        $previous = self::$current;
        self::$current = $this;

        try {
            return $render();
        } finally {
            self::$current = $previous;
        }
    }

    /**
     * Called by the control to take ownership of the field's id and relationships.
     *
     * Marking the context consumed is what lets the field tell "my control
     * wired itself up" from "I wrapped something inert". Vue draws the same
     * line: a consumer that ignores the slot scope gets a label pointing at an
     * element that does not exist.
     */
    public function consume(): void
    {
        $this->consumed = true;
    }

    public function isConsumed(): bool
    {
        return $this->consumed;
    }

    /** Reported by the control: whether it currently holds a value. */
    public function reportFilled(bool $filled): void
    {
        $this->filled = $filled;
    }

    /**
     * Reported by the control: whether it can participate in a floating label.
     *
     * VfInput says yes unconditionally, which is what makes the reference's
     * floating label appear at all. Anything that does not say so leaves the
     * field with a plain top label, however it was configured.
     */
    public function reportFloatingSupported(bool $supported): void
    {
        $this->floatingSupported = $supported;
    }

    public function isFilled(): bool
    {
        return $this->filled;
    }

    public function supportsFloating(): bool
    {
        return $this->floatingSupported;
    }
}
