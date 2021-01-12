import * as React from 'react';
import { react as bindCallbacks } from 'auto-bind';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import { RouterFormProps } from 'components/flow/props';
import { createResultNameInput } from 'components/flow/routers/widgets';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import TypeList from 'components/nodeeditor/TypeList';
import { Asset } from 'store/flowContext';

import {
  Alphanumeric,
  Required,
  shouldRequireIf,
  StartIsNonNumeric,
  validate
} from 'store/validators';
import { ShortenUrlFormState, nodeToState, stateToNode } from './helpers';
import { mergeForm } from 'store/nodeEditor';

export default class ShortenUrlForm extends React.Component<RouterFormProps, ShortenUrlFormState> {
  constructor(props: RouterFormProps) {
    super(props);

    this.state = nodeToState(this.props.nodeSettings);
    bindCallbacks(this, {
      include: [/^on/, /^handle/]
    });
  }

  private handleUpdateResultName(value: string): void {
    const updates: Partial<ShortenUrlFormState> = {
      resultName: validate('Result Name', value, [Required, Alphanumeric, StartIsNonNumeric])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
  }

  private handleShortenUrlUpdate(selected: Asset[], submitting = false): boolean {
    const updates: Partial<ShortenUrlFormState> = {
      shortenUrl: validate('shortenUrl', selected[0], [Required, shouldRequireIf(submitting)])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
    return updated.valid;
  }

  private handleSave(): void {
    if (this.state.valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
      this.props.onClose(false);
    }
  }

  private getButtons(): ButtonSet {
    return {
      primary: { name: 'Ok', onClick: this.handleSave, disabled: !this.state.valid },
      secondary: {
        name: 'Cancel',
        onClick: () => this.props.onClose(true)
      }
    };
  }

  public render(): JSX.Element {
    const typeConfig = this.props.typeConfig;

    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />
        <div>Select which Trackable Link would you like to shorten</div>

        <AssetSelector
          name="shortenUrl"
          placeholder="Select your trackable link to be shortened"
          assets={this.props.assetStore.shorten_url}
          entry={this.state.shortenUrl}
          searchable={true}
          onChange={this.handleShortenUrlUpdate}
          nameKey={'text'}
          valueKey={'id'}
        />
        {createResultNameInput(this.state.resultName, this.handleUpdateResultName, true)}
      </Dialog>
    );
  }
}
