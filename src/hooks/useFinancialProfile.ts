import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { FinancialProfile } from '@/domain/models/FinancialProfile';
import { financialProfileRepository } from '@/infrastructure/adapters/InMemoryFinancialProfileAdapter';
import { httpFinancialProfileRepository } from '@/infrastructure/adapters/HttpFinancialProfileAdapter';

export function useFinancialProfile() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['financialProfile', isAuthenticated],
    queryFn: async () => {
      if (isAuthenticated) {
        const remote = await httpFinancialProfileRepository.getProfile();
        if (remote) {
          await financialProfileRepository.saveProfile({
            monthlyIncome: remote.monthlyIncome,
            monthlySavingsGoal: remote.monthlySavingsGoal,
            estimatedMonthlyExpense: remote.estimatedMonthlyExpense,
            priorityCategoryId: remote.priorityCategoryId,
          });
          return remote;
        }
      }
      return financialProfileRepository.getProfile();
    },
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Omit<FinancialProfile, 'updatedAt'>) => {
      // Guardar siempre en memoria (arquitectura hexagonal sin dependencia dura)
      const localProfile = await financialProfileRepository.saveProfile(data);
      if (isAuthenticated) {
        try {
          return await httpFinancialProfileRepository.saveProfile(data);
        } catch (err) {
          console.warn('No se pudo sincronizar onboarding con backend, usando perfil local:', err);
        }
      }
      return localProfile;
    },
    onSuccess: (newProfile) => {
      queryClient.setQueryData(['financialProfile', isAuthenticated], newProfile);
      queryClient.invalidateQueries({ queryKey: ['financialProfile'] });
    },
  });

  return {
    profile: profileQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    saveProfile: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}

export default useFinancialProfile;
