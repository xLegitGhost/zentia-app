import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { buildAuthCacheScope } from '@/services/cacheStorage';
import {
  captureTransactionSnapshot,
  restoreTransactionSnapshot,
  syncMutationAcrossPeriodCaches,
} from '@/services/transactionCache';
import { CategoryResponse, TransactionResponse, UpdateTransactionRequest } from '@/types/api';
import { DEFAULT_CATEGORIES } from './useCategories';

export interface UpdateTransactionVariables {
  transactionId: number;
  payload: UpdateTransactionRequest;
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const cacheScope = buildAuthCacheScope(isAuthenticated, user?.id);

  return useMutation({
    mutationFn: async ({
      transactionId,
      payload,
    }: UpdateTransactionVariables): Promise<TransactionResponse> => {
      if (isAuthenticated) {
        const response = await api.put<TransactionResponse>(
          `/transactions/${transactionId}`,
          payload
        );
        return response.data;
      }

      const categories =
        queryClient.getQueryData<CategoryResponse[]>(['categories']) ?? DEFAULT_CATEGORIES;
      const matchedCategory = categories.find((c) => c.id === payload.categoryId);

      const allCached = queryClient.getQueriesData<TransactionResponse[]>({
        queryKey: ['transactions'],
      });
      let existing: TransactionResponse | undefined;
      for (const [, list] of allCached) {
        existing = list?.find((t) => t.id === transactionId);
        if (existing) break;
      }

      return {
        id: transactionId,
        amount: payload.amount,
        type: existing?.type ?? 'GASTO',
        category: matchedCategory,
        categoryName: matchedCategory?.name ?? existing?.categoryName ?? 'Movimiento',
        description: payload.description ?? existing?.description ?? '',
        date: existing?.date ?? existing?.transactionDate,
        transactionDate: existing?.transactionDate ?? existing?.date,
      };
    },
    onMutate: async ({ transactionId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });

      const snapshot = captureTransactionSnapshot(queryClient, cacheScope);
      const categories =
        queryClient.getQueryData<CategoryResponse[]>(['categories']) ?? DEFAULT_CATEGORIES;
      const matchedCategory = categories.find((c) => c.id === payload.categoryId);

      syncMutationAcrossPeriodCaches(queryClient, cacheScope, (list) =>
        list.map((tx) =>
          tx.id === transactionId
            ? {
                ...tx,
                amount: payload.amount,
                description: payload.description ?? tx.description,
                category: matchedCategory ?? tx.category,
                categoryName: matchedCategory?.name ?? tx.categoryName,
              }
            : tx
        )
      );

      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      restoreTransactionSnapshot(queryClient, cacheScope, context?.snapshot);
    },
    onSuccess: (updatedTx) => {
      syncMutationAcrossPeriodCaches(queryClient, cacheScope, (list) =>
        list.map((tx) => (tx.id === updatedTx.id ? { ...tx, ...updatedTx } : tx))
      );
    },
    onSettled: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });
}

export default useUpdateTransaction;
