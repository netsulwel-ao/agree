import { toast } from 'sonner';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error);

  const message = error?.message || 'Ocorreu um erro inesperado';

  // Erros específicos do Supabase
  if (error?.code === '23505') {
    toast.error('Este registo já existe');
    throw new AppError('Registo duplicado', error.code, 409);
  }

  if (error?.code === '23503') {
    toast.error('Não é possível apagar este registo pois está em uso');
    throw new AppError('Violação de chave estrangeira', error.code, 400);
  }

  if (error?.code === '42501') {
    toast.error('Não tens permissão para realizar esta ação');
    throw new AppError('Sem permissão', error.code, 403);
  }

  // Erro genérico
  toast.error(message);
  throw new AppError(message, error?.code, 500);
}

export function handleNetworkError(error: any): never {
  console.error('Network error:', error);

  if (!navigator.onLine) {
    toast.error('Sem conexão à internet. Verifica a tua ligação.');
    throw new AppError('Sem conexão', 'NETWORK_OFFLINE', 503);
  }

  toast.error('Erro de conexão. Tenta novamente.');
  throw new AppError('Erro de conexão', 'NETWORK_ERROR', 503);
}

export function handleValidationError(errors: Record<string, string>): never {
  const messages = Object.values(errors).join(', ');
  toast.error(messages);
  throw new AppError('Validação falhou', 'VALIDATION_ERROR', 400);
}

export function handleAsyncError(fn: (...args: any[]) => Promise<void>) {
  return async (...args: any[]) => {
    try {
      await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      handleSupabaseError(error);
    }
  };
}

export function logError(error: any, context?: Record<string, any>) {
  console.error('Error logged:', {
    error: error?.message || error,
    context,
    timestamp: new Date().toISOString(),
  });
}
