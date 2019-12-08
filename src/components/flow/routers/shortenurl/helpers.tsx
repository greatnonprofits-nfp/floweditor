import {
  FormEntry,
  FormState,
  StringEntry,
  NodeEditorSettings,
  AssetEntry
} from 'store/nodeEditor';
import { TrackableLinkType, TrackableLinkAction } from 'flowTypes';
import { RenderNode, AssetType } from 'store/flowContext';
import { Types } from 'config/interfaces';
import { getActionUUID } from 'components/flow/actions/helpers';
import { createWebhookBasedNode } from '../helpers';

export interface ShortenUrlEntry extends FormEntry {
  value: TrackableLinkType;
}

export interface ShortenUrlFormState extends FormState {
  shortenUrl: AssetEntry;
  resultName: StringEntry;
}

export const nodeToState = (settings: NodeEditorSettings): ShortenUrlFormState => {
  const nodeFirstAction = settings.originalAction || settings.originalNode.node.actions[0];
  if (nodeFirstAction.type === Types.shorten_url) {
    const action = nodeFirstAction as TrackableLinkAction;

    return {
      resultName: { value: action.result_name },
      shortenUrl: {
        value: {
          id: action.shorten_url.id,
          name: action.shorten_url.text,
          type: AssetType.TrackableLink
        }
      },
      valid: true
    };
  }
  return {
    resultName: { value: 'Result' },
    shortenUrl: { value: { id: '', name: '', type: AssetType.TrackableLink } },
    valid: false
  };
};

export const stateToNode = (
  settings: NodeEditorSettings,
  state: ShortenUrlFormState
): RenderNode => {
  console.log(state.shortenUrl);
  const action: TrackableLinkAction = {
    result_name: state.resultName.value,
    shorten_url: {
      id: state.shortenUrl.value.id,
      text: state.shortenUrl.value.name
    },
    type: Types.shorten_url,
    uuid: getActionUUID(settings, Types.shorten_url)
  };

  return createWebhookBasedNode(action, settings.originalNode);
};
