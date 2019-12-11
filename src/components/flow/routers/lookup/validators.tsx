import { LookupQuery } from 'flowTypes';
import { validate, Required } from 'store/validators';
import { LookupQueryEntry } from './helpers';

export const validateLookupQuery = (query: LookupQuery) => {
  const updates: LookupQueryEntry = {
    field: validate('field', query.field && query.field.id, [Required]),
    rule: validate('rule', query.rule && query.rule.type, [Required]),
    value: validate('value', query.value, [Required])
  };
  return updates;
};
