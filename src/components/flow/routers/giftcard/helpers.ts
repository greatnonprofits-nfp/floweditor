import { getActionUUID } from 'components/flow/actions/helpers';
import { CallGiftcard, RouterTypes, Exit, GiftcardExitNames, SwitchRouter } from 'flowTypes';
import { Types } from 'config/interfaces';
import { NodeEditorSettings } from 'store/nodeEditor';
import { GiftCardRouterFormState } from './GiftCardRouterForm';
import { AssetType, RenderNode } from 'store/flowContext';
import { createRenderNode } from '../helpers';
import { createUUID } from 'utils';

export const nodeToState = (settings: NodeEditorSettings): GiftCardRouterFormState => {
  if (settings.originalAction && settings.originalAction.type === Types.call_giftcard) {
    const action = settings.originalAction as CallGiftcard;
    return {
      resultName: { value: action.result_name },
      giftcardDb: {
        value: {
          id: action.giftcard_db.id,
          name: action.giftcard_db.text,
          type: AssetType.GiftCard
        }
      },
      valid: true
    };
  }
  return {
    resultName: { value: 'Result' },
    giftcardDb: {
      value: { id: '', name: '', type: AssetType.GiftCard }
    },
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
      text: formState.giftcardDb.value.name
    },
    uuid: getActionUUID(nodeSettings, Types.call_giftcard)
  };

  const exits: Exit[] =
    nodeSettings.originalNode.node.exits.length > 1
      ? nodeSettings.originalNode.node.exits
      : [{ uuid: createUUID() }, { uuid: createUUID() }];

  const categories = nodeSettings.originalNode.node.router
    ? nodeSettings.originalNode.node.router.categories
    : [
        {
          uuid: createUUID(),
          name: GiftcardExitNames.Success,
          exit_uuid: exits[0].uuid
        },
        {
          uuid: createUUID(),
          name: GiftcardExitNames.Failure,
          exit_uuid: exits[1].uuid
        }
      ];

  const router: SwitchRouter = {
    type: RouterTypes.switch,
    result_name: action.result_name,
    cases: [],
    operand: '@step.value',
    default_category_uuid: categories[0].uuid,
    categories
  };
  return createRenderNode(action.uuid, router, exits, Types.call_giftcard, [action], {
    giftcard_db: action.giftcard_db
  });
};
