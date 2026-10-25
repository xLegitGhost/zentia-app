import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { TransactionRequest, TransactionResponse } from '@/types/api';
import { DEFAULT_CATEGORIES } from './useCategories';

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TransactionRequest): Promise<TransactionResponse> => {
      // Normalizar tipo para backend Spring Boot (admite GASTO/INGRESO y EXPENSE/INCOME)
      const normalizedPayload = {
        ...payload,
        type: payload.type === 'INCOME' ? 'INGRESO' : payload.type === 'EXPENSE' ? 'GASTO' : payload.type,
      };

      try {
        const response = await api.post<TransactionResponse>('/transactions', normalizedPayload);
        return response.data;
      } catch (error) {
        console.warn('Backend call failed, creating optimistic transaction for demo mode:', error);
        // Fallback optimista para modo demo / stand offline
        const matchedCategory = DEFAULT_CATEGORIES.find((c) => c.id === payload.categoryId);
        const fallbackResponse: TransactionResponse = {
          id: Date.now(),
          amount: payload.amount,
          type: payload.type,
          category: matchedCategory,
          categoryName: matchedCategory?.name || '',
          description: payload.description,
          transactionDate: payload.transactionDate || new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        };
        return fallbackResponse;
      }
    },
    onSuccess: (newTx) => {
      // Invalidar consultas de historial y dashboard
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      // Actualizar caché de historial optimísticamente
      queryClient.setQueryData<TransactionResponse[]>(['transactions'], (old) => {
        return old ? [newTx, ...old] : [newTx];
      });
    },
  });
}

export default useCreateTransaction;
