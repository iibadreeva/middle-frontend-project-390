import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { toast } from '@shared/ui/Toast/toast';

afterEach(() => {
  toast.dismissAll();
});
