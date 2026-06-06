# Scripts de Banco de Dados

Este diretório contém scripts SQL para gerir o banco de dados do Agree.

## ⚠️ AVISO IMPORTANTE

Estes scripts apagam dados. Use com cuidado!

## Scripts Disponíveis

### 1. reset-database.sql
Apaga TODOS os dados de todas as tabelas mas mantém a estrutura.

**Como usar:**
```bash
# Via Supabase CLI
supabase db reset

# Ou via SQL Editor no Supabase Dashboard
# Copie e cole o conteúdo do arquivo
```

### 2. create-random-admin.sql
Cria um utilizador admin com email e senha aleatórios.

**Como usar:**
```bash
# Via SQL Editor no Supabase Dashboard
# Copie e cole o conteúdo do arquivo
# As credenciais serão mostradas no output
```

**Output:**
```
========================================
ADMIN CRIADO COM SUCESSO!
========================================
Email: admin_abc12345@agree.ao
Senha: xyz789abc123
========================================
GUARDA ESTAS CREDENCIAIS!
========================================
```

### 3. delete-all-users.sql
Apaga TODOS os utilizadores do auth.users (incluindo profiles).

**Como usar:**
```bash
# Via SQL Editor no Supabase Dashboard
# Copie e cole o conteúdo do arquivo
```

## Fluxo Recomendado para Reset Completo

1. **Resetar banco de dados:**
   ```bash
   supabase db reset
   ```
   Ou execute `reset-database.sql`

2. **Apagar todos os utilizadores:**
   Execute `delete-all-users.sql`

3. **Criar novo admin:**
   Execute `create-random-admin.sql`

4. **Guardar credenciais:**
   Copie o email e senha gerados

5. **Testar login:**
   Aceda à aplicação e faça login com as credenciais geradas

## Notas

- O script `reset-database.sql` desabilita e reabilita o trigger `on_auth_user_created` automaticamente
- O script `create-random-admin.sql` gera credenciais aleatórias e mostra no output
- O script `delete-all-users.sql` apaga também os profiles devido ao ON DELETE CASCADE
