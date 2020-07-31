import * as React from 'react';
import { TrackableLinkAction } from 'flowTypes';

const ShortenUrlComp: React.SFC<TrackableLinkAction> = ({ shorten_url }): JSX.Element => (
  <div>{shorten_url.text}</div>
);

export default ShortenUrlComp;