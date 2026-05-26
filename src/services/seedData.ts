import { supabase } from '../lib/supabase';
import { addDays, subDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export async function seedSampleContracts(userId: string) {
  const contracts = [
    {
      title: "Contrato de Manutenção de Elevadores - Edifício Kilamba",
      description: "Manutenção preventiva e corretiva dos 4 elevadores do bloco A.",
      content: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS...\n\nCláusula 1: O objeto deste contrato é a manutenção dos elevadores...\nCláusula 2: O valor mensal será de 150.000 Kz...",
      value: 1800000,
      status: 'approved',
      owner_id: userId,
      start_date: subDays(new Date(), 30).toISOString(),
      end_date: addDays(new Date(), 335).toISOString(),
      risks: [
        { severity: 'low', description: 'Risco de atraso na importação de peças específicas.' }
      ],
      attachments: [
        {
          id: uuidv4(),
          name: "Contrato_Assinado_Elevadores.pdf",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          type: "application/pdf",
          size: 102400,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userId
        }
      ]
    },
    {
      title: "Fornecimento de Software de Gestão - Unitel",
      description: "Licenciamento anual de sistema ERP para 50 usuários.",
      content: "ACORDO DE LICENCIAMENTO DE SOFTWARE...\n\nO licenciante concede ao licenciado o direito de uso...\nValor total: 5.000.000 Kz.",
      value: 5000000,
      status: 'pending',
      owner_id: userId,
      start_date: new Date().toISOString(),
      end_date: addDays(new Date(), 5).toISOString(), // Expiring soon!
      risks: [
        { severity: 'high', description: 'Vencimento iminente sem renovação confirmada.' },
        { severity: 'medium', description: 'Dependência de suporte técnico externo.' }
      ],
      attachments: [
        {
          id: uuidv4(),
          name: "Proposta_Comercial_ERP.pdf",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          type: "application/pdf",
          size: 256000,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userId
        },
        {
          id: uuidv4(),
          name: "Termos_de_Uso.docx",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          size: 45000,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userId
        }
      ]
    },
    {
      title: "Aluguer de Escritório - Talatona Business Center",
      description: "Contrato de arrendamento de sala comercial no 3º andar.",
      content: "CONTRATO DE ARRENDAMENTO COMERCIAL...\n\nO locador cede ao locatário o uso do imóvel...\nRenda mensal: 450.000 Kz.",
      value: 5400000,
      status: 'approved',
      owner_id: userId,
      start_date: subDays(new Date(), 180).toISOString(),
      end_date: addDays(new Date(), 185).toISOString(),
      risks: [],
      attachments: [
        {
          id: uuidv4(),
          name: "Planta_da_Sala.pdf",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          type: "application/pdf",
          size: 1500000,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userId
        }
      ]
    }
  ];

  for (const contractData of contracts) {
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();
    
    if (contractError) {
      console.error("Error seeding contract:", contractError);
      continue;
    }

    // Add initial version
    await supabase.from('contract_versions').insert({
      contract_id: contract.id,
      content: contractData.content,
      version_number: 1
    });
  }
}
