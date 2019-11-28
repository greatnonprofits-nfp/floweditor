import React from 'react';
import styles from './LookupParametersForm.module.scss';
import { AssetStore } from 'store/flowContext';
import axios from 'axios';
import { LookupParameterField } from './LookupParamaterField';
import { LookupField, LookupDB, LookupQuery } from 'flowTypes';

export interface LookupParametersFormProps {
  lookup: LookupDB;
  parameters: LookupQuery[];
  assetStore: AssetStore;
  onPressAdd: () => void;
  onChange?: () => void;
}

export const LookupParametersForm = ({
  lookup,
  assetStore,
  onPressAdd,
  ...props
}: LookupParametersFormProps): JSX.Element => {
  const [fields, setFields] = React.useState<LookupField[]>([]);

  React.useEffect(() => {
    axios
      .get(assetStore.lookups.endpoint, { params: { db: lookup.id } })
      .then(response => response.data.results)
      .then(setFields);
  }, [lookup.id, assetStore.lookups.endpoint]);

  return (
    <section className={styles.lookup_parameters}>
      <div>Lookup Parameters</div>
      <div className={styles.header}>
        <div>Field</div>
        <div>Rule</div>
        <div>Value</div>
      </div>

      <LookupParameterField fields={fields} />

      <div className={styles.footer} onClick={onPressAdd}>
        <span className="fe-add" />
      </div>
    </section>
  );
};
