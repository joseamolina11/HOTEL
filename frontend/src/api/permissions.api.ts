import apiClient from './client';

export interface RoleItem {
  name: string;
  description: string;
  isSystem: boolean;
}

export const permissionsApi = {
  findAll: async () => {
    const { data } = await apiClient.get('/permissions');
    return data.data;
  },

  getModules: async () => {
    const { data } = await apiClient.get('/permissions/modules');
    return data.data;
  },

  getRoles: async () => {
    const { data } = await apiClient.get('/permissions/roles');
    return data.data;
  },

  createRole: async (name: string, description?: string) => {
    const { data } = await apiClient.post('/permissions/roles', { name, description });
    return data.data;
  },

  updateRole: async (name: string, description?: string) => {
    const { data } = await apiClient.put(`/permissions/roles/${name}`, { description });
    return data.data;
  },

  deleteRole: async (name: string) => {
    const { data } = await apiClient.delete(`/permissions/roles/${name}`);
    return data.data;
  },

  getPermissionsForRole: async (role: string) => {
    const { data } = await apiClient.get(`/permissions/role/${role}`);
    return data.data;
  },

  updateRolePermissions: async (role: string, permissionIds: string[]) => {
    const { data } = await apiClient.post('/permissions/role', { role, permissionIds });
    return data.data;
  },
};
