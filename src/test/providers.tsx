import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import type { City } from '../api';
import type { AppStore } from '../store';
import { createTestStore } from './store';

type TestProvidersProps = {
  children: ReactNode;
  cities?: readonly City[];
  store?: AppStore;
};

export function TestProviders({
  children,
  cities,
  store,
}: TestProvidersProps) {
  const [testStore] = useState(
    () => store ?? createTestStore(cities ? { cities } : undefined),
  );

  return <Provider store={testStore}>{children}</Provider>;
}
