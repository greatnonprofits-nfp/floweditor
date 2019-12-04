import { FormEntry, FormState, StringEntry, NodeEditorSettings } from 'store/nodeEditor';
import { TrackableLinkType } from 'flowTypes';
import { RenderNode } from 'store/flowContext';

export interface ShortenUrlEntry extends FormEntry {
  value: TrackableLinkType;
}

export interface ShortenUrlFormState extends FormState {
  shortenUrl: ShortenUrlEntry;
  resultName: StringEntry;
}

export const nodeToState = (settings: NodeEditorSettings): ShortenUrlFormState => {
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
  return;
};
