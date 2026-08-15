import { useId, type InputHTMLAttributes } from 'react';
import {
  useFormContext,
  useFormState,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';
import { FieldError } from '../FieldError';
import type { FormFieldSharedProps } from './types';

export type FormInputProps<TFieldValues extends FieldValues = FieldValues> =
  FormFieldSharedProps &
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'name' | 'onChange' | 'onBlur' | 'ref' | 'className'
    > & {
      name: FieldPath<TFieldValues>;
      /** Колбэки и правила — только здесь, чтобы не перетереть `register`. */
      registerOptions?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
    };

export function FormInput<TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  classNames,
  errorTestId,
  registerOptions,
  id,
  ...inputProps
}: FormInputProps<TFieldValues>) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  const { register, control, getFieldState } = useFormContext<TFieldValues>();
  // Подписка только на это поле — соседние inputs не ре-рендерятся зря.
  const formState = useFormState({ control, name });
  const { error, invalid } = getFieldState(name, formState);
  const message = error?.message;

  return (
    <label className={classNames?.field} htmlFor={inputId}>
      <span className={classNames?.label}>{label}</span>
      <input
        {...inputProps}
        {...register(name, registerOptions)}
        id={inputId}
        className={classNames?.control}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
      />
      <FieldError
        className={classNames?.error}
        id={errorId}
        testId={errorTestId}
      >
        {typeof message === 'string' ? message : undefined}
      </FieldError>
    </label>
  );
}
