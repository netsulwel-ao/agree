import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ApprovalRequest {
  id: string
  title: string
  description?: string
  type: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  requester_id: string
  requester_name: string
  approver_id?: string
  approver_name?: string
  due_date?: string
  created_at: string
  updated_at: string
}

export const useApprovalRequests = (page = 1, search = '') => {
  return useQuery({
    queryKey: ['approval-requests', page, search],
    queryFn: () => Promise.resolve({ data: [], count: 0 }),
  })
}

export const useDeleteApprovalRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] })
    },
  })
}