import { FinancialProfile } from '@/domain/models/FinancialProfile';
import { FinancialProfileRepositoryPort } from '@/domain/ports/FinancialProfileRepositoryPort';
import { storage } from '@/services/storage';

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
    // Hidratar desde su propia llave dedicada para no sobrescribir zentia_user_data
    const cached = await storage.getFinancialProfile<FinancialProfile>();
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
    await storage.setFinancialProfile(profile);
    return profile;
  }

  async clearProfile(): Promise<void> {
    this.memoryStore = null;
    await storage.removeFinancialProfile();
  }
}

// Instancia singleton para inyección de dependencias
export const financialProfileRepository: FinancialProfileRepositoryPort =
  new InMemoryFinancialProfileAdapter();
