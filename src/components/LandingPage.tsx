import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, X, Menu, LogIn,
  ChevronDown, ChevronUp, Shield,
  Bell, Users, BarChart3, Zap, CheckCircle,
  FileSignature, TrendingUp, Clock, FileText
} from 'lucide-react';
import AgreeLogo from '../Agree-logo.svg';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const faqs = [
    { q: 'Como funciona o processo de criação de contratos?', a: 'Crie contratos a partir de templates pré-aprovados ou do zero. O Agree guia-te por cada cláusula, sugere linguagem padrão e envia automaticamente para aprovação e assinatura — tudo dentro da plataforma, sem email.' },
    { q: 'A assinatura eletrônica tem validade jurídica?', a: 'Sim. Todas as assinaturas são criptografadas, carimbadas com data/hora e armazenadas com trilha de auditoria completa, seguindo os padrões da ICP-Brasil e legislação angolana de documentos digitais.' },
    { q: 'Posso importar contratos que já existem?', a: 'Sim. Importa contratos em PDF ou Word. O Agree extrai automaticamente as partes, datas e valores principais usando IA, e organiza tudo no teu portfólio em segundos.' },
    { q: 'Como funciona o controlo de acessos?', a: 'Definis permissões por utilizador, equipa ou departamento. O jurídico vê tudo, o financeiro vê apenas os contratos com impacto orçamental, e assim por diante — controlo granular e sem complicação.' },
    { q: 'Existe integração com outros sistemas?', a: 'O Agree integra com os principais ERPs (SAP, TOTVS, Oracle), ferramentas de assinatura (DocuSign, ClickSign) e plataformas de comunicação (Slack, Teams). API REST documentada para integrações customizadas.' },
  ];

  const testimonials = [
    { quote: 'Deixámos de perder contratos importantes em pastas de email. Tudo centralizado, acessível e rastreável.', name: 'Carla Mendes', role: 'Diretora Jurídica · Grupo Atlântico' },
    { quote: 'O ciclo de aprovação caiu de 3 semanas para 2 dias. Isso é dinheiro real no bolso da empresa.', name: 'Rafael Sousa', role: 'Head de Operações · TechBrasil' },
    { quote: 'Nunca mais perdemos um prazo de renovação. Os alertas automáticos mudaram completamente a nossa rotina.', name: 'Ana Paula Lima', role: 'CFO · Invest Capital' },
    { quote: 'A auditoria que levava dias agora leva horas. Temos rastreabilidade total de cada versão de cada contrato.', name: 'Marcos Ferreira', role: 'Compliance Officer · Meridian' },
    { quote: 'Implementámos em 3 dias. A equipa adoptou sem resistência porque é simples de verdade.', name: 'Sofia Costa', role: 'CEO · LexTech Angola' },
    { quote: 'O relatório de contratos a vencer em 90 dias virou a nossa reunião mensal mais importante.', name: 'João Baptista', role: 'COO · CoreLex' },
    { quote: 'Integrou com o nosso ERP sem dor de cabeça. A API é bem documentada e o suporte é excelente.', name: 'Pedro Nunes', role: 'CTO · Atlas Group' },
    { quote: 'Reduziu o nosso custo com retrabalho jurídico em 60%. ROI em menos de 2 meses.', name: 'Diana Torres', role: 'VP Financeira · Nova Capital' },
  ];

  const marqueeItems = ['Gestão de Contratos', 'Assinatura Digital', 'Compliance Automático', 'Alertas Inteligentes', 'Analytics em Tempo Real', 'Colaboração em Equipa', 'Fluxos de Aprovação', 'Auditoria Automática'];

  useEffect(() => {
    const timer = setInterval(() => setGalleryIndex(i => (i + 1) % 5), 4000);
    return () => clearInterval(timer);
  }, []);

  /* ── Mini contract card for hero ── */
  const HeroCard = () => (
    <div style={{ width: 300, background: '#fff', borderRadius: 0, padding: '22px', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: '1px solid #e8eaed' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 0, background: 'linear-gradient(135deg,#000000,#0d1117)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSignature size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>Contrato Ativo</div>
            <div style={{ fontSize: 10, color: '#8a919e', fontWeight: 500 }}>#2026-047 · Prestação</div>
          </div>
        </div>
        <div style={{ padding: '3px 10px', borderRadius: 0, background: '#f0f0f0', color: '#0d1117', fontSize: 10, fontWeight: 700, fontFamily: "'Poppins',sans-serif" }}>✓ Assinado</div>
      </div>
      <div style={{ padding: '14px', background: '#f7f9fb', borderRadius: 0, marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: '#8a919e', marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>VALOR DO CONTRATO</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0d1117', fontFamily: "'Poppins',sans-serif", letterSpacing: -1 }}>Kz 480.000</div>
        <div style={{ fontSize: 11, color: '#0d1117', fontWeight: 600, marginTop: 4 }}>↑ Activo até 31 dez 2026</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: '10px', background: '#f7f9fb', borderRadius: 0 }}>
          <div style={{ fontSize: 9, color: '#8a919e', fontWeight: 600, marginBottom: 3 }}>PARTES</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0d1117' }}>2 signatários</div>
        </div>
        <div style={{ flex: 1, padding: '10px', background: '#f7f9fb', borderRadius: 0 }}>
          <div style={{ fontSize: 9, color: '#8a919e', fontWeight: 600, marginBottom: 3 }}>RENOVAÇÃO</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>194 dias</div>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: '#8a919e', fontWeight: 600 }}>Progresso do ciclo</span>
          <span style={{ fontSize: 10, color: '#0d1117', fontWeight: 700 }}>73%</span>
        </div>
        <div style={{ height: 6, background: '#e8eaed', borderRadius: 0, overflow: 'hidden' }}>
          <div style={{ width: '73%', height: '100%', background: 'linear-gradient(90deg,#000000,#0d1117)', borderRadius: 0 }} />
        </div>
      </div>
    </div>
  );

  const BrandMark = ({ size = 'md' }: { size?: 'md' | 'sm' }) => {
    const logoH = size === 'sm' ? 34 : 40;
    const fontSize = size === 'sm' ? 21 : 25;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} aria-label="Agree">
        <img src={AgreeLogo} alt="" style={{ height: logoH, display: 'block' }} />
        <span style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize,
          fontWeight: 800,
          color: '#0d1117',
          letterSpacing: -0.5,
          lineHeight: 1,
          marginLeft: -2,
        }}>Agree</span>
      </div>
    );
  };

  const footerSections = [
    {
      title: 'Empresa',
      links: [
        { label: 'Sobre nós', href: '#sobre' },
        { label: 'A nossa missão', href: '#depoimentos' },
        { label: 'Blog', href: '#sobre' },
        { label: 'Carreiras', href: 'mailto:carreiras@agree.ao' },
        { label: 'Contacto', href: '#faq' },
      ],
    },
    {
      title: 'Plataforma',
      links: [
        { label: 'Funcionalidades', href: '#funcionalidades' },
        { label: 'Assinatura Digital', href: '#sobre' },
        { label: 'Analytics', href: '#funcionalidades' },
        { label: 'Integrações', href: '#faq' },
        { label: 'API', href: '#faq' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacidade', href: '#faq' },
        { label: 'Termos de Uso', href: '#faq' },
        { label: 'Cookies', href: '#faq' },
        { label: 'Compliance', href: '#funcionalidades' },
        { label: 'Segurança', href: '#faq' },
      ],
    },
  ];

  /* ── Alert pill ── */
  const AlertPill = ({ icon, text, color }: { icon: React.ReactNode, text: string, color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e8eaed', borderRadius: 0, padding: '8px 14px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', whiteSpace: 'nowrap' }}>
      <span style={{ color, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>{text}</span>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: '#f5f7f9', color: '#0d1117', overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; scroll-padding-top: 80px; }
        a { text-decoration: none; }

        :root {
          --accent: #0d1117;
          --accent-dark: #000000;
          --accent-light: #f0f0f0;
          --navy: #0d1117;
          --text: #0d1117;
          --muted: #6b7280;
          --border: #e2e5e9;
          --surface: #fff;
          --bg: #f5f7f9;
        }

        .nav-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(255, 255, 255, 0.65);
          border-bottom: 1px solid rgba(226, 229, 233, 0.7);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .nav-menu-mobile {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }

        .nav-link { font-size: 14px; font-weight: 500; color: #6b7280; transition: color .2s; font-family: 'Poppins', sans-serif; }
        .nav-link:hover { color: #0d1117; }

        .footer-link { font-size: 13px; color: #9ca3af; transition: color .2s; font-weight: 400; }
        .footer-link:hover { color: #0d1117; }

        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { display: flex; animation: marquee 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }

        @keyframes scroll-testi { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .testi-track { display:flex; gap:20px; animation:scroll-testi 40s linear infinite; }
        .testi-track:hover { animation-play-state:paused; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent); color: #fff; border: none; border-radius: 0;
          padding: 12px 24px; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all .2s; white-space: nowrap;
        }
        .btn-primary:hover { background: var(--accent-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(13,17,23,0.3); }

        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: var(--text);
          border: 1.5px solid var(--border); border-radius: 0;
          padding: 11px 22px; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all .2s; white-space: nowrap;
        }
        .btn-outline:hover { border-color: #b0b8c1; transform: translateY(-1px); }

        .btn-outline-teal {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: var(--accent);
          border: 1.5px solid var(--accent); border-radius: 0;
          padding: 11px 22px; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all .2s; white-space: nowrap;
        }
        .btn-outline-teal:hover { background: var(--accent-light); }

        .card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 0; transition: all .22s;
        }
        .card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.07); transform: translateY(-2px); }

        .faq-item { border-bottom: 1px solid var(--border); }
        .faq-btn {
          width:100%; background:none; border:none; color: var(--text);
          padding:20px 0; display:flex; justify-content:space-between;
          align-items:center; cursor:pointer; font-family:'Poppins',sans-serif;
          font-size:15px; font-weight:600; text-align:left; gap:14px;
        }
        .faq-btn:hover { color: var(--accent); }

        .input-f {
          width:100%; padding:12px 14px; font-size:14px;
          background:#f7f9fb; border:1.5px solid var(--border);
          border-radius: 0; color: var(--text); outline:none;
          font-family:'Poppins',sans-serif; transition:all .2s;
        }
        .input-f::placeholder { color:#b0b8c1; }
        .input-f:focus { border-color: var(--accent); background:#fff; }

        .tag { font-size:11px; font-weight:700; letter-spacing:2px; color:var(--accent); text-transform:uppercase; }

        .hero-h {
          font-family:'Poppins',sans-serif; font-size:clamp(38px,5vw,72px);
          font-weight:800; line-height:1.06; letter-spacing:-2px; color:#0d1117;
        }
        .section-h {
          font-family:'Poppins',sans-serif; font-size:clamp(28px,3.5vw,48px);
          font-weight:700; line-height:1.1; letter-spacing:-1px; color:#0d1117;
        }
        .testi-card {
          flex:0 0 300px; background:#fff; border:1px solid var(--border);
          border-radius: 0; padding:24px;
        }

        /* ── RESPONSIVE ── */
        @media(max-width:960px){
          .hero-grid{grid-template-columns:1fr!important;}
          .hero-right{display:none!important;}
          .sobre-grid{grid-template-columns:1fr!important; gap:40px!important;}
          .footer-grid{grid-template-columns:1fr 1fr!important; gap:28px!important;}
          .features-grid{grid-template-columns:1fr 1fr!important;}
          .steps-grid{grid-template-columns:1fr!important;}
          .plan-grid{grid-template-columns:1fr!important; max-width:340px; margin:0 auto;}
        }
        @media(max-width:640px){
          .hero-h{font-size:34px!important; letter-spacing:-1px;}
          .section-h{font-size:24px!important;}
          .nav-links{display:none!important;}
          .ham-btn{display:flex!important;}
          .hero-btns{flex-direction:column!important;}
          .hero-btns .btn-primary,.hero-btns .btn-outline{width:100%;justify-content:center;}
          .features-grid{grid-template-columns:1fr!important;}
          .footer-grid{grid-template-columns:1fr!important;}
          .stats-row{flex-direction:column!important; gap:16px!important;}
          .cta-dark{padding:48px 24px!important;}
          .testi-card{flex:0 0 260px!important;}
          .hero-pills{display:none!important;}
        }
        @media(max-width:480px){
          .hero-h{font-size:28px!important;}
          .section-h{font-size:22px!important;}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav-bar">
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandMark />

          {/* Links */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {['Sobre', 'Funcionalidades', 'Depoimentos', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="nav-link">{l}</a>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/login')} className="btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>Login</button>
            <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>Começar Agora ↗</button>
            <button className="ham-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              {menuOpen ? <X size={22} color="#0d1117" /> : <Menu size={22} color="#0d1117" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="nav-menu-mobile" style={{ padding: '14px 24px 22px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Sobre', 'Funcionalidades', 'Depoimentos', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, fontWeight: 600 }}>{l}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 100, paddingBottom: 80, background: '#fff', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle bg teal blob */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,17,23,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,17,23,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', minHeight: '76vh' }}>
            {/* Left */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#f0f0f0', borderRadius: 0, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#0d1117', marginBottom: 28, fontFamily: "'Poppins',sans-serif" }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0d1117' }} />
                Gestão de Contratos · Angola
              </div>

              <h1 className="hero-h" style={{ marginBottom: 22 }}>
                Gere contratos<br />
                <span style={{ color: '#0d1117' }}>com total</span><br />
                controlo.
              </h1>

              <p style={{ fontSize: 17, color: '#6b7280', lineHeight: 1.75, maxWidth: 430, marginBottom: 36, fontWeight: 400 }}>
                Do rascunho à assinatura digital. Visibilidade total, conformidade automática e zero prazos perdidos.
              </p>

              <div className="hero-btns" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 52 }}>
                <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '14px 28px', fontSize: 15 }}>
                  Acessar o Sistema <ArrowRight size={16} />
                </button>
                {/*<button className="btn-outline" style={{ padding: '14px 22px', fontSize: 15 }}>
                  Ver Demonstração <ArrowUpRight size={16} />
                </button>*/}
              </div>

              {/* Partner logos */}
              <div>
                <div style={{ fontSize: 11, color: '#b0b8c1', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16, fontWeight: 600 }}>Usado por equipas de</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
                  {['Jurídico', 'Financeiro', 'Operações', 'Compliance', 'Procurement'].map(t => (
                    <span key={t} style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>{t}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right — hero visual */}
            <motion.div className="hero-right" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15 }} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 520 }}>
              {/* Main contract card */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <HeroCard />
              </div>
              {/* Floating pills */}
              <div className="hero-pills" style={{ position: 'absolute', top: '10%', right: '-2%', zIndex: 3 }}>
                <AlertPill icon={<Bell size={13} />} text="3 contratos a vencer em 30 dias" color="#f59e0b" />
              </div>
              <div className="hero-pills" style={{ position: 'absolute', bottom: '14%', left: '-8%', zIndex: 3 }}>
                <AlertPill icon={<CheckCircle size={13} />} text="98% conformidade · Auditado" color="#0d1117" />
              </div>
              <div className="hero-pills" style={{ position: 'absolute', top: '38%', right: '-10%', zIndex: 3 }}>
                <AlertPill icon={<TrendingUp size={13} />} text="↑ 12 contratos esta semana" color="#6366f1" />
              </div>
              {/* Background card behind */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-58%,-48%) rotate(-5deg) scale(0.9)', zIndex: 1, opacity: 0.45 }}>
                <div style={{ width: 300, background: '#fff', borderRadius: 0, padding: '22px', border: '1px solid #e2e5e9' }}>
                  <div style={{ height: 8, borderRadius: 0, background: '#e8eaed', width: '80%', marginBottom: 10 }} />
                  <div style={{ height: 8, borderRadius: 0, background: '#e8eaed', width: '60%', marginBottom: 10 }} />
                  <div style={{ height: 8, borderRadius: 0, background: '#e8eaed', width: '70%' }} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ overflow: 'hidden', borderTop: '1px solid #e2e5e9', borderBottom: '1px solid #e2e5e9', padding: '14px 0', background: '#f5f7f9' }}>
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div key={i} style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <span style={{ padding: '0 24px', fontSize: 12, fontWeight: 600, color: '#9ca3af', letterSpacing: 1.8, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{item}</span>
              <span style={{ color: '#0d1117', fontSize: 14, opacity: 0.6 }}>·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── EXPERIENCE / SOBRE ── */}
      <section id="sobre" style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 72, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 340px' }}>
              <div className="tag" style={{ marginBottom: 14 }}>Gestão contratual</div>
              <h2 className="section-h">Experiência que<br />cresce com a<br />tua empresa.</h2>
            </div>
            <div style={{ flex: '1 1 340px', paddingTop: 8 }}>
              <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.8, marginBottom: 16, fontWeight: 400 }}>
                Desenha um sistema de gestão contratual que funciona para o teu negócio — e simplifica cada etapa do ciclo de vida do contrato.
              </p>
              <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.8, fontWeight: 400 }}>
                O Agree já gere mais de 10.000 contratos ativos para equipas jurídicas, financeiras e de operações em todo o país.
              </p>
            </div>
          </div>

          {/* 3 Feature cards */}
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { icon: <FileSignature size={22} />, title: 'Assinatura Digital', desc: 'Assine contratos com validade jurídica plena. ICP-Brasil e legislação angolana compliant. Sem impressoras.' },
              { icon: <Bell size={22} />, title: 'Alertas Automáticos', desc: 'Notificações inteligentes de vencimentos, renovações e revisões. Nunca mais perde um prazo importante.' },
              { icon: <Shield size={22} />, title: 'Compliance Total', desc: 'Auditoria automática, rastreabilidade completa e relatórios de conformidade gerados sem esforço.' },
            ].map((f, i) => (
              <div key={i} className="card" style={{ padding: '28px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 0, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d1117', marginBottom: 18 }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0d1117', marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, fontWeight: 400 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US / STATS ── */}
      <section id="funcionalidades" style={{ padding: '100px 24px', background: '#f5f7f9' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="tag" style={{ marginBottom: 14 }}>Por que nos escolhem</div>
            <h2 className="section-h">Por que preferem<br />o Agree</h2>
          </div>

          {/* Big stat cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Top-left: big number */}
            <div className="card" style={{ padding: '36px' }}>
              <div style={{ fontSize: 64, fontWeight: 800, color: '#0d1117', fontFamily: "'Poppins',sans-serif", lineHeight: 1, marginBottom: 12, letterSpacing: -3 }}>10k+</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0d1117', marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>Contratos activos</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 400 }}>geridos por empresas angolanas na plataforma</div>
            </div>

            {/* Top-right: instant access */}
            <div className="card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0d1117', marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>Acesso instantâneo<br />ao portfólio completo</div>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 400, lineHeight: 1.7 }}>Pesquisa, filtra e exporta qualquer contrato em segundos. Sem pastas de email.</div>
              </div>
              {/* Mini flow illustration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
                {[{ icon: <FileText size={16} />, label: 'Rascunho' }, { icon: <Users size={16} />, label: 'Aprovação' }, { icon: <CheckCircle size={16} />, label: 'Assinado' }].map((step, i) => (
                  <React.Fragment key={i}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 0, background: i === 2 ? 'linear-gradient(135deg,#000000,#0d1117)' : '#f5f5f5', border: i === 2 ? 'none' : '1.5px solid #0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 2 ? '#fff' : '#0d1117' }}>
                        {step.icon}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textAlign: 'center', letterSpacing: 0.3 }}>{step.label}</span>
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 1.5, background: '#0d1117', opacity: 0.4 }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Bottom-left: no volatility / zero prazos */}
            <div className="card" style={{ padding: '36px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0d1117', marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>Zero prazos<br />perdidos</div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 400, lineHeight: 1.7, marginBottom: 24 }}>
                Alertas automáticos de vencimentos e renovações. A tua equipa recebe a notificação certa, na hora certa.
              </div>
              {/* Mini chart mockup */}
              <div style={{ background: '#f7f9fb', borderRadius: 0, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0d1117' }}>Alertas enviados</span>
                  <span style={{ fontSize: 10, color: '#0d1117', fontWeight: 700, background: '#f0f0f0', padding: '2px 8px', borderRadius: 0 }}>↑ 6 meses</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 48 }}>
                  {[30, 50, 42, 70, 60, 85].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0', background: i === 5 ? 'linear-gradient(180deg,#0d1117,#000000)' : '#e2e5e9' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  {['Jan','Fev','Mar','Abr','Mai','Jun'].map(m => (
                    <span key={m} style={{ fontSize: 9, color: '#b0b8c1', fontWeight: 600 }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom-right: mini dashboard stats */}
            <div className="card" style={{ padding: '36px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0d1117', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Dashboard em tempo real</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0d1117', fontFamily: "'Poppins',sans-serif", marginBottom: 4, letterSpacing: -1 }}>Kz 12,4M</div>
              <div style={{ fontSize: 13, color: '#0d1117', fontWeight: 600, marginBottom: 20 }}>↑ valor total sob gestão</div>
              {[
                { label: 'Contratos activos', val: '847', pct: 100 },
                { label: 'Em negociação', val: '43', pct: 30 },
                { label: 'A vencer em 30d', val: '12', pct: 15, warn: true },
              ].map((row) => (
                <div key={row.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: row.warn ? '#d97706' : '#0d1117' }}>{row.val}</span>
                  </div>
                  <div style={{ height: 5, background: '#f0f0f0', borderRadius: 0, overflow: 'hidden' }}>
                    <div style={{ width: `${row.pct}%`, height: '100%', background: row.warn ? '#f59e0b' : 'linear-gradient(90deg,#000000,#0d1117)', borderRadius: 0 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DARK SECTION — HOW IT WORKS ── */}
      <section style={{ padding: '100px 24px', background: '#0d1117' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#0d1117', textTransform: 'uppercase', marginBottom: 14 }}>PASSO A PASSO</div>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(26px,3.2vw,44px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, maxWidth: 560, letterSpacing: -0.8 }}>
              Gere o ciclo completo com uma solução que simplifica.
            </h2>
          </div>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
            {[
              { n: '1', title: 'Cria o contrato', desc: 'Usa templates pré-aprovados ou começa do zero. A IA sugere cláusulas e extrai dados automaticamente de documentos importados.' },
              { n: '2', title: 'Aprova e assina', desc: 'Fluxos de aprovação personalizáveis. Assinatura eletrônica com validade jurídica. Notificações em tempo real para todos os signatários.' },
              { n: '3', title: 'Monitoriza e renova', desc: 'Alertas de vencimento automáticos. Dashboards de portfólio. Relatórios de compliance gerados sem esforço adicional.' },
            ].map(s => (
              <div key={s.n}>
                <div style={{ fontSize: 52, fontWeight: 900, color: 'rgba(13,17,23,0.25)', fontFamily: "'Poppins',sans-serif", lineHeight: 1, marginBottom: 18, letterSpacing: -2 }}>{s.n}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10, fontFamily: "'Poppins',sans-serif" }}>{s.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, fontWeight: 400 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION / TESTIMONIALS ── */}
      <section id="depoimentos" style={{ padding: '100px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', marginBottom: 56 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="tag" style={{ marginBottom: 14 }}>A nossa missão</div>
            <h2 className="section-h">Ajudámos empresas<br />inovadoras a crescer</h2>
            <p style={{ fontSize: 16, color: '#6b7280', marginTop: 16, maxWidth: 460, margin: '16px auto 0', fontWeight: 400, lineHeight: 1.7 }}>
              Centenas de empresas em Angola e além-fronteiras já fizeram grandes melhorias com o Agree.
            </p>
          </div>
          {/* Stats row */}
          <div className="stats-row" style={{ display: 'flex', justifyContent: 'center', gap: 60, marginTop: 52, flexWrap: 'wrap' }}>
            {[['10k+', 'Contratos geridos'], ['500+', 'Empresas clientes'], ['98%', 'Taxa de renovação']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 44, fontWeight: 800, color: '#0d1117', fontFamily: "'Poppins',sans-serif", letterSpacing: -2, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Scrolling testimonials */}
        <div style={{ overflow: 'hidden', width: '100%' }}>
          <div className="testi-track" style={{ width: 'max-content', paddingLeft: 24 }}>
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="testi-card">
                <div style={{ fontSize: 32, color: '#e2e5e9', fontFamily: 'serif', marginBottom: 12, lineHeight: 1 }}>"</div>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.78, marginBottom: 20, fontWeight: 400, fontStyle: 'italic' }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#000000,#0d1117)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0d1117' }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400, marginTop: 1 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section style={{ padding: '100px 24px', background: '#f5f7f9' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="tag" style={{ marginBottom: 14 }}>Escolhe o teu plano</div>
            <h2 className="section-h">Simples e transparente</h2>
          </div>
          <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

            {/* Free */}
            <div className="card" style={{ padding: '32px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', fontFamily: "'Poppins',sans-serif", marginBottom: 6 }}>Free</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0d1117', fontFamily: "'Poppins',sans-serif", marginBottom: 4, letterSpacing: -1 }}>Kz 0<span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>/mês</span></div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24, fontWeight: 400 }}>Para testar a plataforma</div>
              {[
                '3 contratos ativos',
                '1 colaborador por contrato',
                '3 templates básicos',
                '3 versões por contrato',
                '5 MB de armazenamento',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <CheckCircle size={14} color="#0d1117" />
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 400 }}>{f}</span>
                </div>
              ))}
              <button className="btn-outline-teal" onClick={() => { sessionStorage.setItem('openCheckoutOnLogin', 'free'); navigate('/login'); }} style={{ width: '100%', justifyContent: 'space-between', marginTop: 24 }}>
                Começar grátis <ArrowUpRight size={15} />
              </button>
            </div>

            {/* Pro — highlighted */}
            <div style={{ background: 'linear-gradient(145deg,#0d1117,#000000)', border: '1.5px solid #000000', borderRadius: 0, padding: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(13,17,23,0.2),transparent 70%)' }} />
              <div style={{ display: 'inline-block', background: '#0d1117', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 0, marginBottom: 14, letterSpacing: 0.5 }}>MAIS POPULAR</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Poppins',sans-serif", marginBottom: 6 }}>Pro</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: "'Poppins',sans-serif", marginBottom: 4, letterSpacing: -1 }}>Kz 39.900<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>/mês</span></div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontWeight: 400 }}>Para profissionais e PMEs</div>
              {[
                'Até 50 contratos',
                '5 colaboradores por contrato',
                'Assinatura digital',
                'Analytics e relatórios',
                'Negociação de cláusulas',
                'Geração com IA',
                'Templates ilimitados',
                '50 versões por contrato',
                '50 MB de armazenamento',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <CheckCircle size={14} color="#0d1117" />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>{f}</span>
                </div>
              ))}
              <button className="btn-primary" onClick={() => { sessionStorage.setItem('openCheckoutOnLogin', 'pro'); navigate('/login'); }} style={{ width: '100%', justifyContent: 'space-between', marginTop: 24 }}>
                Começar agora <ArrowUpRight size={15} />
              </button>
            </div>

            {/* Enterprise */}
            <div className="card" style={{ padding: '32px', border: '1.5px solid #e5e7eb' }}>
              <div style={{ display: 'inline-block', background: '#e5e7eb', color: '#0d1117', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 0, marginBottom: 14, letterSpacing: 0.5 }}>SOB CONSULTA</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0d1117', fontFamily: "'Poppins',sans-serif", marginBottom: 6 }}>Enterprise</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0d1117', fontFamily: "'Poppins',sans-serif", marginBottom: 4, letterSpacing: -1 }}>Kz 99.900<span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>/mês</span></div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24, fontWeight: 400 }}>Para empresas e grandes equipas</div>
              {[
                'Contratos ilimitados',
                'Colaboradores ilimitados',
                'Tudo do Pro',
                '500 MB de armazenamento',
                'Versões ilimitadas',
                'Suporte prioritário 24/7',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <CheckCircle size={14} color="#0d1117" />
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 400 }}>{f}</span>
                </div>
              ))}
              <button className="btn-outline-teal" onClick={() => { sessionStorage.setItem('openCheckoutOnLogin', 'enterprise'); navigate('/login'); }} style={{ width: '100%', justifyContent: 'space-between', marginTop: 24 }}>
                Falar com vendas <ArrowUpRight size={15} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="tag" style={{ marginBottom: 14 }}>Perguntas frequentes</div>
            <h2 className="section-h">Tens dúvidas?</h2>
            <p style={{ fontSize: 15, color: '#6b7280', marginTop: 14, fontWeight: 400 }}>Tudo o que precisas de saber sobre o Agree numa só página.</p>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span style={{ color: openFaq === i ? '#0d1117' : '#0d1117' }}>
                  <span style={{ color: openFaq === i ? '#0d1117' : '#b0b8c1', fontWeight: 800, fontSize: 13, marginRight: 12 }}>0{i + 1}</span>
                  {faq.q}
                </span>
                {openFaq === i
                  ? <ChevronUp size={17} color="#0d1117" style={{ flexShrink: 0 }} />
                  : <ChevronDown size={17} color="#b0b8c1" style={{ flexShrink: 0 }} />}
              </button>
              {openFaq === i && (
                <div style={{ overflow: 'hidden', paddingBottom: 22, paddingLeft: 36 }}>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.82, fontWeight: 400 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop: 44, textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: '#9ca3af', marginBottom: 14, fontWeight: 400 }}>Ainda tens dúvidas?</div>
            <button className="btn-outline" style={{ padding: '11px 24px' }}>Fala connosco</button>
          </div>
        </div>
      </section>

      {/* ── CTA DARK ── */}
      <section style={{ padding: '80px 24px', background: '#f5f7f9' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div className="cta-dark" style={{ background: '#0d1117', borderRadius: 0, padding: '72px 64px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(13,17,23,0.14),transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 32 }}>
                <div style={{ flex: '1 1 400px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#0d1117', textTransform: 'uppercase', marginBottom: 18 }}>Pronto para começar?</div>
                  <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 16, letterSpacing: -0.8 }}>
                    Eleva o teu processo<br />de gestão contratual
                  </h2>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: 400, fontWeight: 400 }}>
                    Suporta pequenas e grandes equipas com gestão inteligente de contratos, assinatura digital e ferramentas de compliance.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
                  <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '15px 32px', fontSize: 15 }}>
                    Começar Agora <ArrowRight size={16} />
                  </button>
                  {/*<button onClick={() => {}} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'Poppins',sans-serif", justifyContent: 'center' }}>
                    Saber mais <ArrowUpRight size={15} />
                  </button>*/}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e2e5e9', padding: '64px 24px 36px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', gap: 44, marginBottom: 52 }}>
            <div>
              <div style={{ marginBottom: 16 }}>
                <BrandMark size="sm" />
              </div>
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.78, maxWidth: 260, fontWeight: 400 }}>
                Startup angolana focada em gestão contratual inteligente, inovação e compliance digital.
              </p>
              <div style={{ marginTop: 12, fontSize: 12, color: '#b0b8c1', fontWeight: 50 }}>Angola · Est. 2024</div>
            </div>
            {footerSections.map(section => (
              <div key={section.title}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>{section.title}</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {section.links.map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="footer-link">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #e2e5e9', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#b0b8c1', fontWeight: 400 }}>© 2026 Agree. Todos os direitos reservados.</span>
            <span style={{ fontSize: 12, color: '#b0b8c1', fontWeight: 400 }}>Feito com <span style={{ color: '#0d1117' }}>♥</span> em Angola</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
