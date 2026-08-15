import type { ReactNode } from 'react';

export type FormFieldClassNames = {
  field?: string;
  label?: string;
  control?: string;
  error?: string;
};

export type FormFieldSharedProps = {
  label: ReactNode;
  classNames?: FormFieldClassNames;
  errorTestId?: string;
};
