import { Navigate, useLocation } from 'react-router-dom';
import { homeHref } from '../routes';

export function FlightsRedirect() {
  const location = useLocation();
  return (
    <Navigate to={{ pathname: homeHref, search: location.search }} replace />
  );
}
