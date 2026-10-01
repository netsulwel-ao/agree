import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Compass, Home, LayoutDashboard, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

const SUGGESTIONS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/contracts', label: 'Contratos', icon: Home },
  { to: '/templates', label: 'Modelos', icon: Compass },
]

export default function NotFound() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16 text-center'>
      <p className='text-7xl font-bold tracking-tight text-muted-foreground/30'>404</p>

      <div className='space-y-2'>
        <h1 className='text-2xl font-semibold'>Página não encontrada</h1>
        <p className='text-sm text-muted-foreground'>
          O endereço <code className='rounded bg-muted px-1.5 py-0.5 text-xs'>{location.pathname}</code> não corresponde a nenhuma página.
        </p>
      </div>

      <div className='flex flex-wrap items-center justify-center gap-2'>
        <Button onClick={() => navigate(-1)} variant='outline'>
          <ArrowLeft className='mr-2 size-4' /> Voltar
        </Button>
        <Button render={<Link to={user ? '/dashboard' : '/'} />}>
          {user ? 'Ir para o Dashboard' : 'Voltar ao início'}
        </Button>
      </div>

      <div className='flex flex-wrap items-center justify-center gap-2 pt-4'>
        {SUGGESTIONS.map(({ to, label, icon: Icon }) => (
          <Button key={to} variant='ghost' size='sm' render={<Link to={to} />}>
            <Icon className='mr-1.5 size-4' /> {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
