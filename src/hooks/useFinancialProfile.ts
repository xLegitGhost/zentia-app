import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { buildAuthCacheScope, cacheStorage } from '@/services/cacheStorage';
import { FinancialProfile } from '@/domain/models/FinancialProfile';
import { financialProfileRepository } from '@/infrastructure/adapters/InMemoryFinancialProfileAdapter';
import { httpFinancialProfileRepository } from '@/infrastructure/adapters/HttpFinancialProfileAdapter';

const PROFILE_CACHE_TTL_MS = 1000 * 60 * 15; // 15 min

export function useFinancialProfile() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const cacheScope = buildAuthCacheScope(isAuthenticated, user?.id);
  const profileCacheKey = `profile:${cacheScope}`;
  const cachedProfile = cacheStorage.get<FinancialProfile>(
    profileCacheKey,
    PROFILE_CACHE_TTL_MS
  );

  const profileQuery = useQuery({
    queryKey: ['financialProfile', cacheScope],
    initialData: cachedProfile?.data,
    initialDataUpdatedAt: cachedProfile?.cachedAt,
    staleTime: 1000 * 60 * 5,
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
          cacheStorage.set(profileCacheKey, remote);
          return remote;
        }
      }
      const local = await financialProfileRepository.getProfile();
      if (local) {
        cacheStorage.set(profileCacheKey, local);
      }
      return local;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (
      input: Omit<FinancialProfile, 'updatedAt'> & { idempotencyKey?: string }
    ) => {
      const { idempotencyKey, ...data } = input;
      const localProfile = await financialProfileRepository.saveProfile(data);
      if (isAuthenticated) {
        return await httpFinancialProfileRepository.saveProfile(data, idempotencyKey);
      }
      return localProfile;
    },
    onSuccess: (newProfile) => {
      cacheStorage.set(profileCacheKey, newProfile);
      queryClient.setQueryData(['financialProfile', cacheScope], newProfile);
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
