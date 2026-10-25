import { FinancialProfile } from '@/domain/models/FinancialProfile';
import { FinancialProfileRepositoryPort } from '@/domain/ports/FinancialProfileRepositoryPort';
import { storage } from '@/services/storage';

const PROFILE_STORAGE_KEY = 'zentia_financial_profile';

/**
 * Adaptador de infraestructura en memoria con hidratación local.
 * Implementa FinancialProfileRepositoryPort aislando la UI del backend.
 */
export class InMemoryFinancialProfileAdapter implements FinancialProfileRepositoryPort {
  private memoryStore: FinancialProfile | null = null;

  async getProfile(): Promise<FinancialProfile | null> {
    if (this.memoryStore) {
      return this.memoryStore;
    }
    // Hidratar desde storage local para persistencia entre recargas
    const cached = await storage.getUserData<FinancialProfile>();
    if (cached) {
      this.memoryStore = cached;
      return cached;
    }
    return null;
  }

  async saveProfile(input: Omit<FinancialProfile, 'updatedAt'>): Promise<FinancialProfile> {
    const profile: FinancialProfile = {
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.memoryStore = profile;
    await storage.setUserData(profile);
    return profile;
  }

  async clearProfile(): Promise<void> {
    this.memoryStore = null;
  }
}

// Instancia singleton para inyección de dependencias
export const financialProfileRepository: FinancialProfileRepositoryPort =
  new InMemoryFinancialProfileAdapter();
