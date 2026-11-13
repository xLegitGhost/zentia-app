import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { CategoryResponse, TransactionType } from '@/types/api';

/**
 * Catálogo por defecto alineado 1:1 con los IDs reales del backend Spring Boot.
 * Se usa únicamente como placeholder antes de recibir GET /api/v1/categories o en modo offline.
 */
export const DEFAULT_CATEGORIES: CategoryResponse[] = [
  { id: 1, name: 'Comida y Despensa', icon: 'shopping-cart', type: 'GASTO' },
  { id: 2, name: 'Sueldo / Salario', icon: 'briefcase', type: 'INGRESO' },
  { id: 3, name: 'Beca / Apoyo', icon: 'award', type: 'INGRESO' },
  { id: 4, name: 'Freelance / Proyectos', icon: 'laptop', type: 'INGRESO' },
  { id: 5, name: 'Otros Ingresos', icon: 'dollar-sign', type: 'INGRESO' },
  { id: 6, name: 'Restaurantes y Antojos', icon: 'utensils', type: 'GASTO' },
  { id: 7, name: 'Transporte', icon: 'bus', type: 'GASTO' },
  { id: 8, name: 'Vivienda y Servicios', icon: 'home', type: 'GASTO' },
  { id: 9, name: 'Entretenimiento y Salidas', icon: 'film', type: 'GASTO' },
  { id: 10, name: 'Suscripciones y Tecnología', icon: 'tv', type: 'GASTO' },
  { id: 11, name: 'Salud y Cuidado Personal', icon: 'heart', type: 'GASTO' },
  { id: 12, name: 'Educación', icon: 'book', type: 'GASTO' },
  { id: 13, name: 'Otros Gastos', icon: 'more-horizontal', type: 'GASTO' },
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
      } catch {
        console.warn('Backend categories unavailable, using default catalog.');
      }
      return DEFAULT_CATEGORIES;
    },
    placeholderData: DEFAULT_CATEGORIES,
    staleTime: 1000 * 60 * 15, // 15 min
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
