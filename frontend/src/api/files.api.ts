import apiClient from './client';

export const filesApi = {
  upload: async (file: File, subdirectory = 'archivos') => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(`/files/upload?subdirectory=${subdirectory}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/files', { params });
    return data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/files/${id}`);
    return data.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/files/${id}`);
  },
};
