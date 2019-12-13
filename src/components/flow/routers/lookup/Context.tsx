import React from 'react';
import { LookupQueryEntry } from './helpers';

export interface LookQueryContextType {
  updateQuery: (query: LookupQueryEntry, atIndex: number) => void;
  deleteQuery: (atIndex: number) => void;
}

export const LookQueryContext = React.createContext<LookQueryContextType>({
  updateQuery: () => null,
  deleteQuery: () => null
});
