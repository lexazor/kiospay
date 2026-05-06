export type Role = 'USER' | 'ADMIN';

export interface SessionUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  whatsapp: string;
  role: Role;
  balance: string;
  hasPin: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  sortOrder: number;
  status: boolean;
  badge?: string | null;
}

export interface ServiceField {
  id: string;
  serviceId: string;
  label: string;
  key: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT';
  required: boolean;
  placeholder?: string | null;
  optionsJson?: string[] | null;
  sortOrder: number;
}

export interface Product {
  id: string;
  serviceId: string;
  name: string;
  slug: string;
  tabType?: string | null;
  nominal: string;
  sellingPrice: string;
  status: boolean;
  stock?: number | null;
}

export interface ServiceDetail {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  status: boolean;
  inputFields: ServiceField[];
  products: Product[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  accountNumber: string;
  accountName: string;
  logoUrl?: string | null;
  uniqueCodeEnabled: boolean;
  minDeposit: string;
  maxDeposit: string;
  expiryMinutes: number;
  status: boolean;
}

export interface Deposit {
  id: string;
  userId: string;
  paymentMethodId: string;
  amount: string;
  uniqueCode?: number | null;
  transferAmount: string;
  proofImageUrl?: string | null;
  expiredAt?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  paymentMethod?: PaymentMethod;
}

export interface Order {
  id: string;
  userId: string;
  serviceId: string;
  productId: string;
  customerData: Record<string, string>;
  price: string;
  fee: string;
  total: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}