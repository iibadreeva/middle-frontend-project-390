import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FieldError } from './FieldError';

describe('FieldError', () => {
  it('renders field errors without a live region role', () => {
    render(
      <FieldError testId="field-error" id="err">
        Обязательное поле
      </FieldError>,
    );

    const node = screen.getByTestId('field-error');
    expect(node).toHaveTextContent('Обязательное поле');
    expect(node).not.toHaveAttribute('role');
  });

  it('uses role="alert" for assertive external errors', () => {
    render(
      <FieldError testId="server-error" live="assertive">
        Серверная ошибка
      </FieldError>,
    );

    expect(screen.getByTestId('server-error')).toHaveAttribute('role', 'alert');
  });

  it('renders nothing when there is no message', () => {
    const { container } = render(<FieldError testId="empty" />);
    expect(container).toBeEmptyDOMElement();
  });
});
