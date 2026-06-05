-- Ensure pg_trgm extension for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add usage_count and full-text search columns
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_templates_name_trgm ON contract_templates USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_templates_category ON contract_templates(category);

-- Update system templates with proper variable definitions
-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE contract_templates SET usage_count = usage_count + 1 WHERE id = template_id;
END;
$$;

UPDATE contract_templates SET variables = '[
  {"name":"parte_nome","label":"Nome do Contratante","type":"text","required":true},
  {"name":"parte_nacionalidade","label":"Nacionalidade","type":"text","required":true},
  {"name":"parte_estado_civil","label":"Estado Civil","type":"text","required":true},
  {"name":"parte_profissao","label":"Profissão","type":"text","required":true},
  {"name":"parte_bi","label":"BI do Contratante","type":"text","required":true},
  {"name":"parte_bi_emissor","label":"Emissor do BI","type":"text","required":true},
  {"name":"parte_residencia","label":"Residência do Contratante","type":"text","required":true},
  {"name":"parte_representante","label":"Representante","type":"text"},
  {"name":"contraparte_nome","label":"Nome do Contratado","type":"text","required":true},
  {"name":"contraparte_nacionalidade","label":"Nacionalidade","type":"text","required":true},
  {"name":"contraparte_estado_civil","label":"Estado Civil","type":"text","required":true},
  {"name":"contraparte_profissao","label":"Profissão","type":"text","required":true},
  {"name":"contraparte_bi","label":"BI do Contratado","type":"text","required":true},
  {"name":"contraparte_bi_emissor","label":"Emissor do BI","type":"text","required":true},
  {"name":"contraparte_residencia","label":"Residência do Contratado","type":"text","required":true},
  {"name":"area_servico","label":"Área de Serviço","type":"text","required":true},
  {"name":"descricao_servico","label":"Descrição do Serviço","type":"textarea","required":true},
  {"name":"prazo_meses","label":"Prazo (meses)","type":"text","required":true},
  {"name":"data_inicio","label":"Data de Início","type":"date","required":true},
  {"name":"data_fim","label":"Data de Término","type":"date","required":true},
  {"name":"valor","label":"Valor","type":"currency","required":true},
  {"name":"valor_extenso","label":"Valor por Extenso","type":"text","required":true},
  {"name":"condicoes_pagamento","label":"Condições de Pagamento","type":"textarea","required":true},
  {"name":"prazo_resolucao","label":"Prazo de Resolução (dias)","type":"text","required":true},
  {"name":"foro","label":"Foro (Comarca)","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Prestação de Serviços' AND is_system = true;

UPDATE contract_templates SET variables = '[
  {"name":"empregador_nome","label":"Nome do Empregador","type":"text","required":true},
  {"name":"empregador_nif","label":"NIF do Empregador","type":"text","required":true},
  {"name":"empregador_sede","label":"Sede do Empregador","type":"text","required":true},
  {"name":"empregador_representante","label":"Representante","type":"text","required":true},
  {"name":"empregador_cargo","label":"Cargo do Representante","type":"text","required":true},
  {"name":"trabalhador_nome","label":"Nome do Trabalhador","type":"text","required":true},
  {"name":"trabalhador_nacionalidade","label":"Nacionalidade","type":"text","required":true},
  {"name":"trabalhador_bi","label":"BI do Trabalhador","type":"text","required":true},
  {"name":"trabalhador_bi_emissor","label":"Emissor do BI","type":"text","required":true},
  {"name":"trabalhador_residencia","label":"Residência","type":"text","required":true},
  {"name":"funcao","label":"Função","type":"text","required":true},
  {"name":"departamento","label":"Departamento","type":"text","required":true},
  {"name":"local_trabalho","label":"Local de Trabalho","type":"text","required":true},
  {"name":"tipo_prazo","label":"Tipo de Prazo","type":"text","required":true},
  {"name":"duracao_meses","label":"Duração (meses)","type":"text","required":true},
  {"name":"data_inicio","label":"Data de Início","type":"date","required":true},
  {"name":"data_fim","label":"Data de Término","type":"date","required":true},
  {"name":"valor","label":"Salário Base","type":"currency","required":true},
  {"name":"valor_extenso","label":"Valor por Extenso","type":"text","required":true},
  {"name":"horario","label":"Horário Semanal (horas)","type":"text","required":true},
  {"name":"horario_inicio","label":"Início do Horário","type":"text","required":true},
  {"name":"horario_fim","label":"Fim do Horário","type":"text","required":true},
  {"name":"intervalo","label":"Intervalo","type":"text","required":true},
  {"name":"periodo_experimental","label":"Período Experimental (dias)","type":"text","required":true},
  {"name":"dias_ferias","label":"Dias de Férias","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Contrato de Trabalho' AND is_system = true;

UPDATE contract_templates SET variables = '[
  {"name":"divulgador_nome","label":"Nome do Divulgador","type":"text","required":true},
  {"name":"divulgador_nif","label":"NIF do Divulgador","type":"text","required":true},
  {"name":"divulgador_sede","label":"Sede","type":"text","required":true},
  {"name":"divulgador_representante","label":"Representante","type":"text","required":true},
  {"name":"receptor_nome","label":"Nome do Receptor","type":"text","required":true},
  {"name":"receptor_nacionalidade","label":"Nacionalidade","type":"text"},
  {"name":"receptor_bi","label":"BI do Receptor","type":"text"},
  {"name":"receptor_residencia","label":"Residência","type":"text"},
  {"name":"prazo_anos","label":"Prazo (anos)","type":"text","required":true},
  {"name":"foro","label":"Foro","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Acordo de Confidencialidade (NDA)' AND is_system = true;

UPDATE contract_templates SET variables = '[
  {"name":"senhorio_nome","label":"Nome do Senhorio","type":"text","required":true},
  {"name":"senhorio_nacionalidade","label":"Nacionalidade","type":"text","required":true},
  {"name":"senhorio_bi","label":"BI do Senhorio","type":"text","required":true},
  {"name":"senhorio_residencia","label":"Residência","type":"text","required":true},
  {"name":"inquilino_nome","label":"Nome do Inquilino","type":"text","required":true},
  {"name":"inquilino_nacionalidade","label":"Nacionalidade","type":"text","required":true},
  {"name":"inquilino_bi","label":"BI do Inquilino","type":"text","required":true},
  {"name":"inquilino_residencia","label":"Residência","type":"text","required":true},
  {"name":"imovel_endereco","label":"Endereço do Imóvel","type":"text","required":true},
  {"name":"imovel_descricao","label":"Descrição do Imóvel","type":"textarea","required":true},
  {"name":"imovel_area","label":"Área (m²)","type":"text","required":true},
  {"name":"destino_imovel","label":"Destino do Imóvel","type":"text","required":true},
  {"name":"prazo_meses","label":"Prazo (meses)","type":"text","required":true},
  {"name":"data_inicio","label":"Data de Início","type":"date","required":true},
  {"name":"data_fim","label":"Data de Término","type":"date","required":true},
  {"name":"valor","label":"Valor da Renda","type":"currency","required":true},
  {"name":"valor_extenso","label":"Valor por Extenso","type":"text","required":true},
  {"name":"dia_pagamento","label":"Dia de Pagamento","type":"text","required":true},
  {"name":"iban_senhorio","label":"IBAN do Senhorio","type":"text","required":true},
  {"name":"valor_caucao","label":"Valor da Caução","type":"currency","required":true},
  {"name":"dias_incumprimento","label":"Dias para Incumprimento","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Contrato de Arrendamento' AND is_system = true;

UPDATE contract_templates SET variables = '[
  {"name":"vendedor_nome","label":"Nome do Vendedor","type":"text","required":true},
  {"name":"vendedor_nacionalidade","label":"Nacionalidade","type":"text"},
  {"name":"vendedor_bi","label":"BI do Vendedor","type":"text","required":true},
  {"name":"vendedor_residencia","label":"Residência","type":"text"},
  {"name":"comprador_nome","label":"Nome do Comprador","type":"text","required":true},
  {"name":"comprador_nacionalidade","label":"Nacionalidade","type":"text"},
  {"name":"comprador_bi","label":"BI do Comprador","type":"text","required":true},
  {"name":"comprador_residencia","label":"Residência","type":"text"},
  {"name":"descricao_bem","label":"Descrição do Bem","type":"textarea","required":true},
  {"name":"valor","label":"Valor","type":"currency","required":true},
  {"name":"valor_extenso","label":"Valor por Extenso","type":"text","required":true},
  {"name":"condicoes_pagamento","label":"Condições de Pagamento","type":"textarea","required":true},
  {"name":"data_entrega","label":"Data de Entrega","type":"date","required":true},
  {"name":"local_entrega","label":"Local de Entrega","type":"text","required":true},
  {"name":"foro","label":"Foro","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Contrato de Compra e Venda' AND is_system = true;

UPDATE contract_templates SET variables = '[
  {"name":"parceiro1_nome","label":"Nome do Parceiro 1","type":"text","required":true},
  {"name":"parceiro1_nif","label":"NIF do Parceiro 1","type":"text","required":true},
  {"name":"parceiro1_sede","label":"Sede do Parceiro 1","type":"text","required":true},
  {"name":"parceiro1_representante","label":"Representante Parceiro 1","type":"text","required":true},
  {"name":"parceiro2_nome","label":"Nome do Parceiro 2","type":"text","required":true},
  {"name":"parceiro2_nif","label":"NIF do Parceiro 2","type":"text","required":true},
  {"name":"parceiro2_sede","label":"Sede do Parceiro 2","type":"text","required":true},
  {"name":"parceiro2_representante","label":"Representante Parceiro 2","type":"text","required":true},
  {"name":"area_parceria","label":"Área da Parceria","type":"text","required":true},
  {"name":"objectivo_parceria","label":"Objectivo da Parceria","type":"textarea","required":true},
  {"name":"obrigacoes_parceiro1","label":"Obrigações do Parceiro 1","type":"textarea","required":true},
  {"name":"obrigacoes_parceiro2","label":"Obrigações do Parceiro 2","type":"textarea","required":true},
  {"name":"partilha_receitas","label":"Partilha de Receitas","type":"textarea","required":true},
  {"name":"propriedade_intelectual","label":"Propriedade Intelectual","type":"textarea","required":true},
  {"name":"prazo_parceria","label":"Prazo da Parceria","type":"text","required":true},
  {"name":"foro","label":"Foro","type":"text","required":true},
  {"name":"cidade","label":"Cidade","type":"text","required":true},
  {"name":"data_assinatura","label":"Data de Assinatura","type":"date","required":true}
]'::jsonb WHERE name = 'Acordo de Parceria' AND is_system = true;
