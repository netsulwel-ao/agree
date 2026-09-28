import { useQuery } from '@tanstack/react-query'

interface AnalyticsData {
  totalContracts: number
  totalClients: number
  totalInvoices: number
  totalRevenue: number
  contractsThisMonth: number
  clientsThisMonth: number
  invoicesThisMonth: number
  revenueThisMonth: number
  contractsByStatus: Record<string, number>
  invoicesByStatus: Record<string, number>
  monthlyRevenue: Array<{ month: string; revenue: number }>
  recentActivity: Array<{ description: string; timestamp: string }>
}

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: (): Promise<AnalyticsData> => Promise.resolve({
      totalContracts: 0,
      totalClients: 0,
      totalInvoices: 0,
      totalRevenue: 0,
      contractsThisMonth: 0,
      clientsThisMonth: 0,
      invoicesThisMonth: 0,
      revenueThisMonth: 0,
      contractsByStatus: {},
      invoicesByStatus: {},
      monthlyRevenue: [],
      recentActivity: []
    }),
  })
}