<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Support;

use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\PropBag;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class ComponentSupportTest extends TestCase
{
    public function testConsumesValidatedPropsAndPreservesUnknownAttributes(): void
    {
        $props = new PropBag([
            'variant' => 'secondary',
            'disabled' => true,
            'href' => null,
            'data-id' => 'save',
        ]);

        self::assertSame('secondary', $props->oneOf('variant', ['primary', 'secondary'], 'primary'));
        self::assertTrue($props->bool('disabled'));
        self::assertNull($props->nullableString('href'));
        self::assertSame([], $props->array('items'));
        self::assertNull($props->nullableArray('open-items'));
        self::assertNull($props->stringOrNumber('min-height'));
        self::assertSame(['data-id' => 'save'], $props->remaining());
    }

    public function testRejectsInvalidPropTypesAndFiniteValues(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('must be one of');

        (new PropBag(['variant' => 'unknown']))->oneOf('variant', ['primary', 'secondary'], 'primary');
    }

    public function testEscapesAttributesAndOmitsFalseyBooleanValues(): void
    {
        $attributes = new AttributeBag([
            'id' => 'save',
            'title' => '"quoted" <unsafe>',
            'disabled' => true,
            'hidden' => false,
            'empty' => null,
        ]);

        self::assertSame(
            ' id="save" title="&quot;quoted&quot; &lt;unsafe&gt;" disabled',
            $attributes->render(),
        );
        self::assertSame(' id="save" disabled', $attributes->without(['title'])->render());
    }

    public function testRejectsEventHandlerAttributeNames(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Unsafe HTML attribute name');

        new AttributeBag(['onclick' => 'alert(1)']);
    }

    public function testBuildsStableDeduplicatedClasses(): void
    {
        $classes = (new ClassBuilder())
            ->add('cm-button', 'cm-button--primary consumer cm-button')
            ->addWhen(true, 'active')
            ->addWhen(false, 'hidden');

        self::assertSame('cm-button cm-button--primary consumer active', $classes->value());
    }
}
