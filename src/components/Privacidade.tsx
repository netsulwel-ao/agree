import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacidade() {
  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', padding: '48px 24px',
      fontFamily: "'Poppins',sans-serif", color: '#0d1117'
    }}>
      <Link to="/login" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: '#6b7280', textDecoration: 'none',
        marginBottom: 32, fontWeight: 500
      }}>
        <ArrowLeft size={16} /> Voltar ao login
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Política de Privacidade</h1>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 32 }}>Última actualização: Junho de 2026</p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>1. Dados Recolhidos</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          Recolhemos os seguintes dados pessoais: nome, endereço de email, número de telefone
          (quando fornecido), e informações de faturação. Estes dados são fornecidos
          voluntariamente por ti aquando do registo ou uso da plataforma.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>2. Finalidade do Tratamento</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          Os teus dados são utilizados para: (a) fornecer e manter a plataforma; (b) processar
          pagamentos; (c) enviar comunicações relacionadas com o serviço; (d) cumprir
          obrigações legais.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>3. Partilha de Dados</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          Não partilhamos os teus dados pessoais com terceiros, excepto quando necessário
          para processar pagamentos (através de parceiros de pagamento) ou quando exigido por lei.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>4. Segurança</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          Implementamos medidas técnicas e organizativas adequadas para proteger os teus dados
          contra acesso não autorizado, perda ou destruição. No entanto, nenhum sistema é
          completamente seguro.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>5. Os Teus Direitos</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          Tens direito a aceder, rectificar ou eliminar os teus dados pessoais a qualquer
          momento. Para exercer estes direitos, contacta-nos através do email de suporte.
        </p>
      </section>
    </div>
  );
}
