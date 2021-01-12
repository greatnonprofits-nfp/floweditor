import { createWebhookBasedNode } from 'components/flow/routers/helpers';
import { LookupRouterFormState } from 'components/flow/routers/lookup/LookupRouterForm';
import { Types } from 'config/interfaces';
import { CallLookup, LookupField, LookupRule } from 'flowTypes';
import { RenderNode, AssetType } from 'store/flowContext';
import { NodeEditorSettings, StringEntry, FormEntry } from 'store/nodeEditor';
import { createUUID } from 'utils';

export interface LookupQueryFieldEntry extends FormEntry {
  value: LookupField;
}

export interface LookupQueryRuleEntry extends FormEntry {
  value: LookupRule;
}

export interface LookupQueryEntry extends FormEntry {
  field: LookupQueryFieldEntry;
  rule: LookupQueryRuleEntry;
  value: StringEntry;
}

export const getOriginalAction = (settings: NodeEditorSettings): CallLookup => {
  const action = settings.originalAction || settings.originalNode.node.actions[0];

  if (action && action.type === Types.call_lookup) {
    return action as CallLookup;
  }
};

export const nodeToState = (settings: NodeEditorSettings): LookupRouterFormState => {
  const resultName: StringEntry = { value: 'Result' };

  const state: LookupRouterFormState = {
    lookupDb: {
      value: { id: '', name: '', type: AssetType.Lookup }
    },
    lookupQueries: [],
    resultName,
    valid: false
  };

  if (settings.originalNode.ui.type === Types.split_by_lookup) {
    const action = getOriginalAction(settings) as CallLookup;

    state.resultName = { value: action.result_name };
    state.lookupDb = {
      value: {
        id: action.lookup_db.id,
        name: action.lookup_db.text,
        type: AssetType.Lookup
      }
    };
    state.lookupQueries = action.lookup_queries.map(query => ({
      field: { value: query.field },
      rule: { value: query.rule },
      value: { value: query.value }
    }));
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
    lookup_queries: state.lookupQueries.map(query => ({
      field: query.field.value,
      rule: query.rule.value,
      value: query.value.value
    })),
    type: Types.call_lookup,
    lookup_db: {
      id: state.lookupDb.value.id,
      // @ts-ignore
      text: state.lookupDb.value.name || state.lookupDb.value.text
    },
    result_name: state.resultName.value
  };

  return createWebhookBasedNode(newAction, settings.originalNode, false);
};
