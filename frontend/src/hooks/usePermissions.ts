import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '@/api/permissions.api';

export function usePermissions() {
  const modulesQuery = useQuery({
    queryKey: ['permissions', 'modules'],
    queryFn: () => permissionsApi.getModules(),
  });

  const rolesQuery = useQuery({
    queryKey: ['permissions', 'roles'],
    queryFn: () => permissionsApi.getRoles(),
  });

  const allPermissionsQuery = useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: () => permissionsApi.findAll(),
  });

  return {
    modules: modulesQuery.data ?? [],
    roles: rolesQuery.data ?? [],
    allPermissions: allPermissionsQuery.data ?? [],
    isLoading: modulesQuery.isLoading || rolesQuery.isLoading || allPermissionsQuery.isLoading,
    refetch: () => {
      modulesQuery.refetch();
      rolesQuery.refetch();
      allPermissionsQuery.refetch();
    },
  };
}
