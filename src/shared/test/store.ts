/**
 * shared/test → @entities/* — сознательное исключение из направления
 * «entities → shared»: здесь сидят фикстуры доменных типов и inject endpoints
 * для тестов. Production `shared` entities не импортирует (см. eslint).
 *
 * Side-effect импорты вызывают injectEndpoints при загрузке модуля.
 */
import '@entities/booking';
import '@entities/flight';
import { cityApi, type City } from '@entities/city';
import { makeStore, type AppStore } from '@shared/store';

export function createTestStore(options?: {
  cities?: readonly City[];
}): AppStore {
  const store = makeStore();
  if (options?.cities) {
    store.dispatch(
      cityApi.util.upsertQueryEntries([
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
