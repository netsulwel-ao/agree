-- ============================================
-- SETUP COMPLETO — Agree Sistema de Gestão de Contratos
-- Executar no SQL Editor do Supabase
-- ============================================

-- 1. CRIAR BUCKET DE STORAGE (para anexos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Qualquer um pode ler ficheiros"
ON storage.objects FOR SELECT
USING (bucket_id = 'contracts');

-- 2. CRIAR TABELA DE MODELOS DE CONTRATO
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT false,
    user_id UUID
);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view all templates"
    ON contract_templates FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS "Users can create templates"
    ON contract_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY IF NOT EXISTS "Users can update their own templates"
    ON contract_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own templates"
    ON contract_templates FOR DELETE
    USING (auth.uid() = user_id);

-- 3. SEEDS — MODELOS DE CONTRATO (Angola)
INSERT INTO contract_templates (name, description, category, content, is_system) VALUES
(
    'Prestação de Serviços',
    'Contrato de prestação de serviços para profissionais e empresas',
    'Serviços',
    '<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
<p>Outorgantes:</p>
<p><strong>PRIMEIRO OUTORGANTE:</strong> {{parte_nome}}, {{parte_nacionalidade}}, {{parte_estado_civil}}, {{parte_profissao}}, portador(a) do Bilhete de Identidade n.º {{parte_bi}}, emitido por {{parte_bi_emissor}}, com residência em {{parte_residencia}}, aqui representado(a) pelo(a) seu/sua sócio-gerente/administrador(a) {{parte_representante}}, adiante designado(a) simplesmente por CONTRATANTE.</p>
<p><strong>SEGUNDO OUTORGANTE:</strong> {{contraparte_nome}}, {{contraparte_nacionalidade}}, {{contraparte_estado_civil}}, {{contraparte_profissao}}, portador(a) do Bilhete de Identidade n.º {{contraparte_bi}}, emitido por {{contraparte_bi_emissor}}, com residência em {{contraparte_residencia}}, adiante designado(a) simplesmente por CONTRATADO.</p>
<p>Considerando que o CONTRATADO possui conhecimentos e experiência na área de {{area_servico}}, o que é do interesse do CONTRATANTE, celebram o presente contrato que se rege pelas cláusulas seguintes:</p>
<h3>CLÁUSULA PRIMEIRA — OBJECTO</h3>
<p>O CONTRATADO obriga-se a prestar ao CONTRATANTE os serviços de {{descricao_servico}}, conforme detalhado no Anexo I ao presente contrato.</p>
<h3>CLÁUSULA SEGUNDA — PRAZO</h3>
<p>O presente contrato vigorará pelo período de {{prazo_meses}} meses, com início em {{data_inicio}} e término em {{data_fim}}, podendo ser renovado por acordo escrito entre as partes.</p>
<h3>CLÁUSULA TERCEIRA — REMUNERAÇÃO</h3>
<p>Pela prestação dos serviços, o CONTRATANTE pagará ao CONTRATADO o valor de {{valor}} ({{valor_extenso}}), a ser pago {{condicoes_pagamento}}.</p>
<h3>CLÁUSULA QUARTA — OBRIGAÇÕES DO CONTRATADO</h3>
<p>O CONTRATADO obriga-se a: a) Executar os serviços com diligência e competência; b) Respeitar as normas e políticas internas do CONTRATANTE; c) Manter a confidencialidade sobre toda a informação a que tiver acesso; d) Entregar os relatórios e documentos acordados nos prazos estabelecidos.</p>
<h3>CLÁUSULA QUINTA — OBRIGAÇÕES DO CONTRATANTE</h3>
<p>O CONTRATANTE obriga-se a: a) Fornecer ao CONTRATADO toda a informação necessária à execução dos serviços; b) Pagar a remuneração acordada nos prazos estipulados; c) Assegurar as condições de trabalho necessárias.</p>
<h3>CLÁUSULA SEXTA — CONFIDENCIALIDADE</h3>
<p>Ambas as partes obrigam-se a manter sigilo sobre todas as informações comerciais, técnicas ou financeiras relativas à outra parte, durante a vigência do contrato e após o seu termo.</p>
<h3>CLÁUSULA SÉTIMA — RESOLUÇÃO</h3>
<p>Qualquer das partes poderá resolver o presente contrato mediante comunicação escrita com {{prazo_resolucao}} dias de antecedência, ou imediatamente em caso de incumprimento grave das obrigações contratuais.</p>
<h3>CLÁUSULA OITAVA — DISPOSIÇÕES FINAIS</h3>
<p>As partes elegem o foro da Comarca de {{foro}} para dirimir quaisquer litígios decorrentes do presente contrato, com renúncia expressa a qualquer outro.</p>
<p>Em testemunho da verdade, assinam o presente contrato em duas vias de igual teor e forma.</p>
<p>{{cidade}}, {{data_assinatura}}</p>
<p>____________________________</p>
<p>{{parte_nome}} — CONTRATANTE</p>
<p>____________________________</p>
<p>{{contraparte_nome}} — CONTRATADO</p>',
    true
),
(
    'Contrato de Trabalho',
    'Contrato individual de trabalho ao abrigo da Lei Geral do Trabalho de Angola',
    'Recursos Humanos',
    '<h2>CONTRATO INDIVIDUAL DE TRABALHO</h2>
<p>Outorgantes:</p>
<p><strong>PRIMEIRO OUTORGANTE:</strong> {{empregador_nome}}, pessoa colectiva n.º {{empregador_nif}}, com sede em {{empregador_sede}}, representada por {{empregador_representante}}, na qualidade de {{empregador_cargo}}, adiante designado(a) por EMPREGADOR.</p>
<p><strong>SEGUNDO OUTORGANTE:</strong> {{trabalhador_nome}}, {{trabalhador_nacionalidade}}, portador(a) do Bilhete de Identidade n.º {{trabalhador_bi}}, emitido por {{trabalhador_bi_emissor}}, residente em {{trabalhador_residencia}}, adiante designado(a) por TRABALHADOR.</p>
<p>Considerando que o EMPREGADOR necessita de admitir um trabalhador para o exercício das funções de {{funcao}}, e que o TRABALHADOR possui as competências necessárias, celebram o presente contrato nos termos da Lei Geral do Trabalho (Lei n.º 7/15 de 15 de Junho), mediante as cláusulas seguintes:</p>
<h3>CLÁUSULA PRIMEIRA — FUNÇÕES</h3>
<p>O TRABALHADOR exercerá as funções de {{funcao}}, no sector/departamento de {{departamento}}, devendo cumprir as tarefas e responsabilidades descritas no anexo ao presente contrato.</p>
<h3>CLÁUSULA SEGUNDA — LOCAL DE TRABALHO</h3>
<p>O local de trabalho situa-se em {{local_trabalho}}, podendo o TRABALHADOR ser transferido temporariamente para outro local sempre que as necessidades do serviço o exijam.</p>
<h3>CLÁUSULA TERCEIRA — DURAÇÃO</h3>
<p>O presente contrato é celebrado por prazo {{tipo_prazo}} de {{duracao_meses}} meses, com início em {{data_inicio}} e termo em {{data_fim}}.</p>
<h3>CLÁUSULA QUARTA — REMUNERAÇÃO</h3>
<p>O TRABALHADOR receberá a remuneração mensal de {{valor}} ({{valor_extenso}}), sujeita aos descontos legais, e demais subsídios previstos na lei.</p>
<h3>CLÁUSULA QUINTA — HORÁRIO DE TRABALHO</h3>
<p>O horário de trabalho será de {{horario}} horas semanais, de {{horario_inicio}} às {{horario_fim}}, com intervalo de {{intervalo}} para descanso.</p>
<h3>CLÁUSULA SEXTA — PERÍODO EXPERIMENTAL</h3>
<p>O presente contrato está sujeito a um período experimental de {{periodo_experimental}} dias, durante o qual qualquer das partes poderá denunciar o contrato sem aviso prévio.</p>
<h3>CLÁUSULA SÉTIMA — FÉRIAS E FALTAS</h3>
<p>O TRABALHADOR tem direito a férias anuais remuneradas de {{dias_ferias}} dias úteis, e a faltas justificadas nos termos da lei.</p>
<h3>CLÁUSULA OITAVA — RESOLUÇÃO</h3>
<p>O contrato pode ser resolvido nos termos previstos na Lei Geral do Trabalho, com a antecedência e formalidades legais aplicáveis.</p>
<p>{{cidade}}, {{data_assinatura}}</p>
<p>____________________________</p>
<p>{{empregador_nome}} — EMPREGADOR</p>
<p>____________________________</p>
<p>{{trabalhador_nome}} — TRABALHADOR</p>',
    true
),
(
    'Acordo de Confidencialidade (NDA)',
    'Acordo de confidencialidade unilateral para protecção de informação sensível',
    'Confidencialidade',
    '<h2>ACORDO DE CONFIDENCIALIDADE</h2>
<p><em>(Non-Disclosure Agreement — NDA)</em></p>
<p>Outorgantes:</p>
<p><strong>PRIMEIRA PARTE (DIVULGADOR):</strong> {{divulgador_nome}}, pessoa colectiva n.º {{divulgador_nif}}, com sede em {{divulgador_sede}}, representada por {{divulgador_representante}}, adiante designado por DIVULGADOR.</p>
<p><strong>SEGUNDA PARTE (RECEPTOR):</strong> {{receptor_nome}}, {{receptor_nacionalidade}}, portador(a) do BI n.º {{receptor_bi}}, residente em {{receptor_residencia}}, adiante designado por RECEPTOR.</p>
<p>Considerando que as partes desejam explorar uma potencial relação comercial e que, nesse contexto, o DIVULGADOR poderá divulgar ao RECEPTOR informação confidencial, celebram o seguinte:</p>
<h3>CLÁUSULA PRIMEIRA — INFORMAÇÃO CONFIDENCIAL</h3>
<p>Considera-se informação confidencial toda a informação, independentemente da forma, comunicada pelo DIVULGADOR ao RECEPTOR, incluindo mas não limitada a: dados técnicos, financeiros, comerciais, estratégicos, planos de negócio, listas de clientes, software, patentes, know-how, e qualquer documentação marcada como confidencial.</p>
<h3>CLÁUSULA SEGUNDA — OBRIGAÇÕES DO RECEPTOR</h3>
<p>O RECEPTOR obriga-se a: a) Não divulgar a informação confidencial a terceiros sem autorização prévia por escrito; b) Utilizar a informação exclusivamente para o fim acordado; c) Manter a informação em local seguro e restrito; d) Devolver ou destruir toda a informação confidencial quando solicitado.</p>
<h3>CLÁUSULA TERCEIRA — EXCEPÇÕES</h3>
<p>Não é considerada informação confidencial: a) Informação que já seja do domínio público; b) Informação que o RECEPTOR já possuía legitimamente antes da divulgação; c) Informação obtida de terceiros sem restrições de confidencialidade; d) Informação que seja obrigada a divulgar por lei ou ordem judicial.</p>
<h3>CLÁUSULA QUARTA — PRAZO</h3>
<p>As obrigações de confidencialidade vigoram pelo período de {{prazo_anos}} anos a contar da data de divulgação da informação.</p>
<h3>CLÁUSULA QUINTA — DISPOSIÇÕES FINAIS</h3>
<p>O presente acordo rege-se pela lei angolana. Para quaisquer litígios, as partes elegem o foro de {{foro}}.</p>
<p>{{cidade}}, {{data_assinatura}}</p>
<p>____________________________</p>
<p>{{divulgador_nome}} — DIVULGADOR</p>
<p>____________________________</p>
<p>{{receptor_nome}} — RECEPTOR</p>',
    true
),
(
    'Contrato de Arrendamento',
    'Contrato de arrendamento para habitação ou comércio',
    'Imobiliário',
    '<h2>CONTRATO DE ARRENDAMENTO</h2>
<p>Outorgantes:</p>
<p><strong>PRIMEIRO OUTORGANTE (SENHORIO):</strong> {{senhorio_nome}}, {{senhorio_nacionalidade}}, portador(a) do BI n.º {{senhorio_bi}}, residente em {{senhorio_residencia}}, adiante designado por SENHORIO.</p>
<p><strong>SEGUNDO OUTORGANTE (INQUILINO):</strong> {{inquilino_nome}}, {{inquilino_nacionalidade}}, portador(a) do BI n.º {{inquilino_bi}}, residente em {{inquilino_residencia}}, adiante designado por INQUILINO.</p>
<p>Pelo presente instrumento, o SENHORIO dá de arrendamento ao INQUILINO, que aceita, o imóvel descrito na cláusula primeira, mediante as cláusulas seguintes:</p>
<h3>CLÁUSULA PRIMEIRA — IMÓVEL</h3>
<p>O SENHORIO dá de arrendamento ao INQUILINO o imóvel sito em {{imovel_endereco}}, composto por {{imovel_descricao}}, com a área de {{imovel_area}} m².</p>
<h3>CLÁUSULA SEGUNDA — DESTINO</h3>
<p>O imóvel destina-se exclusivamente a {{destino_imovel}}, não podendo o INQUILINO dar-lhe uso diferente sem autorização escrita do SENHORIO.</p>
<h3>CLÁUSULA TERCEIRA — PRAZO</h3>
<p>O presente arrendamento celebra-se pelo prazo de {{prazo_meses}} meses, com início em {{data_inicio}} e término em {{data_fim}}, renovável automaticamente por iguais períodos salvo denúncia de qualquer das partes.</p>
<h3>CLÁUSULA QUARTA — RENDA</h3>
<p>A renda mensal é de {{valor}} ({{valor_extenso}}), paga até ao dia {{dia_pagamento}} de cada mês, por transferência bancária para {{iban_senhorio}}.</p>
<h3>CLÁUSULA QUINTA — CAUÇÃO</h3>
<p>O INQUILINO presta uma caução no valor de {{caução_meses}} meses de renda, ou seja {{valor_caucao}}, que será devolvida no termo do contrato deduzidas as quantias em dívida.</p>
<h3>CLÁUSULA SEXTA — OBRIGAÇÕES</h3>
<p>O INQUILINO obriga-se a: a) Pagar pontualmente as rendas; b) Usar o imóvel com diligência; c) Não realizar obras sem autorização; d) Permitir visitas ao imóvel; e) Pagar as despesas de condomínio, água, luz e gás.</p>
<p>O SENHORIO obriga-se a: a) Entregar o imóvel em bom estado; b) Assegurar a utilização pacífica; c) Realizar as reparações necessárias.</p>
<h3>CLÁUSULA SÉTIMA — RESOLUÇÃO</h3>
<p>O incumprimento do pagamento de {{dias_incumprimento}} rendas consecutivas confere ao SENHORIO o direito de resolver o contrato.</p>
<p>{{cidade}}, {{data_assinatura}}</p>
<p>____________________________</p>
<p>{{senhorio_nome}} — SENHORIO</p>
<p>____________________________</p>
<p>{{inquilino_nome}} — INQUILINO</p>',
    true
),
(
    'Contrato de Compra e Venda',
    'Contrato de compra e venda de bens móveis ou imóveis',
    'Comercial',
    '<h2>CONTRATO DE COMPRA E VENDA</h2>
<p>Outorgantes:</p>
<p><strong>PRIMEIRO OUTORGANTE (VENDEDOR):</strong> {{vendedor_nome}}, {{vendedor_nacionalidade}}, portador(a) do BI n.º {{vendedor_bi}}, residente em {{vendedor_residencia}}, adiante designado por VENDEDOR.</p>
<p><strong>SEGUNDO OUTORGANTE (COMPRADOR):</strong> {{comprador_nome}}, {{comprador_nacionalidade}}, portador(a) do BI n.º {{comprador_bi}}, residente em {{comprador_residencia}}, adiante designado por COMPRADOR.</p>
<p>Considerando que o VENDEDOR é legítimo proprietário do bem descrito na cláusula primeira e pretende vendê-lo, e o COMPRADOR pretende adquiri-lo, celebram o seguinte:</p>
<h3>CLÁUSULA PRIMEIRA — OBJECTO</h3>
<p>O VENDEDOR vende ao COMPRADOR, que compra, o seguinte bem: {{descricao_bem}}, com as características descritas no anexo ao presente contrato.</p>
<h3>CLÁUSULA SEGUNDA — PREÇO</h3>
<p>O preço de venda é de {{valor}} ({{valor_extenso}}), pago pelo COMPRADOR ao VENDEDOR da seguinte forma: {{condicoes_pagamento}}.</p>
<h3>CLÁUSULA TERCEIRA — ENTREGA</h3>
<p>O VENDEDOR entregará o bem ao COMPRADOR em {{data_entrega}}, no local designado por {{local_entrega}}.</p>
<h3>CLÁUSULA QUARTA — GARANTIA</h3>
<p>O VENDEDOR garante que o bem se encontra livre de ónus, encargos ou limitações ao direito de propriedade, e que o mesmo possui as qualidades e características descritas.</p>
<h3>CLÁUSULA QUINTA — DISPOSIÇÕES FINAIS</h3>
<p>O presente contrato rege-se pela lei angolana. Para quaisquer litígios decorrentes do presente contrato, as partes elegem o foro de {{foro}}.</p>
<p>{{cidade}}, {{data_assinatura}}</p>
<p>____________________________</p>
<p>{{vendedor_nome}} — VENDEDOR</p>
<p>____________________________</p>
<p>{{comprador_nome}} — COMPRADOR</p>',
    true
),
(
    'Acordo de Parceria',
    'Acordo de parceria empresarial entre duas entidades',
    'Serviços',
    '<h2>ACORDO DE PARCERIA</h2>
<p>Outorgantes:</p>
<p><strong>PRIMEIRA PARTE:</strong> {{parceiro1_nome}}, pessoa colectiva n.º {{parceiro1_nif}}, com sede em {{parceiro1_sede}}, representada por {{parceiro1_representante}}, adiante designado por PARCEIRO 1.</p>
<p><strong>SEGUNDA PARTE:</strong> {{parceiro2_nome}}, pessoa colectiva n.º {{parceiro2_nif}}, com sede em {{parceiro2_sede}}, representada por {{parceiro2_representante}}, adiante designado por PARCEIRO 2.</p>
<p>Considerando que ambas as partes desejam estabelecer uma parceria para desenvolver actividades de interesse comum, celebram o seguinte:</p>
<h3>CLÁUSULA PRIMEIRA — OBJECTO</h3>
<p>A parceria tem por objecto a colaboração entre as partes nas áreas de {{area_parceria}}, visando {{objectivo_parceria}}.</p>
<h3>CLÁUSULA SEGUNDA — OBRIGAÇÕES DAS PARTES</h3>
<p>O PARCEIRO 1 obriga-se a: {{obrigacoes_parceiro1}}.</p>
<p>O PARCEIRO 2 obriga-se a: {{obrigacoes_parceiro2}}.</p>
<h3>CLÁUSULA TERCEIRA — PARTILHA DE RECEITAS</h3>
<p>As receitas geradas no âmbito da parceria serão partilhadas da seguinte forma: {{partilha_receitas}}.</p>
<h3>CLÁUSULA QUARTA — PROPRIEDADE INTELECTUAL</h3>
<p>Os direitos de propriedade intelectual sobre os resultados da parceria pertencerão a {{propriedade_intelectual}}.</p>
<h3>CLÁUSULA QUINTA — PRAZO E RESOLUÇÃO</h3>
<p>A parceria vigorará por {{prazo_parceria}}, podendo ser resolvida por acordo ou por incumprimento grave de qualquer das partes.</p>
<h3>CLÁUSULA SEXTA — DISPOSIÇÕES FINAIS</h3>
<p>O presente acordo rege-se pela lei angolana. As partes elegem o foro de {{foro}} para dirimir litígios.</p>
<p>{{cidade}}, {{data_assinatura}}</p>
<p>____________________________</p>
<p>{{parceiro1_nome}} — PARCEIRO 1</p>
<p>____________________________</p>
<p>{{parceiro2_nome}} — PARCEIRO 2</p>',
    true
);
