<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\PropBag;
use Codemonster\Ui\Support\Theme;
use Codemonster\View\EngineInterface;

/**
 * The server half of the theme subsystem.
 *
 * This renders the control; Theme::modeFromCookie is what lets a page stamp the chosen mode on its
 * root before the first paint, which is the whole reason the preference lives in a cookie rather
 * than in localStorage.
 */
final class CmThemeSwitch implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $mode = Theme::normalizeMode($props->string('modelValue', Theme::SYSTEM));
        $name = $props->string('name', 'cm-theme');
        $legend = $props->string('legend', 'Theme');
        $options = $this->options($props->array('options', []), $mode);
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-theme-switch')
            ->add($this->className($attributes))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.theme-switch', [
            'classes' => $classes,
            'attributes' => $attributes->without(['class'])->render(),
            'legend' => $legend,
            'name' => $name,
            'options' => $options,
        ]), "\r\n"));
    }

    /**
     * Narrows caller-supplied options, which arrive untyped from the prop bag.
     *
     * An entry that is not an array, or that names a mode this kit does not have, resolves to
     * `system` rather than rejecting the render: a malformed option should cost the person a wrong
     * label, not the whole page.
     *
     * @param array<mixed> $options
     *
     * @return list<array{value: string, label: string, checked: bool}>
     */
    private function options(array $options, string $mode): array
    {
        if ($options === []) {
            $options = [
                ['value' => Theme::LIGHT, 'label' => 'Light'],
                ['value' => Theme::SYSTEM, 'label' => 'System'],
                ['value' => Theme::DARK, 'label' => 'Dark'],
            ];
        }

        $rendered = [];
        foreach ($options as $option) {
            $source = is_array($option) ? $option : [];
            $rawValue = $source['value'] ?? null;
            $rawLabel = $source['label'] ?? null;
            $value = Theme::normalizeMode(is_string($rawValue) ? $rawValue : null);
            $rendered[] = [
                'value' => $value,
                'label' => is_string($rawLabel) ? $rawLabel : $value,
                'checked' => $value === $mode,
            ];
        }

        return $rendered;
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new \InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
