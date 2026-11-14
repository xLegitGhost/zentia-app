import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { buildAuthCacheScope } from '@/services/cacheStorage';
import { isDeviceOffline, runIdempotentOperation } from '@/services/idempotency';
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
        await runIdempotentOperation({
          scope: cacheScope,
          operation: `tx:delete:${transactionId}`,
          method: 'DELETE',
          idempotencyKey: `tx-${transactionId}`,
          requireOnline: true,
          completedTtlMs: 30_000,
          execute: async (key, attempt) => {
            try {
              await api.delete(`/transactions/${transactionId}`, { idempotencyKey: key });
            } catch (error) {
              // En un reintento tras timeout, 404 confirma que el borrado previo ya surtió efecto
              if (attempt > 0 && axios.isAxiosError(error) && error.response?.status === 404) {
                return;
              }
              throw error;
            }
          },
        });
      }
      return transactionId;
    },
    onMutate: async (transactionId) => {
      if (isAuthenticated && isDeviceOffline()) {
        return { snapshot: undefined };
      }

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
    onSettled: (_data, error) => {
      if (isAuthenticated && !(error && isDeviceOffline())) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });
}

export default useDeleteTransaction;
