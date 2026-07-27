const DASHBOARD_PATHS = {
  customer: '/customer-dashboard',
  staff: '/staff-dashboard',
  admin: '/admin-dashboard',
  rider: '/rider-dashboard'
};

export const dashboardPathForRole = (role, fallback = '/dashboard') => (
  DASHBOARD_PATHS[role] || fallback
);
