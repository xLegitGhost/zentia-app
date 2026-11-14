import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { buildAuthCacheScope } from '@/services/cacheStorage';
import { isDeviceOffline, runIdempotentOperation } from '@/services/idempotency';
import {
  captureTransactionSnapshot,
  getTransactionDate,
  isDateInRange,
  restoreTransactionSnapshot,
  syncMutationAcrossPeriodCaches,
} from '@/services/transactionCache';
import { CategoryResponse, TransactionRequest, TransactionResponse } from '@/types/api';
import { DEFAULT_CATEGORIES } from './useCategories';

export type CreateTransactionVariables = TransactionRequest & {
  _tempId?: number;
  idempotencyKey?: string;
};

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const cacheScope = buildAuthCacheScope(isAuthenticated, user?.id);

  return useMutation({
    mutationFn: async (
      payload: CreateTransactionVariables
    ): Promise<TransactionResponse> => {
      const normalizedType =
        payload.type === 'INCOME' ? 'INGRESO' : payload.type === 'EXPENSE' ? 'GASTO' : payload.type;

      if (isAuthenticated) {
        return runIdempotentOperation({
          scope: cacheScope,
          operation: 'tx:create',
          method: 'POST',
          idempotencyKey: payload.idempotencyKey,
          requireOnline: true,
          execute: async (idempotencyKey) => {
            const response = await api.post<TransactionResponse>(
              '/transactions',
              {
                amount: payload.amount,
                type: normalizedType,
                categoryId: payload.categoryId,
                description: payload.description,
                transactionDate: payload.transactionDate,
              },
              { idempotencyKey }
            );
            return response.data;
          },
        });
      }

      const categories =
        queryClient.getQueryData<CategoryResponse[]>(['categories']) ?? DEFAULT_CATEGORIES;
      const matchedCategory = categories.find((c) => c.id === payload.categoryId);
      const txDate = payload.transactionDate || new Date().toISOString().split('T')[0];

      return {
        id: payload._tempId ?? Date.now(),
        amount: payload.amount,
        type: normalizedType,
        category: matchedCategory,
        categoryName: matchedCategory?.name || '',
        description: payload.description,
        date: txDate,
        transactionDate: txDate,
        createdAt: new Date().toISOString(),
      };
    },
    onMutate: async (payload) => {
      if (isAuthenticated && isDeviceOffline()) {
        return { snapshot: undefined, tempId: undefined };
      }

      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });

      const snapshot = captureTransactionSnapshot(queryClient, cacheScope);
      const tempId = -Date.now();
      const categories =
        queryClient.getQueryData<CategoryResponse[]>(['categories']) ?? DEFAULT_CATEGORIES;
      const matchedCategory = categories.find((c) => c.id === payload.categoryId);
      const normalizedType =
        payload.type === 'INCOME' ? 'INGRESO' : payload.type === 'EXPENSE' ? 'GASTO' : payload.type;
      const txDate = payload.transactionDate || new Date().toISOString().split('T')[0];

      const optimisticTx: TransactionResponse = {
        id: tempId,
        amount: payload.amount,
        type: normalizedType,
        category: matchedCategory,
        categoryName: matchedCategory?.name || '',
        description: payload.description,
        date: txDate,
        transactionDate: txDate,
        createdAt: new Date().toISOString(),
      };

      syncMutationAcrossPeriodCaches(queryClient, cacheScope, (list, startDate, endDate) => {
        if (!isDateInRange(txDate, startDate, endDate)) return list;
        return [optimisticTx, ...list.filter((t) => t.id !== tempId)];
      });

      return { snapshot, tempId };
    },
    onError: (_err, _payload, context) => {
      restoreTransactionSnapshot(queryClient, cacheScope, context?.snapshot);
    },
    onSuccess: (newTx, _payload, context) => {
      const txDate = getTransactionDate(newTx);
      syncMutationAcrossPeriodCaches(queryClient, cacheScope, (list, startDate, endDate) => {
        const withoutTemp = list.filter(
          (t) => t.id !== context?.tempId && t.id !== newTx.id
        );
        if (!isDateInRange(txDate, startDate, endDate)) return withoutTemp;
        return [newTx, ...withoutTemp];
      });
    },
    onSettled: (_data, error) => {
      if (isAuthenticated && !(error && isDeviceOffline())) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });
}

export default useCreateTransaction;
