import { createWebhookBasedNode } from 'components/flow/routers/helpers';
import {
  LookupRouterFormState,
  LookupDBEntry
} from 'components/flow/routers/lookup/LookupRouterForm';
import { Types } from 'config/interfaces';
import { CallLookup } from 'flowTypes';
import { RenderNode } from 'store/flowContext';
import { NodeEditorSettings, StringEntry } from 'store/nodeEditor';
import { createUUID } from 'utils';

export const getOriginalAction = (settings: NodeEditorSettings): CallLookup => {
  const action =
    settings.originalAction ||
    (settings.originalNode.node.actions.length > 0 && settings.originalNode.node.actions[0]);

  if (action.type === Types.call_lookup) {
    return action as CallLookup;
  }
};

export const nodeToState = (settings: NodeEditorSettings): LookupRouterFormState => {
  // TODO: work out an incremental result name
  const resultName: StringEntry = { value: 'Result' };
  const _lookupDb: LookupDBEntry = { value: { id: '', text: '' } };

  const state: LookupRouterFormState = {
    lookupDb: _lookupDb,
    lookupQueries: [],
    resultName,
    valid: false
  };

  if (settings.originalNode.ui.type === Types.split_by_lookup) {
    const action = getOriginalAction(settings) as CallLookup;

    state.resultName = { value: action.result_name };
    state.lookupDb = { value: action.lookup_db };
    state.lookupQueries = action.lookup_queries;
    state.valid = true;
  }

  return state;
};

export const stateToNode = (
  settings: NodeEditorSettings,
  state: LookupRouterFormState
): RenderNode => {
  let uuid = createUUID();

  const originalAction = getOriginalAction(settings);
  if (originalAction) {
    uuid = originalAction.uuid;
  }

  const newAction: CallLookup = {
    uuid,
    lookup_queries: state.lookupQueries,
    type: Types.call_lookup,
    lookup_db: state.lookupDb.value,
    result_name: state.resultName.value
  };

  return createWebhookBasedNode(newAction, settings.originalNode);
};
