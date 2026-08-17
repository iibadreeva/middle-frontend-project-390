import { useId, type HTMLInputTypeAttribute, type InputHTMLAttributes } from 'react';
import {
  useFormContext,
  useFormState,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';
import { DatePicker } from '../DatePicker';
import { FieldError } from '../FieldError';
import type { FormFieldSharedProps } from './types';

type FormInputBase<TFieldValues extends FieldValues> = FormFieldSharedProps &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'name' | 'onChange' | 'onBlur' | 'ref' | 'className' | 'type'
  > & {
    name: FieldPath<TFieldValues>;
    /** Колбэки и правила — только здесь, чтобы не перетереть `register`. */
    registerOptions?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  };

export type FormInputProps<TFieldValues extends FieldValues = FieldValues> =
  | (FormInputBase<TFieldValues> & {
      type?: Exclude<HTMLInputTypeAttribute, 'date'>;
    })
  | (FormInputBase<TFieldValues> & {
      type: 'date';
      /** Календарный «сегодня» для DatePicker (YYYY-MM-DD). */
      today?: string;
    });

export function FormInput<TFieldValues extends FieldValues = FieldValues>(
  props: FormInputProps<TFieldValues>,
) {
  const {
    name,
    label,
    classNames,
    errorTestId,
    registerOptions,
    id,
    type,
    today,
    ...rest
  } = props as FormInputBase<TFieldValues> & {
    type?: HTMLInputTypeAttribute;
    today?: string;
  };
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  const { register, control, getFieldState } = useFormContext<TFieldValues>();
  // Подписка только на это поле — соседние inputs не ре-рендерятся зря.
  const formState = useFormState({ control, name });
  const { error, invalid } = getFieldState(name, formState);
  const message = error?.message;

  const isDate = type === 'date';
  const controlProps = {
    ...rest,
    ...register(name, registerOptions),
    id: inputId,
    className: classNames?.control,
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? errorId : undefined,
  };

  const fieldControl = isDate ? (
    <DatePicker {...controlProps} today={today} />
  ) : (
    <input type={type} {...controlProps} />
  );

  const errorNode = (
    <FieldError
      className={classNames?.error}
      id={errorId}
      testId={errorTestId}
    >
      {typeof message === 'string' ? message : undefined}
    </FieldError>
  );

  if (isDate) {
    return (
      <div className={classNames?.field}>
        <label htmlFor={inputId} className={classNames?.label}>
          {label}
        </label>
        {fieldControl}
        {errorNode}
      </div>
    );
  }

  return (
    <label className={classNames?.field} htmlFor={inputId}>
      <span className={classNames?.label}>{label}</span>
      {fieldControl}
      {errorNode}
    </label>
  );
}
