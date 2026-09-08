import { Navigate, Outlet } from 'react-router-dom';

// Step 1 scaffold: replace with real auth-state check in Step 2 (auth module).
function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem('bizmind_token'));
}

export default function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
