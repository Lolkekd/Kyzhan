import { createContext, useContext } from 'react';

export interface Nav {
  index: number;
  total: number;
  goTo: (i: number) => void;
  next: () => void;
  prev: () => void;
}

export const NavContext = createContext<Nav>({ index: 0, total: 0, goTo: () => {}, next: () => {}, prev: () => {} });
export const useNav = () => useContext(NavContext);
