import React from 'react';
import styles from './LookupParametersForm.module.scss';
import SelectElement, { SelectOption } from 'components/form/select/SelectElement';
import TextInputElement from 'components/form/textinput/TextInputElement';
import { LookupField, LookupQuery } from 'flowTypes';

const OPERATORS: { [type: string]: SelectOption[] } = {
  date: [{ label: 'has a date equal to', value: 'date_equal' }],
  number: [
    { value: 'equals', label: 'equals' },
    { value: 'lt', label: 'has a number less than' },
    { value: 'gt', label: 'has a number more than' }
  ],
  string: [
    { value: 'equals', label: 'equals' },
    { value: 'contains', label: 'contains' },
    { value: 'regex', label: 'matches regex' }
  ]
};

export interface LookupParameterFieldProps {
  fields: LookupField[];
}

export const LookupParameterField = ({ fields, ...props }: LookupParameterFieldProps) => {
  const [param, setParam] = React.useState<LookupQuery>({
    field: { id: '', text: '', type: 'String' },
    rule: { type: '', verbose_name: '' },
    value: ''
  });

  const ruleOperators = React.useMemo(() => OPERATORS[param.field.type.toLowerCase()], [
    param.field.type
  ]);

  // Reset rule value when selecting a different field type
  React.useEffect(() => {
    if (!ruleOperators.find(rule => rule.value === param.rule.type)) {
      setParam({ ...param, rule: { type: '', verbose_name: '' } });
    }
  }, [param.field.type, ruleOperators]);

  return (
    <div className={styles.lookup_row}>
      <SelectElement
        name="field"
        entry={{ value: param.field }}
        options={fields}
        getOptionLabel={item => item.text}
        getOptionValue={item => item.id}
        onChange={option => setParam({ ...param, field: option })}
      />
      <SelectElement
        entry={{ value: param.rule }}
        name="rule"
        options={ruleOperators}
        onChange={option => setParam({ ...param, rule: option })}
      />
      <TextInputElement
        entry={{ value: param.value }}
        name="value"
        onChange={value => setParam({ ...param, value })}
      />
      <div className={styles.delete}>
        <span className="fe-x" />
      </div>
    </div>
  );
};
