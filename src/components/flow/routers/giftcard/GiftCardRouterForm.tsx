import React from 'react';
import { FormState, StringEntry, AssetEntry, mergeForm } from 'store/nodeEditor';
import { RouterFormProps } from 'components/flow/props';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import TypeList from 'components/nodeeditor/TypeList';
import { createResultNameInput } from '../widgets';
import { nodeToState, stateToNode } from './helpers';
import { validate, Alphanumeric, StartIsNonNumeric, shouldRequireIf } from 'store/validators';
import { hasErrors } from 'components/flow/actions/helpers';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import { Asset } from 'store/flowContext';
import SelectElement from 'components/form/select/SelectElement';

export interface GiftCardRouterFormState extends FormState {
  giftcardDb: AssetEntry;
  resultName: StringEntry;
}

class GiftCardRouterForm extends React.PureComponent<RouterFormProps, GiftCardRouterFormState> {
  constructor(props: RouterFormProps) {
    super(props);
    this.state = nodeToState(this.props.nodeSettings);
  }
  private handleSave = () => {
    if (this.state.valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
      this.props.onClose(false);
    }
  };

  private handleUpdateResultName = (value: string): void => {
    const resultName = validate('resultName', value, [Alphanumeric, StartIsNonNumeric]);

    this.setState({
      resultName,
      valid: this.state.valid && !hasErrors(resultName)
    });
  };

  public handleGiftcardChanged = (selected: Asset[], submitting = false): boolean => {
    const updates: Partial<GiftCardRouterFormState> = {
      giftcardDb: validate('giftcardDb', selected[0], [shouldRequireIf(submitting)])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  };

  private getButtons = (): ButtonSet => {
    return {
      primary: { name: 'Ok', onClick: this.handleSave },
      secondary: { name: 'Cancel', onClick: () => this.props.onClose(true) }
    };
  };
  public render(): JSX.Element {
    const { typeConfig } = this.props;
    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <SelectElement
          name="assign"
          options={[
            { value: '1', label: 'Assign Gift Card' },
            { value: '2', label: 'Check Status' }
          ]}
          onChange={console.log}
          entry={{ value: '' }}
        />
        <p>Select which collection would you like to query the Gift Card</p>
        <AssetSelector
          assets={this.props.assetStore.giftcard}
          entry={this.state.giftcardDb}
          name="giftcardDb"
          onChange={this.handleGiftcardChanged}
        />
        {createResultNameInput(this.state.resultName, this.handleUpdateResultName)}
      </Dialog>
    );
  }
}

export default GiftCardRouterForm;
