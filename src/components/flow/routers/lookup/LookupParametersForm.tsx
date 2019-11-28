import React from 'react';
import { LookupDB } from './helpers';
import styles from './LookupParametersForm.module.scss';
import SelectElement from 'components/form/select/SelectElement';

export interface LookupParameter {
  field: string;
  rule: string;
  value: string;
}

export interface LookupParametersFormProps {
  lookup: LookupDB;
  onChange?: () => void;
}

export const LookupParametersForm = (props: LookupParametersFormProps): JSX.Element => {
  return (
    <section className={styles.lookup_parameters}>
      <div>Lookup Parameters</div>
      <div className={styles.header}>
        <div>Field</div>
        <div>Rule</div>
        <div>Value</div>
      </div>
      <div className={styles.lookup_row}>
        <SelectElement entry={{ value: '' }} name="field" options={[]} />
        <SelectElement entry={{ value: '' }} name="rule" options={[]} />
        <SelectElement entry={{ value: '' }} name="value" options={[]} />
        <div className={styles.delete}>
          <span className="fe-x" />
        </div>
      </div>

      <div className={styles.footer}>
        <span className="fe-add" />
      </div>
    </section>
  );
};
