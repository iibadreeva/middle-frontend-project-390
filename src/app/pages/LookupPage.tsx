import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookingDetails,
  BookingLookupForm,
  useBookingLookup,
  type BookingLookupValues,
} from '@features/booking';
import {
  BOOKING_CANCEL_CONFIRM,
  BOOKING_CANCEL_ERROR,
  BOOKING_LOOKUP_ERROR,
  BOOKING_NOT_FOUND,
} from '@shared/lib/messages';
import { useToast } from '@shared/ui/Toast';
import { lookupHref } from '../routes';
import styles from './Page.module.css';

const LOOKUP_TOAST_TAG = 'booking-lookup';

export function LookupPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const code = params.get('code')?.trim() ?? '';
  const lastName = params.get('lastName')?.trim() ?? '';
  const lookupArgs =
    code && lastName ? { code, lastName } : null;

  const { status, booking, cancel, cancelling, cancelError, reload } =
    useBookingLookup(lookupArgs);

  useEffect(() => {
    if (status === 'error') {
      toast.error(BOOKING_LOOKUP_ERROR, { tag: LOOKUP_TOAST_TAG });
    }
  }, [status, toast]);

  useEffect(() => {
    if (cancelError) {
      toast.error(BOOKING_CANCEL_ERROR, { tag: LOOKUP_TOAST_TAG });
    }
  }, [cancelError, toast]);

  function handleLookup(values: BookingLookupValues) {
    if (
      lookupArgs &&
      lookupArgs.code === values.code &&
      lookupArgs.lastName === values.lastName
    ) {
      reload();
      return;
    }

    toast.dismiss(LOOKUP_TOAST_TAG);
    navigate(
      lookupHref({ code: values.code, lastName: values.lastName }),
    );
  }

  function handleCancel() {
    if (!window.confirm(BOOKING_CANCEL_CONFIRM)) {
      return;
    }
    cancel();
  }

  const formDisabled = status === 'loading' || cancelling;

  return (
    <section className={styles.page} data-testid="lookup-page">
      <h2 className={styles.sectionTitle} data-testid="lookup-heading">
        Мои брони
      </h2>

      <BookingLookupForm
        key={`${code}-${lastName}`}
        values={{ code, lastName }}
        onSubmit={handleLookup}
        disabled={formDisabled}
      />

      {status === 'loading' ? (
        <div
          className={styles.skeleton}
          data-testid="booking-lookup-loading"
          role="status"
          aria-busy="true"
        >
          <p className={styles.skeletonLabel}>Загрузка брони…</p>
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLineShort} />
        </div>
      ) : null}

      {status === 'not-found' ? (
        <p
          className={styles.empty}
          data-testid="booking-not-found"
          role="alert"
        >
          {BOOKING_NOT_FOUND}
        </p>
      ) : null}

      {status === 'error' ? (
        <>
          <p className={styles.empty} data-testid="booking-lookup-error">
            {BOOKING_LOOKUP_ERROR}
          </p>
          <button
            className={styles.retry}
            type="button"
            data-testid="booking-lookup-retry"
            onClick={reload}
          >
            Повторить
          </button>
        </>
      ) : null}

      {status === 'success' && booking ? (
        <>
          <BookingDetails
            booking={booking}
            onCancel={handleCancel}
            cancelling={cancelling}
          />
          {cancelError ? (
            <p className={styles.empty} data-testid="booking-cancel-error">
              {BOOKING_CANCEL_ERROR}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
