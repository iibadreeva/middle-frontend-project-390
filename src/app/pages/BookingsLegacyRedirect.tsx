import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { lookupHref } from '../routes';

/** Старые URL `/bookings` и `/bookings/:code` → `/lookup`. */
export function BookingsLegacyRedirect() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const lastName = params.get('lastName');

  if (!code) {
    return <Navigate to={lookupHref()} replace />;
  }

  return (
    <Navigate
      to={lookupHref({
        code,
        ...(lastName !== null ? { lastName } : {}),
      })}
      replace
    />
  );
}
