import { Navigate, useLocation } from 'react-router-dom';

export function FlightsRedirect() {
  const location = useLocation();
  return <Navigate to={{ pathname: '/', search: location.search }} replace />;
}
