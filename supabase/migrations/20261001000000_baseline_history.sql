-- Marca as 34 migracoes anteriores como ja aplicadas. A base foi criada e
-- alterada ao longo do tempo (muitas manualmente no Dashboard), e nao ha
-- historico registado -- logo o db push tentaria reaplicar tudo.
create table if not exists public.schema_migrations (
  version    text primary key,
  statements text[] default '{}',
  name       text
);
