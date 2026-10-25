import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FinancialProfile } from '@/domain/models/FinancialProfile';
import { financialProfileRepository } from '@/infrastructure/adapters/InMemoryFinancialProfileAdapter';

export function useFinancialProfile() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['financialProfile'],
    queryFn: () => financialProfileRepository.getProfile(),
    staleTime: Infinity, // Datos estables en memoria
  });

  const saveMutation = useMutation({
    mutationFn: (data: Omit<FinancialProfile, 'updatedAt'>) =>
      financialProfileRepository.saveProfile(data),
    onSuccess: (newProfile) => {
      queryClient.setQueryData(['financialProfile'], newProfile);
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
