import React from 'react';
import styles from './LookupParametersForm.module.scss';
import SelectElement, { SelectOption } from 'components/form/select/SelectElement';
import TextInputElement from 'components/form/textinput/TextInputElement';

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

export interface LookupParameterFieldType {
  id: string;
  text: string;
  type: 'String' | 'Number' | 'Date';
}

export interface LookupParameter {
  field: LookupParameterFieldType;
  rule: SelectOption;
  value: string;
}
export interface LookupParameterFieldProps {
  fields: LookupParameterFieldType[];
}

export const LookupParameterField = ({ fields, ...props }: LookupParameterFieldProps) => {
  const [param, setParam] = React.useState<LookupParameter>({
    field: { id: '', text: '', type: 'String' },
    rule: { value: '', label: '' },
    value: ''
  });

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
        options={OPERATORS[param.field.type.toLowerCase()]}
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
