import { FormState, StringEntry, NodeEditorSettings } from 'store/nodeEditor';
import { VoiceCallStatusAction } from 'flowTypes';
import { RenderNode } from 'store/flowContext';
import { Types } from 'config/interfaces';
import { getActionUUID } from 'components/flow/actions/helpers';
import { createVoiceCallStatusNode } from '../helpers';

export interface VoiceCallStatusFormState extends FormState {
  resultName: StringEntry;
}

export const nodeToState = (settings: NodeEditorSettings): VoiceCallStatusFormState => {
  const nodeFirstAction = settings.originalAction || settings.originalNode.node.actions[0];
  if (nodeFirstAction && nodeFirstAction.type === Types.voicecall_status) {
    const action = nodeFirstAction as VoiceCallStatusAction;

    return {
      resultName: { value: action.result_name },
      valid: true
    };
  }

  return {
    resultName: { value: 'Result' },
    valid: true
  };
};

export const stateToNode = (
  settings: NodeEditorSettings,
  state: VoiceCallStatusFormState
): RenderNode => {
  const action: VoiceCallStatusAction = {
    result_name: state.resultName.value,
    type: Types.voicecall_status,
    uuid: getActionUUID(settings, Types.voicecall_status)
  };

  return createVoiceCallStatusNode(action, settings.originalNode, false);
};
