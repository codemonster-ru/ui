<cm-container element="main" size="lg">
    <cm-stack gap="lg">
        <cm-section>
            <cm-stack gap="sm">
                <h1>{{ $title }}</h1>
                <p>{{ $intro }}</p>
            </cm-stack>
        </cm-section>

        <cm-card title="Button">
            <cm-stack gap="sm">
                <cm-inline gap="sm">
                    <cm-button>{{ $buttonPrimaryLabel }}</cm-button>
                    <cm-button variant="secondary">{{ $buttonSecondaryLabel }}</cm-button>
                    <cm-button loading>{{ $buttonLoadingLabel }}</cm-button>
                </cm-inline>
            </cm-stack>
        </cm-card>

        <cm-card :title="$cardTitle">
            <p>{{ $cardBody }}</p>
            <razor-slot name="footer">{{ $cardFooter }}</razor-slot>
        </cm-card>

        <cm-card title="Field and Input">
            <form method="post" action="/">
                <cm-stack gap="md">
                    <cm-field :control-id="$controlId" label="Email" :description="$formDescription" required>
                        <cm-input :id="$controlId" name="email" type="email" :value="$email" required />
                    </cm-field>
                    <cm-button type="submit">Save profile</cm-button>
                </cm-stack>
            </form>
        </cm-card>

        <cm-card title="Accordion">
            <cm-accordion :id="$accordionId" :items="$accordionItems" :default-open-items="$accordionDefaultOpenItems" />
        </cm-card>
    </cm-stack>
</cm-container>
