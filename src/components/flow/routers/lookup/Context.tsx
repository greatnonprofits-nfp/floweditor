import React from 'react';
import { LookupQuery } from 'flowTypes';

export interface LookQueryContextType {
  updateQuery: (query: LookupQuery, atIndex: number) => void;
  deleteQuery: (atIndex: number) => void;
}

export const LookQueryContext = React.createContext<LookQueryContextType>({
  updateQuery: () => null,
  deleteQuery: () => null
});
