import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface UserSignature {
  id: string
  created_at: string
  name: string
  image_url: string
  is_active: boolean
}

/** Assinaturas digitais registadas pelo utilizador. */
export function useUserSignatures() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-signatures', user?.id],
    queryFn: async (): Promise<UserSignature[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('user_signatures')
        .select('id, name, image_url, created_at, is_active')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data || []) as UserSignature[]
    },
    enabled: !!user,
  })
}

export function useDeleteUserSignature() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (sig: { id: string; image_url?: string }) => {
      // Remove primeiro o ficheiro do storage (se existir) para não deixar órfãos
      const path = sig.image_url?.split('/signatures/')[1]
      if (path) {
        try {
          await supabase.storage.from('signatures').remove([path])
        } catch {
          /* storage indisponível — prossegue com a remoção do registo */
        }
      }
      const { error } = await supabase.from('user_signatures').delete().eq('id', sig.id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-signatures'] })
      if (user) queryClient.invalidateQueries({ queryKey: ['user-signatures', user.id] })
    },
  })
}

/** Marca uma assinatura como a activa (desactivando as restantes). */
export function useActivateUserSignature() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Sessão expirada')
      await supabase.from('user_signatures').update({ is_active: false }).eq('user_id', user.id)
      const { error } = await supabase.from('user_signatures').update({ is_active: true }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-signatures'] })
      if (user) queryClient.invalidateQueries({ queryKey: ['user-signatures', user.id] })
    },
  })
}
