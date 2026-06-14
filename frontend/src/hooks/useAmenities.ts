import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { amenityApi } from '@/api/amenity.api';

export function useAmenities(search?: string) {
  return useQuery({
    queryKey: ['amenities', search],
    queryFn: () => amenityApi.findAll(search),
  });
}

export function useCreateAmenity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => amenityApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amenities'] }),
  });
}

export function useUpdateAmenity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => amenityApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amenities'] }),
  });
}

export function useDeleteAmenity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => amenityApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amenities'] }),
  });
}
