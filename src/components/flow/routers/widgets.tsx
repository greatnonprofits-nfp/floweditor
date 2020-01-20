import * as React from 'react';
import { hasErrors } from 'components/flow/actions/helpers';
import OptionalTextInput from 'components/form/optionaltext/OptionalTextInput';
import { StringEntry } from 'store/nodeEditor';
import { snakify } from 'utils';

export const createResultNameInput = (
  value: StringEntry,
  onChange: (value: string) => void,
  helpText?: string
): JSX.Element => {
  const snaked = !hasErrors(value) && value.value ? '.' + snakify(value.value) : '';
  const defaultHelpText =
    helpText || `By naming the result, you can reference it later using @results${snaked}`;

  return (
    <OptionalTextInput
      name="Result Name"
      maxLength={64}
      value={value}
      onChange={onChange}
      toggleText="Save as.."
      helpText={defaultHelpText}
    />
  );
};
