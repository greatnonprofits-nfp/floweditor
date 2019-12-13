import React from 'react';
import styles from './LookupParametersForm.module.scss';
import { AssetStore } from 'store/flowContext';
import axios from 'axios';
import { LookupParameterField } from './LookupParamaterField';
import { LookupField, LookupQuery } from 'flowTypes';
import { LookQueryContext } from './Context';
import { AssetEntry } from 'store/nodeEditor';
import { LookupQueryEntry } from './helpers';

export interface LookupParametersFormProps {
  lookup: AssetEntry;
  valid: boolean;
  queries: LookupQueryEntry[];
  assetStore: AssetStore;
  onPressAdd: () => void;
}

export const LookupParametersForm = ({
  lookup,
  assetStore,
  onPressAdd,
  queries,
  ...props
}: LookupParametersFormProps): JSX.Element => {
  const [fields, setFields] = React.useState<LookupField[]>([]);
  const lookQueryContext = React.useContext(LookQueryContext);

  React.useEffect(() => {
    axios
      .get(assetStore.lookups.endpoint, { params: { db: lookup.value.id } })
      .then(response => response.data.results)
      .then(setFields);
  }, [lookup.value.id, assetStore.lookups.endpoint]);

  return (
    <section className={styles.lookup_parameters}>
      <div>Lookup Parameters</div>
      <div className={styles.header}>
        <div>Field</div>
        <div>Rule</div>
        <div>Value</div>
      </div>
      {queries.map((query, index) => (
        <LookupParameterField
          key={`${index}`}
          fields={fields}
          query={query}
          onDelete={() => lookQueryContext.deleteQuery(index)}
          updateQuery={newQuery => lookQueryContext.updateQuery(newQuery, index)}
        />
      ))}

      {props.valid && (
        <div className={styles.footer} onClick={onPressAdd}>
          <span className="fe-add" />
        </div>
      )}
    </section>
  );
};
