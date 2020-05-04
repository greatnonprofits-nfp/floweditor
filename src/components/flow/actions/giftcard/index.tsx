import React from 'react';
import { CallGiftcard } from 'flowTypes';

export const GiftcardComp: React.SFC<CallGiftcard> = ({ giftcard_db }): JSX.Element => (
  <div>{giftcard_db.text}</div>
);
