/**
 * Tipados oficiales de Zentia API REST
 * Basado en la especificación de DocBackend.pdf (UAQ - Facultad de Informática)
 * con compatibilidad para los DTOs de Spring Boot.
 */

export type TransactionType = 'INCOME' | 'EXPENSE' | 'INGRESO' | 'GASTO';

export interface CategoryResponse {
  id: number;
  name: string;
  iconKey?: string;
  icon?: string;
  type?: TransactionType;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName?: string;
  name?: string;
  avatarUrl?: string;
  pictureUrl?: string;
  phoneNumber?: string | null;
  onboardingCompleted: boolean;
}

export interface AuthResponse {
  token: string;
  newUser?: boolean;
  isNewUser?: boolean;
  user?: UserResponse;
  userId?: number;
  email?: string;
  name?: string;
  onboardingCompleted?: boolean;
}

export interface GoogleAuthRequest {
  idToken: string;
  googleId: string;
  email: string;
  name?: string;
  pictureUrl?: string;
}

export interface TransactionRequest {
  amount: number;
  type: TransactionType;
  categoryId: number;
  description: string;
  transactionDate?: string; // Formato YYYY-MM-DD
}

export interface UpdateTransactionRequest {
  categoryId: number;
  amount: number;
  description?: string;
}

export interface TransactionResponse {
  id: number;
  amount: number;
  type: TransactionType;
  category?: CategoryResponse;
  categoryName?: string;
  description: string;
  transactionDate?: string;
  date?: string;
  createdAt?: string;
}

export interface DashboardSummaryResponse {
  totalIncome?: number;
  totalIngresos?: number;
  totalExpense?: number;
  totalGastos?: number;
  balance?: number;
  balanceActual?: number;
  periodStart?: string;
  periodEnd?: string;
}
