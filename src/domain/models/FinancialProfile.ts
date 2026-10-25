/**
 * Entidad de dominio: Perfil Financiero
 * Contrato puro desacoplado de infraestructura y persistencia.
 */
export interface FinancialProfile {
  monthlyIncome: number;
  monthlySavingsGoal: number;
  estimatedMonthlyExpense?: number;
  priorityCategoryId?: string | number;
  updatedAt: string;
}
