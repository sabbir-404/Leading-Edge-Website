
import { UserRole, User } from '../types';

export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_PRODUCTS: 'manage_products', // Add, Edit
  DELETE_PRODUCTS: 'delete_products', // Delete
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_ORDERS: 'manage_orders', // View, Update Status
  MANAGE_USERS: 'manage_users', // Edit roles
  VIEW_USERS: 'view_users',
  MANAGE_CONTENT: 'manage_content', // Pages, Site Config
  MANAGE_PROJECTS: 'manage_projects',
  MANAGE_MARKETING: 'manage_marketing', // Newsletter
  MANAGE_SHIPPING: 'manage_shipping',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard', 'manage_products', 'delete_products', 'manage_categories',
    'manage_orders', 'manage_users', 'view_users', 'manage_content',
    'manage_projects', 'manage_marketing', 'manage_shipping'
  ],
  moderator: [
    'view_dashboard', 'manage_products', 'manage_categories', 'manage_content',
    'manage_projects', 'view_users', 'manage_orders'
  ],
  customer_service: [
    'view_dashboard', 'manage_orders', 'view_users'
  ],
  customer: []
};

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

export const canManageRole = (currentUser: User, targetRole: UserRole): boolean => {
    if (currentUser.role !== 'admin') return false;
    // Admins can manage anyone, but generally logic could be more complex
    return true; 
};
