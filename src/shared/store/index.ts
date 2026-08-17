import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import { rtkQueryErrorMiddleware } from './errorMiddleware';

export {
  api,
  getQueryErrorMessage,
  getQueryErrorStatus,
  isAbortError,
  runQuery,
  toQueryError,
  type ApiQueryError,
} from './api';

export { rtkQueryErrorTag } from './errorMiddleware';

export function makeStore() {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware, rtkQueryErrorMiddleware),
  });
}

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
