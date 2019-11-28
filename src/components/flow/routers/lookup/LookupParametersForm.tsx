import React from 'react';
import { LookupDB } from './helpers';
import styles from './LookupParametersForm.module.scss';
import { AssetStore } from 'store/flowContext';
import axios from 'axios';
import { LookupParameterFieldType, LookupParameterField } from './LookupParamaterField';

export interface LookupParametersFormProps {
  lookup: LookupDB;
  assetStore: AssetStore;
  onChange?: () => void;
}

export const LookupParametersForm = ({
  lookup,
  assetStore,
  ...props
}: LookupParametersFormProps): JSX.Element => {
  const [fields, setFields] = React.useState<LookupParameterFieldType[]>([]);

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

      <div className={styles.footer}>
        <span className="fe-add" />
      </div>
    </section>
  );
};
