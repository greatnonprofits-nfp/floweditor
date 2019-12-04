import { FormEntry, FormState, StringEntry, NodeEditorSettings } from 'store/nodeEditor';
import { TrackableLinkType, TrackableLinkAction } from 'flowTypes';
import { RenderNode } from 'store/flowContext';
import { Types } from 'config/interfaces';
import { getActionUUID } from 'components/flow/actions/helpers';
import { createWebhookBasedNode } from '../helpers';

export interface ShortenUrlEntry extends FormEntry {
  value: TrackableLinkType;
}

export interface ShortenUrlFormState extends FormState {
  shortenUrl: ShortenUrlEntry;
  resultName: StringEntry;
}

export const nodeToState = (settings: NodeEditorSettings): ShortenUrlFormState => {
  if (settings.originalAction && settings.originalAction.type === Types.shorten_url) {
    const action = settings.originalAction as TrackableLinkAction;
    return {
      resultName: { value: action.result_name },
      shortenUrl: { value: { id: action.shorten_url.id, text: action.shorten_url.text } },
      valid: true
    };
  }
  return {
    resultName: { value: 'Result' },
    shortenUrl: { value: { id: '', text: '' } },
    valid: false
  };
};

export const stateToNode = (
  settings: NodeEditorSettings,
  state: ShortenUrlFormState
): RenderNode => {
  const action: TrackableLinkAction = {
    result_name: state.resultName.value,
    shorten_url: state.shortenUrl.value,
    type: Types.shorten_url,
    uuid: getActionUUID(settings, Types.shorten_url)
  };

  return createWebhookBasedNode(action, settings.originalNode);
};
