import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { toast } from '@shared/lib/toast';

afterEach(() => {
  toast.dismissAll();
});
