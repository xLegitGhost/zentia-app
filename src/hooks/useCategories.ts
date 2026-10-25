import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { CategoryResponse, TransactionType } from '@/types/api';

export const DEFAULT_CATEGORIES: CategoryResponse[] = [
  { id: 1, name: 'Alimentación', iconKey: 'utensils', type: 'EXPENSE' },
  { id: 2, name: 'Transporte', iconKey: 'car', type: 'EXPENSE' },
  { id: 3, name: 'Vivienda y Servicios', iconKey: 'home', type: 'EXPENSE' },
  { id: 4, name: 'Entretenimiento', iconKey: 'film', type: 'EXPENSE' },
  { id: 5, name: 'Salud y Bienestar', iconKey: 'heart-pulse', type: 'EXPENSE' },
  { id: 6, name: 'Educación', iconKey: 'graduation-cap', type: 'EXPENSE' },
  { id: 7, name: 'Nómina / Salario', iconKey: 'wallet', type: 'INCOME' },
  { id: 8, name: 'Inversiones', iconKey: 'trending-up', type: 'INCOME' },
  { id: 9, name: 'Otros Ingresos', iconKey: 'circle-dollar-sign', type: 'INCOME' },
];

export function useCategories(typeFilter?: TransactionType) {
  const query = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await api.get<CategoryResponse[]>('/categories');
        if (response.data && response.data.length > 0) {
          return response.data;
        }
      } catch (e) {
        console.warn('Backend categories unavailable, using default catalog.');
      }
      return DEFAULT_CATEGORIES;
    },
    initialData: DEFAULT_CATEGORIES,
    staleTime: 1000 * 60 * 60, // 1 hora de caché
  });

  const allCategories = query.data || DEFAULT_CATEGORIES;

  // Filtrado por tipo de movimiento (RN-FIN-03)
  const filteredCategories = typeFilter
    ? allCategories.filter((cat) => {
        if (!cat.type) return true;
        const normalizedFilter =
          typeFilter === 'INGRESO' || typeFilter === 'INCOME' ? 'INCOME' : 'EXPENSE';
        const normalizedCatType =
          cat.type === 'INGRESO' || cat.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
        return normalizedCatType === normalizedFilter;
      })
    : allCategories;

  return {
    categories: filteredCategories,
    allCategories,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export default useCategories;
