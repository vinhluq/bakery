
export enum AppScreen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  SHIFTS = 'SHIFTS',
  PRODUCTS = 'PRODUCTS',
  DEBT = 'DEBT',
  POS = 'POS',
  REPORTS = 'REPORTS'
}

/* ... existing interfaces ... */

export interface Order {
  id: string;
  total_amount: number;
  payment_method: 'cash' | 'transfer' | 'debt';
  created_at: string;
  customer_id?: string;
  items?: OrderItem[];
  customer_debts?: { name: string };
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'cashier' | 'baker' | 'sales';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  wholesale_price?: number;
  stock: number | 'unlimited';
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Shift {
  id: string;
  name: string;
  role: string;
  time: string;
  status: 'active' | 'upcoming' | 'completed';
  image: string;
  created_at?: string; // Optional for compatibility, but we will fetch it
}

export interface CustomerDebt {
  id: string;
  name: string;
  phone: string;
  amount: number;
  status: 'overdue' | 'pending' | 'paid';
  lastActivity: string;
  image?: string;
  initials?: string;
  address?: string;
}

export interface DebtTransaction {
  id: string;
  customer_id: string;
  amount: number;
  type: 'debt' | 'repayment';
  note?: string;
  created_at: string;
  customer_debts?: { name: string };
  profiles?: { full_name: string };
}

export interface InventoryLog {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  note?: string;
  created_at: string;
  created_by: string;
  products?: { name: string };
  profiles?: { full_name: string };
}

export interface CakeOrder {
  id: string;
  created_at: string;
  customer_name: string;
  phone?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  total_amount: number;
  deposit_amount: number;
  remaining_amount: number;
  delivery_date: string;
  delivery_address?: string;
  created_by?: string;
  status: 'pending' | 'completed' | 'canceled';
  note?: string;
  completed_at?: string;
}
