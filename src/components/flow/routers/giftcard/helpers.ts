import { getActionUUID } from 'components/flow/actions/helpers';
import { CallGiftcard } from 'flowTypes';
import { Types } from 'config/interfaces';
import { NodeEditorSettings } from 'store/nodeEditor';
import { GiftCardRouterFormState } from './GiftCardRouterForm';
import { AssetType, RenderNode } from 'store/flowContext';
import { createWebhookBasedNode } from '../helpers';

export const nodeToState = (settings: NodeEditorSettings): GiftCardRouterFormState => {
  const nodeFirstAction = settings.originalAction || settings.originalNode.node.actions[0];
  if (nodeFirstAction && nodeFirstAction.type === Types.call_giftcard) {
    const action = nodeFirstAction as CallGiftcard;
    return {
      resultName: { value: action.result_name },
      giftcardDb: {
        value: {
          id: action.giftcard_db.id,
          name: action.giftcard_db.text,
          type: AssetType.GiftCard
        }
      },
      giftcardType: { value: action.giftcard_type },
      valid: true
    };
  }
  return {
    resultName: { value: 'Result' },
    giftcardDb: {
      value: { id: '', name: '', type: AssetType.GiftCard }
    },
    giftcardType: { value: 'GIFTCARD_ASSIGNING' },
    valid: false
  };
};

export const stateToNode = (
  nodeSettings: NodeEditorSettings,
  formState: GiftCardRouterFormState
): RenderNode => {
  const action: CallGiftcard = {
    type: Types.call_giftcard,
    result_name: formState.resultName.value,
    giftcard_db: {
      id: formState.giftcardDb.value.id,
      // @ts-ignore
      text: formState.giftcardDb.value.name || formState.giftcardDb.value.text
    },
    giftcard_type: formState.giftcardType.value,
    uuid: getActionUUID(nodeSettings, Types.call_giftcard)
  };

  return createWebhookBasedNode(action, nodeSettings.originalNode, false);
};
