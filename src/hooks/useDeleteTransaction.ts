import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { buildAuthCacheScope } from '@/services/cacheStorage';
import {
  captureTransactionSnapshot,
  restoreTransactionSnapshot,
  syncMutationAcrossPeriodCaches,
} from '@/services/transactionCache';

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const cacheScope = buildAuthCacheScope(isAuthenticated, user?.id);

  return useMutation({
    mutationFn: async (transactionId: number): Promise<number> => {
      if (isAuthenticated) {
        await api.delete(`/transactions/${transactionId}`);
      }
      return transactionId;
    },
    onMutate: async (transactionId) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });

      const snapshot = captureTransactionSnapshot(queryClient, cacheScope);
      syncMutationAcrossPeriodCaches(queryClient, cacheScope, (list) =>
        list.filter((tx) => tx.id !== transactionId)
      );

      return { snapshot };
    },
    onError: (_err, _id, context) => {
      restoreTransactionSnapshot(queryClient, cacheScope, context?.snapshot);
    },
    onSettled: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });
}

export default useDeleteTransaction;
