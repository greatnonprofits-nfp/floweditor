import * as React from 'react';
import { CallLookup } from 'flowTypes';

const CallLookupComp: React.SFC<CallLookup> = ({ lookup_db }): JSX.Element => (
  <div>{lookup_db.text || lookup_db.id}</div>
);

export default CallLookupComp;
