import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import type { City } from '@entities/city';
import type { AppStore } from '../store';
import { ToastProvider } from '../ui/Toast';
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

  return (
    <Provider store={testStore}>
      <ToastProvider>{children}</ToastProvider>
    </Provider>
  );
}
