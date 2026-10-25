import { FinancialProfile } from '@/domain/models/FinancialProfile';
import { FinancialProfileRepositoryPort } from '@/domain/ports/FinancialProfileRepositoryPort';
import { api } from '@/services/api';

/**
 * Adaptador HTTP para conectar con Spring Boot en cuanto
 * el equipo de backend implemente los endpoints de perfil financiero.
 */
export class HttpFinancialProfileAdapter implements FinancialProfileRepositoryPort {
  async getProfile(): Promise<FinancialProfile | null> {
    try {
      const response = await api.get<FinancialProfile>('/users/financial-profile');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async saveProfile(input: Omit<FinancialProfile, 'updatedAt'>): Promise<FinancialProfile> {
    const response = await api.post<FinancialProfile>('/users/onboarding', input);
    return response.data;
  }

  async clearProfile(): Promise<void> {
    // El borrado de perfil se gestiona por logout en el servidor
  }
}
