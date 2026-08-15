import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';

const schema = z.object({
  email: z.string().min(1, { message: 'Укажите email' }),
});

type Values = z.infer<typeof schema>;

function TestForm() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <FormInput<Values>
          name="email"
          label="Email"
          type="email"
          data-testid="email-input"
          errorTestId="email-error"
          classNames={{
            field: 'field',
            label: 'label',
            control: 'control',
            error: 'error',
          }}
        />
        <button type="submit">Отправить</button>
      </form>
    </FormProvider>
  );
}

describe('FormInput', () => {
  it('wires invalid state and describedby when validation fails', async () => {
    const user = userEvent.setup();
    render(<TestForm />);

    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    const input = screen.getByTestId('email-input');
    const error = screen.getByTestId('email-error');

    expect(error).toHaveTextContent('Укажите email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', error.getAttribute('id'));
  });

  it('calls registerOptions.onChange', async () => {
    const user = userEvent.setup();
    let edited = false;

    function Harness() {
      const form = useForm<Values>({
        defaultValues: { email: '' },
      });
      return (
        <FormProvider {...form}>
          <FormInput<Values>
            name="email"
            label="Email"
            data-testid="email-input"
            registerOptions={{
              onChange: () => {
                edited = true;
              },
            }}
          />
        </FormProvider>
      );
    }

    render(<Harness />);
    await user.type(screen.getByTestId('email-input'), 'a');
    expect(edited).toBe(true);
  });

  it('keeps RHF registration when typing (register wins over input props)', async () => {
    const user = userEvent.setup();
    let latest = '';

    function Harness() {
      const form = useForm<Values>({
        defaultValues: { email: '' },
      });
      return (
        <FormProvider {...form}>
          <FormInput<Values>
            name="email"
            label="Email"
            data-testid="email-input"
            registerOptions={{
              onChange: (event) => {
                latest = event.target.value;
              },
            }}
          />
          <output data-testid="mirror">{form.watch('email')}</output>
        </FormProvider>
      );
    }

    render(<Harness />);
    await user.type(screen.getByTestId('email-input'), 'ab');
    expect(latest).toBe('ab');
    expect(screen.getByTestId('mirror')).toHaveTextContent('ab');
  });

  it('keeps explicit id and aria-* over conflicting inputProps', async () => {
    const user = userEvent.setup();

    function Harness() {
      const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
        mode: 'onSubmit',
      });
      return (
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(() => undefined)}>
            <FormInput<Values>
              name="email"
              label="Email"
              id="booking-email"
              data-testid="email-input"
              errorTestId="email-error"
              aria-invalid={false}
              aria-describedby="stale-id"
            />
            <button type="submit">Отправить</button>
          </form>
        </FormProvider>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    const input = screen.getByTestId('email-input');
    const error = screen.getByTestId('email-error');

    expect(input).toHaveAttribute('id', 'booking-email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      error.getAttribute('id'),
    );
  });

  it('uses classNames.control and ignores a leaked native className', () => {
    function Harness() {
      const form = useForm<Values>({
        defaultValues: { email: '' },
      });
      return (
        <FormProvider {...form}>
          <FormInput<Values>
            name="email"
            label="Email"
            data-testid="email-input"
            classNames={{ control: 'from-classNames' }}
            {...({ className: 'leaked' } as object)}
          />
        </FormProvider>
      );
    }

    render(<Harness />);
    const input = screen.getByTestId('email-input');
    expect(input).toHaveClass('from-classNames');
    expect(input).not.toHaveClass('leaked');
  });

  it('does not re-render when an unrelated field updates', async () => {
    const user = userEvent.setup();
    const emailRendersRef = { current: 0 };

    type Pair = { email: string; phone: string };

    function EmailField() {
      // eslint-disable-next-line react-hooks/immutability -- render counter for isolation assert
      emailRendersRef.current += 1;
      return (
        <FormInput<Pair>
          name="email"
          label="Email"
          data-testid="email-input"
        />
      );
    }

    function Harness() {
      const form = useForm<Pair>({
        defaultValues: { email: '', phone: '' },
      });
      return (
        <FormProvider {...form}>
          <EmailField />
          <FormInput<Pair>
            name="phone"
            label="Phone"
            data-testid="phone-input"
          />
        </FormProvider>
      );
    }

    render(<Harness />);
    const rendersAfterMount = emailRendersRef.current;

    await user.type(screen.getByTestId('phone-input'), '1');

    expect(emailRendersRef.current).toBe(rendersAfterMount);
  });
});
