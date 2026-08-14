import type { City } from '../api';
import { api } from '../store/api';
import { makeStore, type AppStore } from '../store';

export function createTestStore(options?: { cities?: readonly City[] }): AppStore {
  const store = makeStore();
  if (options?.cities) {
    store.dispatch(
      api.util.upsertQueryEntries([
        {
          endpointName: 'getCities',
          arg: undefined,
          value: [...options.cities],
        },
      ]),
    );
  }
  return store;
}
