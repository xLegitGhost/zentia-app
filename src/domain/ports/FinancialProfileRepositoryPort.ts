import { FinancialProfile } from '../models/FinancialProfile';

/**
 * Puerto de repositorio (Hexagonal Architecture)
 * Define las operaciones que el núcleo requiere sin conocer si se guardan
 * en memoria, en SQLite, en SecureStore o mediante una API REST en Spring Boot.
 */
export interface FinancialProfileRepositoryPort {
  getProfile(): Promise<FinancialProfile | null>;
  saveProfile(profile: Omit<FinancialProfile, 'updatedAt'>): Promise<FinancialProfile>;
  clearProfile(): Promise<void>;
}
