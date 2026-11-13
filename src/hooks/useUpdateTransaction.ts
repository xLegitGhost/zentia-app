import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { TransactionResponse, UpdateTransactionRequest } from '@/types/api';
import { DEFAULT_CATEGORIES } from './useCategories';

export interface UpdateTransactionVariables {
  transactionId: number;
  payload: UpdateTransactionRequest;
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

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

      // Modo demo local en memoria
      const categories =
        queryClient.getQueryData<typeof DEFAULT_CATEGORIES>(['categories']) ?? DEFAULT_CATEGORIES;
      const matchedCategory = categories.find((c) => c.id === payload.categoryId);
      const cached = queryClient.getQueryData<TransactionResponse[]>(['transactions']) ?? [];
      const existing = cached.find((t) => t.id === transactionId);

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
    onSuccess: (updatedTx) => {
      queryClient.setQueriesData<TransactionResponse[]>(
        { queryKey: ['transactions'] },
        (old) => {
          if (!old) return old;
          return old.map((tx) => (tx.id === updatedTx.id ? { ...tx, ...updatedTx } : tx));
        }
      );
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export default useUpdateTransaction;
