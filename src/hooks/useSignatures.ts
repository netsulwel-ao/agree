import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Signature {
  id: string
  document_title: string
  contract_title?: string
  signer_name?: string
  signer_email: string
  status: 'pending' | 'signed' | 'declined' | 'expired'
  created_at: string
  expires_at?: string
}

export const useSignatures = (page = 1, search = '') => {
  return useQuery({
    queryKey: ['signatures', page, search],
    queryFn: () => Promise.resolve({ data: [], count: 0 }),
  })
}

export const useDeleteSignature = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures'] })
    },
  })
}