import { createWebhookBasedNode } from 'components/flow/routers/helpers';
import { LookupRouterFormState } from 'components/flow/routers/lookup/LookupRouterForm';
import { DEFAULT_BODY } from 'components/nodeeditor/constants';
import { Types } from 'config/interfaces';
import { CallLookup } from 'flowTypes';
import { RenderNode } from 'store/flowContext';
import { NodeEditorSettings, StringEntry } from 'store/nodeEditor';
import { createUUID } from 'utils';

interface LookupMap {
  [key: string]: string;
}

export interface LookupQuery {
  [index: number]: { rule: LookupMap; field: LookupMap; value: string };
}

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

  const state: LookupRouterFormState = {
    lookupDb,
    lookupQueries: [{ field: {}, rule: {}, value: '' }],
    resultName,
    valid: false
  };

  if (settings.originalNode.ui.type === Types.split_by_lookup) {
    const action = getOriginalAction(settings) as CallLookup;

    // add in our headers
    for (const name of Object.keys(action.headers || []).sort()) {
      state.headers.push({
        value: {
          uuid: createUUID(),
          value: action.headers[name],
          name
        }
      });
    }

    state.resultName = { value: action.result_name };
    state.url = { value: action.url };
    state.method = { value: { label: action.method, value: action.method } };
    state.postBody = { value: action.body };
    state.valid = true;
  } else {
    state.headers.push({
      value: {
        uuid: createUUID(),
        name: 'Content-Type',
        value: 'application/json'
      }
    });
  }

  // one empty header
  state.headers.push({
    value: {
      uuid: createUUID(),
      name: '',
      value: ''
    }
  });

  return state;
};

export const stateToNode = (
  settings: NodeEditorSettings,
  state: WebhookRouterFormState
): RenderNode => {
  const headers: HeaderMap = {};

  for (const entry of state.headers) {
    if (entry.value.name.trim().length !== 0) {
      headers[entry.value.name] = entry.value.value;
    }
  }
  let uuid = createUUID();

  const originalAction = getOriginalAction(settings);
  if (originalAction) {
    uuid = originalAction.uuid;
  }

  const newAction: CallWebhook = {
    uuid,
    headers,
    type: Types.call_webhook,
    url: state.url.value,
    method: state.method.value.value as Methods,
    result_name: state.resultName.value
  };

  // include the body if we aren't a get
  if (newAction.method !== Methods.GET) {
    newAction.body = state.postBody.value;
  }

  return createWebhookBasedNode(newAction, settings.originalNode);
};
