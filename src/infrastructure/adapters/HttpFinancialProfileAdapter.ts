import { FinancialProfile } from '@/domain/models/FinancialProfile';
import { FinancialProfileRepositoryPort } from '@/domain/ports/FinancialProfileRepositoryPort';
import { api } from '@/services/api';

interface BackendFinancialProfileResponse {
  userId?: number;
  monthlyIncome: number;
  monthlySavingsGoal: number;
  estimatedMonthlyExpense?: number | null;
  priorityCategoryId?: number | null;
  priorityCategoryName?: string | null;
  onboardingCompleted?: boolean;
}

/**
 * Adaptador HTTP para conectar con Spring Boot:
 * - GET /api/v1/users/financial-profile
 * - POST /api/v1/users/onboarding
 */
export class HttpFinancialProfileAdapter implements FinancialProfileRepositoryPort {
  async getProfile(): Promise<FinancialProfile | null> {
    try {
      const response = await api.get<BackendFinancialProfileResponse>('/users/financial-profile');
      const data = response.data;
      return {
        monthlyIncome: Number(data.monthlyIncome) || 0,
        monthlySavingsGoal: Number(data.monthlySavingsGoal) || 0,
        estimatedMonthlyExpense:
          data.estimatedMonthlyExpense != null ? Number(data.estimatedMonthlyExpense) : undefined,
        priorityCategoryId: data.priorityCategoryId ?? undefined,
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  async saveProfile(input: Omit<FinancialProfile, 'updatedAt'>): Promise<FinancialProfile> {
    const payload = {
      monthlyIncome: Number(input.monthlyIncome),
      monthlySavingsGoal: Number(input.monthlySavingsGoal),
      estimatedMonthlyExpense:
        input.estimatedMonthlyExpense != null ? Number(input.estimatedMonthlyExpense) : undefined,
      priorityCategoryId:
        input.priorityCategoryId != null ? Number(input.priorityCategoryId) : undefined,
    };

    const response = await api.post<BackendFinancialProfileResponse>('/users/onboarding', payload);
    const data = response.data;
    return {
      monthlyIncome: Number(data.monthlyIncome ?? payload.monthlyIncome),
      monthlySavingsGoal: Number(data.monthlySavingsGoal ?? payload.monthlySavingsGoal),
      estimatedMonthlyExpense:
        data.estimatedMonthlyExpense != null
          ? Number(data.estimatedMonthlyExpense)
          : payload.estimatedMonthlyExpense,
      priorityCategoryId: data.priorityCategoryId ?? payload.priorityCategoryId,
      updatedAt: new Date().toISOString(),
    };
  }

  async clearProfile(): Promise<void> {
    // El borrado de perfil se gestiona por logout en el servidor
  }
}

export const httpFinancialProfileRepository = new HttpFinancialProfileAdapter();
