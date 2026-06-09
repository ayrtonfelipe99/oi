export type UserRole = 'admin' | 'manager' | 'clerk';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  contract_id: string | null;
  warehouse_id: string | null;
}

export interface Contract {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  contract_id: string;
  location: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'epi' | 'tool' | 'equipment';
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  brand: string | null;
  category_id: string;
  unit: string;
  min_stock: number;
  current_stock: number;
  warehouse_id: string;
  contract_id: string;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'maintenance';
  ca_number: string | null;
  ca_expiry: string | null;
  created_at: string;
}

export interface Staff {
  id: string;
  registration_number: string;
  full_name: string;
  cpf: string;
  role: string;
  contract_id: string;
  training_date: string | null;
  status: 'active' | 'inactive';
  allowed_categories: string[]; // IDs of categories
}

export interface Transaction {
  id: string;
  type: 'in' | 'out' | 'return' | 'transfer' | 'maintenance';
  product_id: string;
  staff_id: string | null;
  warehouse_id: string;
  quantity: number;
  clerk_id: string;
  destination_warehouse_id: string | null;
  transport_staff_id: string | null;
  status: 'completed' | 'pending' | 'cancelled';
  notes: string | null;
  created_at: string;
}
