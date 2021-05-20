import * as React from 'react';
import { react as bindCallbacks } from 'auto-bind';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import { RouterFormProps } from 'components/flow/props';
import { createResultNameInput } from 'components/flow/routers/widgets';
import TypeList from 'components/nodeeditor/TypeList';

import { Alphanumeric, Required, StartIsNonNumeric, validate } from 'store/validators';
import { VoiceCallStatusFormState, nodeToState, stateToNode } from './helpers';
import { mergeForm } from 'store/nodeEditor';
import { renderIssues } from 'components/flow/actions/helpers';

export default class VoiceCallStatusForm extends React.Component<
  RouterFormProps,
  VoiceCallStatusFormState
> {
  constructor(props: RouterFormProps) {
    super(props);

    this.state = nodeToState(this.props.nodeSettings);
    bindCallbacks(this, {
      include: [/^on/, /^handle/]
    });
  }

  private checkIVRMachineDetection(): boolean {
    const hasMachineDetection = this.props.assetStore.environment.items.environment
      .has_ivr_machine_detection;

    if (!hasMachineDetection) {
      this.props.mergeEditorState({
        modalMessage: {
          title: 'Warning',
          body:
            'Sorry, IVR machine detection is not enabled for this organization. Please enable it before using this flow step.'
        },
        saving: false
      });
      return false;
    }

    return true;
  }

  private handleUpdateResultName(value: string): void {
    const updates: Partial<VoiceCallStatusFormState> = {
      resultName: validate('Result Name', value, [Required, Alphanumeric, StartIsNonNumeric])
    };

    const updated = mergeForm(this.state, updates);
    this.setState(updated);
  }

  private handleSave(): void {
    if (!this.checkIVRMachineDetection()) {
      return;
    }
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
        {createResultNameInput(this.state.resultName, this.handleUpdateResultName, true)}
        {renderIssues(this.props)}
      </Dialog>
    );
  }
}
