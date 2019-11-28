import * as React from 'react';
import { react as bindCallbacks } from 'auto-bind';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import { hasErrors } from 'components/flow/actions/helpers';
import { RouterFormProps } from 'components/flow/props';
import { nodeToState, stateToNode } from 'components/flow/routers/lookup/helpers';
import { createResultNameInput } from 'components/flow/routers/widgets';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import TypeList from 'components/nodeeditor/TypeList';
import { Asset } from 'store/flowContext';
import { FormEntry, FormState, mergeForm, StringEntry } from 'store/nodeEditor';
import {
  Alphanumeric,
  Required,
  shouldRequireIf,
  StartIsNonNumeric,
  validate
} from 'store/validators';
import { LookupParametersForm } from './LookupParametersForm';
import { LookupDB, LookupQuery } from 'flowTypes';

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
      include: [/^on/, /^handle/]
    });
  }

  private handleUpdateResultName(value: string): void {
    const resultName = validate('Result Name', value, [Required, Alphanumeric, StartIsNonNumeric]);
    this.setState({
      resultName,
      valid: this.state.valid && !hasErrors(resultName)
    });
  }

  private handleDbUpdate(selected: Asset[], submitting = false): boolean {
    const updates: Partial<LookupRouterFormState> = {
      lookupDb: validate('LookupDb', selected[0], [shouldRequireIf(submitting)])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
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

  public render(): JSX.Element {
    const typeConfig = this.props.typeConfig;

    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <div>Make some queries for lookup...</div>

        <AssetSelector
          name="LookupDb"
          placeholder="Select the lookup collection"
          assets={this.props.assetStore.lookups}
          entry={this.state.lookupDb}
          searchable={true}
          onChange={this.handleDbUpdate}
        />
        {this.state.lookupDb.value.id && (
          <LookupParametersForm
            parameters={[]}
            onPressAdd={console.log}
            lookup={this.state.lookupDb.value}
            assetStore={this.props.assetStore}
          />
        )}
        {createResultNameInput(this.state.resultName, this.handleUpdateResultName)}
      </Dialog>
    );
  }
}
