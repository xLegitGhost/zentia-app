import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { TransactionResponse } from '@/types/api';

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async (transactionId: number): Promise<number> => {
      if (isAuthenticated) {
        await api.delete(`/transactions/${transactionId}`);
      }
      return transactionId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueriesData<TransactionResponse[]>(
        { queryKey: ['transactions'] },
        (old) => (old ? old.filter((tx) => tx.id !== deletedId) : old)
      );
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export default useDeleteTransaction;
