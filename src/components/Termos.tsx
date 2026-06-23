import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Termos() {
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
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Termos de Serviço</h1>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 32 }}>Última actualização: Junho de 2026</p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>1. Aceitação dos Termos</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          Ao aceder e utilizar a plataforma Agree, declaras que leste, compreendeste e aceitas
          vincular-te aos presentes Termos de Serviço. Se não concordares com algum dos termos,
          não deves utilizar a plataforma.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>2. Descrição do Serviço</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          O Agree é uma plataforma SaaS de gestão de contratos que permite criar, armazenar,
          assinar digitalmente e monitorizar contratos. As funcionalidades disponíveis dependem
          do plano contratado (Free, Pro ou Enterprise).
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>3. Conta de Utilizador</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          É da tua responsabilidade manter a confidencialidade das tuas credenciais de acesso.
          Deves notificar-nos imediatamente de qualquer uso não autorizado da tua conta.
          Reservamo-nos o direito de suspender ou cancelar contas que violem estes termos.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>4. Propriedade Intelectual</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          Todo o conteúdo gerado por ti na plataforma (contratos, documentos, etc.) permanece
          da tua propriedade. O Agree não reivindica qualquer direito de propriedade sobre
          o teu conteúdo.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>5. Limitação de Responsabilidade</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          O Agree é fornecido "como está", sem garantias de qualquer tipo. Não nos
          responsabilizamos por danos directos ou indirectos decorrentes do uso da plataforma.
        </p>
      </section>
    </div>
  );
}
