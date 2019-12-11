import { validate, Required } from 'store/validators';
import { LookupQueryEntry, LookupQueryFieldEntry, LookupQueryRuleEntry } from './helpers';
import { LookupField, LookupRule } from 'flowTypes';

const validateLookupField = (field: LookupField): LookupQueryFieldEntry => {
  return {
    value: field,
    validationFailures: Required('field', field.id).failures
  };
};

const validateLookupRule = (rule: LookupRule): LookupQueryRuleEntry => {
  return {
    value: rule,
    validationFailures: Required('rule', rule.type).failures
  };
};

export const validateLookupQuery = (query: LookupQueryEntry) => {
  const field = validateLookupField(query.field.value);
  const rule = validateLookupRule(query.rule.value);
  const value = validate('value', query.value.value, [Required]);

  const updates: LookupQueryEntry = {
    field,
    rule,
    value,
    validationFailures: [].concat(
      ...field.validationFailures,
      ...rule.validationFailures,
      ...value.validationFailures
    )
  };
  return updates;
};
