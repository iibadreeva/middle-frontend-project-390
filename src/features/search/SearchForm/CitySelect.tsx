import { forwardRef } from 'react';
import type { City } from '@entities/city';
import { FieldError } from '@shared/ui/FieldError';
import styles from './SearchForm.module.css';

type CitySelectProps = {
  label: string;
  name: string;
  value: string;
  cities: City[];
  testId: string;
  onChange: (code: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  errorId?: string;
  errorMessage?: string;
  errorTestId?: string;
};

export const CitySelect = forwardRef<HTMLSelectElement, CitySelectProps>(
  function CitySelect(
    {
      label,
      name,
      value,
      cities,
      testId,
      onChange,
      onBlur,
      disabled = false,
      invalid = false,
      errorId,
      errorMessage,
      errorTestId,
    },
    ref,
  ) {
    return (
      <label className={styles.field}>
        <span className={styles.label}>{label}</span>
        <select
          ref={ref}
          className={styles.select}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid && errorId ? errorId : undefined}
          data-testid={testId}
        >
          {cities.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name}
            </option>
          ))}
        </select>
        <FieldError
          className={styles.fieldError}
          id={errorId}
          testId={errorTestId}
        >
          {errorMessage}
        </FieldError>
      </label>
    );
  },
);
CitySelect.displayName = 'CitySelect';
