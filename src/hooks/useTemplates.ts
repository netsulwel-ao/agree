import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Template {
  id: string
  name: string
  description?: string
  category: string
  is_favorite: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export const useTemplates = (page = 1, search = '') => {
  return useQuery({
    queryKey: ['templates', page, search],
    queryFn: () => Promise.resolve({ data: [], count: 0 }),
  })
}

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}