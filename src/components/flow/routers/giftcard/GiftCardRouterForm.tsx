import React from 'react';
import { FormState, StringEntry, AssetEntry, mergeForm } from 'store/nodeEditor';
import { RouterFormProps } from 'components/flow/props';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import TypeList from 'components/nodeeditor/TypeList';
import HelpIcon from 'components/helpicon/HelpIcon';
import { createResultNameInput } from '../widgets';
import { nodeToState, stateToNode } from './helpers';
import {
  validate,
  Alphanumeric,
  StartIsNonNumeric,
  shouldRequireIf,
  Required
} from 'store/validators';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import { Asset } from 'store/flowContext';
import SelectElement, { SelectOption } from 'components/form/select/SelectElement';
import variables from 'variables.module.scss';

export interface GiftCardRouterFormState extends FormState {
  giftcardDb: AssetEntry;
  giftcardType: StringEntry;
  resultName: StringEntry;
}

const GIFTCARD_OPTIONS: { [key: string]: SelectOption } = {
  GIFTCARD_ASSIGNING: { value: 'GIFTCARD_ASSIGNING', label: 'Assign Gift Card' },
  GIFTCARD_CHECK: { value: 'GIFTCARD_CHECK', label: 'Check Status' }
};

const customStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end'
};
const customMargin: React.CSSProperties = { marginBottom: '6px' };

class GiftCardRouterForm extends React.PureComponent<RouterFormProps, GiftCardRouterFormState> {
  constructor(props: RouterFormProps) {
    super(props);
    this.state = nodeToState(this.props.nodeSettings);
  }

  private handleSave = (): void => {
    // validate in case they never updated an empty field
    const updates: Partial<GiftCardRouterFormState> = {
      giftcardDb: validate('Giftcard Database', this.state.giftcardDb.value, [Required]),
      resultName: validate('Result Name', this.state.resultName.value, [
        Alphanumeric,
        StartIsNonNumeric,
        Required
      ])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);

    if (this.state.valid && updated.valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
      this.props.onClose(false);
    }
  };

  private handleUpdateAssignChange = (value: SelectOption, submitting = false): void => {
    const giftcardType = validate('Giftcard Type', value.value, [shouldRequireIf(submitting)]);

    this.setState({
      giftcardType: giftcardType
    });
  };

  private handleUpdateResultName = (value: string): void => {
    const updates: Partial<GiftCardRouterFormState> = {
      resultName: validate('Result Name', value, [Alphanumeric, StartIsNonNumeric, Required])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
  };

  public handleGiftcardChanged = (selected: Asset[], submitting = false): boolean => {
    const updates: Partial<GiftCardRouterFormState> = {
      giftcardDb: validate('Giftcard Database', selected[0], [
        Required,
        shouldRequireIf(submitting)
      ])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  };

  private getButtons = (): ButtonSet => {
    return {
      primary: { name: 'Ok', onClick: this.handleSave, disabled: !this.state.valid },
      secondary: { name: 'Cancel', onClick: () => this.props.onClose(true) }
    };
  };

  public render(): JSX.Element {
    const { typeConfig } = this.props;
    const entry: SelectOption = GIFTCARD_OPTIONS[this.state.giftcardType.value]
      ? {
          value: this.state.giftcardType.value,
          label: GIFTCARD_OPTIONS[this.state.giftcardType.value]!.label
        }
      : { label: '', value: '' };
    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <p>Select which collection would you like to query the Gift Card</p>
        <AssetSelector
          assets={this.props.assetStore.giftcard}
          entry={this.state.giftcardDb}
          name="Giftcard Database"
          onChange={this.handleGiftcardChanged}
        />
        <div style={customStyles}>
          <SelectElement
            name="Giftcard Type"
            options={Object.values(GIFTCARD_OPTIONS)}
            onChange={this.handleUpdateAssignChange}
            entry={{
              value: entry
            }}
            className="giftcard-type"
          />
          <div style={customMargin}>
            <HelpIcon iconColor={variables.orange} iconSize="18px" dataFor="giftcardType">
              <p>
                Assign Gift Card: This option will reserve a gift card for the contact, saving their
                phone number and returning information needed to redeem the gift card
                electronically.
              </p>
              <p>
                Check Status: This option will return the number of Gift Cards that are unassigned
                in your database.
              </p>
            </HelpIcon>
          </div>
        </div>

        {createResultNameInput(
          this.state.resultName,
          this.handleUpdateResultName,
          false,
          'The giftcard will return responses in JSON format. Please use @webhook.result on the flow steps as a reference for each property.'
        )}
      </Dialog>
    );
  }
}

export default GiftCardRouterForm;
