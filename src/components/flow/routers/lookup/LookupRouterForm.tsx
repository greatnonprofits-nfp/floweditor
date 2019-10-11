import { react as bindCallbacks } from 'auto-bind';
import Dialog, { ButtonSet, Tab } from 'components/dialog/Dialog';
import { hasErrors } from 'components/flow/actions/helpers';
import { RouterFormProps } from 'components/flow/props';
import {
  nodeToState,
  stateToNode,
  LookupDB,
  LookupQuery
} from 'components/flow/routers/lookup/helpers';
import { createResultNameInput } from 'components/flow/routers/widgets';
import SelectElement from 'components/form/select/SelectElement';
import TypeList from 'components/nodeeditor/TypeList';
import * as React from 'react';
import { FormEntry, FormState, mergeForm, StringEntry, ValidationFailure } from 'store/nodeEditor';
import {
  Alphanumeric,
  Required,
  shouldRequireIf,
  StartIsNonNumeric,
  validate
} from 'store/validators';

import styles from './LookupRouterForm.module.scss';

export interface LookupDBEntry extends FormEntry {
  value: LookupDB;
}

export interface LookupRouterFormState extends FormState {
  lookupDb: LookupDBEntry;
  lookupQueries: LookupQuery[];
  resultName: StringEntry;
}

export default class LookupRouterForm extends React.Component<
  RouterFormProps,
  LookupRouterFormState
> {
  constructor(props: RouterFormProps) {
    super(props);
    this.state = nodeToState(this.props.nodeSettings);
    bindCallbacks(this, {
      include: [/^handle/]
    });
  }

  private handleUpdate(
    keys: {
      lookupDb?: LookupDB;
      lookupQueries?: LookupQuery;
      validationFailures?: ValidationFailure[];
      resultName?: string;
    },
    submitting = false
  ): boolean {
    const updates: Partial<LookupRouterFormState> = {};

    if (keys.hasOwnProperty('resultName')) {
      updates.resultName = validate('Result Name', keys.resultName, [shouldRequireIf(submitting)]);
    }

    const updated = mergeForm(this.state, updates);

    // update our form
    this.setState(updated);
    return updated.valid;
  }

  private handleUpdateResultName(value: string): void {
    const resultName = validate('Result Name', value, [Required, Alphanumeric, StartIsNonNumeric]);
    this.setState({
      resultName,
      valid: this.state.valid && !hasErrors(resultName)
    });
  }

  private handleDbUpdate(lookupDb: LookupDB, submitting = false): boolean {
    return this.handleUpdate({ lookupDb }, submitting);
  }

  private handleSave(): void {
    this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
    this.props.onClose(false);
  }

  private getButtons(): ButtonSet {
    return {
      primary: { name: 'Ok', onClick: this.handleSave },
      secondary: { name: 'Cancel', onClick: () => this.props.onClose(true) }
    };
  }

  private renderEdit(): JSX.Element {
    const typeConfig = this.props.typeConfig;

    const tabs: Tab[] = [];

    return (
      <Dialog
        title={typeConfig.name}
        headerClass={typeConfig.type}
        buttons={this.getButtons()}
        tabs={tabs}
      >
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <div className={styles.method}>
          <SelectElement
            name="LookupDb"
            entry={this.state.lookupDb}
            onChange={this.handleDbUpdate}
            options={[]}
          />
        </div>
        <div className={styles.instructions}>
          <p>If your server responds with JSON, each property will be added to the Flow.</p>
          <pre className={styles.code}>
            {'{ "product": "Solar Charging Kit", "stock level": 32 }'}
          </pre>
          <p>
            This response would add <span className={styles.example}>@webhook.product</span> and{' '}
            <span className={styles.example}>@webhook["stock level"]</span> for use in the flow.
          </p>
        </div>
        {createResultNameInput(this.state.resultName, this.handleUpdateResultName)}
      </Dialog>
    );
  }

  public render(): JSX.Element {
    return this.renderEdit();
  }
}
