import React from 'react';
import styles from './LookupParametersForm.module.scss';
import SelectElement from 'components/form/select/SelectElement';
import TextInputElement from 'components/form/textinput/TextInputElement';
import { LookupField, LookupQuery, LookupRule } from 'flowTypes';

const OPERATORS: { [type: string]: LookupRule[] } = {
  date: [{ verbose_name: 'has a date equal to', type: 'date_equal' }],
  number: [
    { type: 'equals', verbose_name: 'equals' },
    { type: 'lt', verbose_name: 'has a number less than' },
    { type: 'gt', verbose_name: 'has a number more than' }
  ],
  string: [
    { type: 'equals', verbose_name: 'equals' },
    { type: 'contains', verbose_name: 'contains' },
    { type: 'regex', verbose_name: 'matches regex' }
  ]
};

export interface LookupParameterFieldProps {
  fields: LookupField[];
  query: LookupQuery;
  updateQuery: (newQuery: LookupQuery) => void;
  onDelete: () => void;
}

export const LookupParameterField = ({
  fields,
  query,
  updateQuery,
  ...props
}: LookupParameterFieldProps) => {
  const ruleOperators = React.useMemo(() => OPERATORS[query.field.type.toLowerCase()], [
    query.field.type
  ]);

  // Reset rule value when selecting a different field type
  React.useEffect(() => {
    if (!ruleOperators.find(rule => rule.type === query.rule.type)) {
      updateQuery({ ...query, rule: { type: '', verbose_name: '' } });
    }
  }, [ruleOperators, query.rule.type]);

  return (
    <div className={styles.lookup_row}>
      <SelectElement
        name="field"
        entry={{ value: query.field }}
        options={fields}
        getOptionLabel={item => item.text}
        getOptionValue={item => item.id}
        onChange={option => updateQuery({ ...query, field: option })}
      />
      <SelectElement
        entry={{ value: query.rule }}
        name="rule"
        options={ruleOperators}
        onChange={rule => updateQuery({ ...query, rule })}
        getOptionLabel={item => item.verbose_name}
        getOptionValue={item => item.type}
      />
      <TextInputElement
        entry={{ value: query.value }}
        name="value"
        onChange={value => updateQuery({ ...query, value })}
      />
      <div className={styles.delete} onClick={props.onDelete}>
        <span className="fe-x" />
      </div>
    </div>
  );
};
