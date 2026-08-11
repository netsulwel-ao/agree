import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, X, Menu, LogIn,
  ChevronDown, ChevronUp, Shield,
  Bell, Users, BarChart3, Zap, CheckCircle,
  FileSignature, TrendingUp, Clock, FileText
} from 'lucide-react';
import AgreeLogo from '../Agree-logo.svg';
import { useNavigate, Link } from 'react-router-dom';

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.08 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const heroLine: Variants = {
  hidden: { y: '115%' },
  show: { y: '0%', transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const CountUp = ({ to, format = (v: number) => String(v), duration = 1.8, style }: { to: number; format?: (v: number) => string; duration?: number; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return <div ref={ref} style={style}>{format(val)}</div>;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const faqs = [
    { q: 'Como funciona o processo de criação de contratos?', a: 'Crie contratos a partir de templates pré-aprovados ou do zero. O Agree guia-te por cada cláusula, sugere linguagem padrão e envia automaticamente para aprovação e assinatura — tudo dentro da plataforma, sem email.' },
    { q: 'A assinatura eletrônica tem validade jurídica?', a: 'Sim. Todas as assinaturas são criptografadas, carimbadas com data/hora e armazenadas com trilha de auditoria completa, seguindo os padrões da ICP-Brasil e legislação angolana de documentos digitais.' },
    { q: 'Posso importar contratos que já existem?', a: 'Sim. Importa contratos em PDF ou Word. O Agree extrai automaticamente as partes, datas e valores principais usando IA, e organiza tudo no teu portfólio em segundos.' },
    { q: 'Como funciona o controlo de acessos?', a: 'Definis permissões por utilizador, equipa ou departamento. O jurídico vê tudo, o financeiro vê apenas os contratos com impacto orçamental, e assim por diante — controlo granular e sem complicação.' },
    { q: 'Existe integração com outros sistemas?', a: 'O Agree integra com os principais ERPs (SAP, TOTVS, Oracle), ferramentas de assinatura (DocuSign, ClickSign) e plataformas de comunicação (Slack, Teams). API REST documentada para integrações customizadas.' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setGalleryIndex(i => (i + 1) % 5), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const HeroCard = () => (
    <div style={{ width: 440, background: '#fff', borderRadius: 0, padding: '32px', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: '1px solid #e8eaed' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 0, background: 'linear-gradient(135deg,#000000,#0d1117)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSignature size={26} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>Contrato Ativo</div>
            <div style={{ fontSize: 13, color: '#8a919e', fontWeight: 500 }}>#2026-047 · Prestação</div>
          </div>
        </div>
        <div style={{ padding: '5px 14px', borderRadius: 0, background: '#f0f0f0', color: '#0d1117', fontSize: 13, fontWeight: 700, fontFamily: "'Poppins',sans-serif" }}>✓ Assinado</div>
      </div>
      <div style={{ padding: '22px', background: '#f7f9fb', borderRadius: 0, marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: '#8a919e', marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>VALOR DO CONTRATO</div>
        <div style={{ fontSize: 42, fontWeight: 800, color: '#0d1117', fontFamily: "'Poppins',sans-serif", letterSpacing: -1 }}>Kz 480.000</div>
        <div style={{ fontSize: 15, color: '#0d1117', fontWeight: 600, marginTop: 6 }}>↑ Activo até 31 dez 2026</div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, padding: '16px', background: '#f7f9fb', borderRadius: 0 }}>
          <div style={{ fontSize: 11, color: '#8a919e', fontWeight: 600, marginBottom: 5 }}>PARTES</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0d1117' }}>2 signatários</div>
        </div>
        <div style={{ flex: 1, padding: '16px', background: '#f7f9fb', borderRadius: 0 }}>
          <div style={{ fontSize: 11, color: '#8a919e', fontWeight: 600, marginBottom: 5 }}>RENOVAÇÃO</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#d97706' }}>194 dias</div>
        </div>
      </div>
      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: '#8a919e', fontWeight: 600 }}>Progresso do ciclo</span>
          <span style={{ fontSize: 14, color: '#0d1117', fontWeight: 700 }}>73%</span>
        </div>
        <div style={{ height: 9, background: '#e8eaed', borderRadius: 0, overflow: 'hidden' }}>
          <div style={{ width: '73%', height: '100%', background: 'linear-gradient(90deg,#000000,#0d1117)', borderRadius: 0 }} />
        </div>
      </div>
    </div>
  );

  const BrandMark = ({ size = 'md' }: { size?: 'md' | 'sm' | 'lg' }) => {
    const logoH = size === 'sm' ? 34 : size === 'lg' ? 52 : 40;
    const fontSize = size === 'sm' ? 21 : size === 'lg' ? 32 : 25;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} aria-label="Agree">
        <img src={AgreeLogo} alt="" style={{ height: logoH, display: 'block' }} />
        <span className="sheen-text" style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize,
          fontWeight: 800,
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
        { label: 'Funcionalidades', href: '#funcionalidades' },
        { label: 'Planos', href: '#planos' },
        { label: 'FAQ', href: '#faq' },
      ],
    },
    {
      title: 'Plataforma',
      links: [
        { label: 'Funcionalidades', href: '#funcionalidades' },
        { label: 'Assinatura Digital', href: '#funcionalidades' },
        { label: 'Painel em tempo real', href: '#funcionalidades' },
        { label: 'Preços', href: '#planos' },
      ],
    },
    {
      title: 'Apoio',
      links: [
        { label: 'Perguntas frequentes', href: '#faq' },
        { label: 'Fala connosco', href: 'mailto:hello@agree.ao' },
      ],
    },
  ];

  const AlertPill = ({ icon, text, color }: { icon: React.ReactNode, text: string, color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: '1px solid #e8eaed', borderRadius: 0, padding: '13px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', whiteSpace: 'nowrap' }}>
      <span style={{ color, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 16, fontWeight: 600, color: '#0d1117', fontFamily: "'Poppins',sans-serif" }}>{text}</span>
    </div>
  );

  return (
    <div className="page-mesh" style={{ fontFamily: "'Poppins', sans-serif", color: '#0d1117', overflowX: 'hidden', minHeight: '100vh' }}>
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
          background: transparent;
          transition: background .25s ease, border-bottom-color .25s ease, backdrop-filter .25s ease;
        }
        .nav-bar.scrolled {
          background-color: rgba(255, 255, 255, 0.65);
          background-image:
            radial-gradient(55% 140% at 50% 0%, rgba(13,17,23,0.055) 0%, transparent 70%),
            radial-gradient(40% 150% at 12% 100%, rgba(13,17,23,0.08) 0%, transparent 72%),
            radial-gradient(45% 150% at 90% 100%, rgba(0,0,0,0.07) 0%, transparent 72%);
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

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent); color: #fff; border: none;
          padding: 12px 24px; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all .2s; white-space: nowrap;
        }
        .btn-primary:hover { background: var(--accent-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(13,17,23,0.3); }

        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: var(--text);
          border: 1.5px solid var(--border);
          padding: 11px 22px; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all .2s; white-space: nowrap;
        }
        .btn-outline:hover { border-color: #b0b8c1; transform: translateY(-1px); }

        .btn-outline-teal {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: var(--accent);
          border: 1.5px solid var(--accent);
          padding: 11px 22px; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all .2s; white-space: nowrap;
        }
        .btn-outline-teal:hover { background: var(--accent-light); }

        .card {
          background: var(--surface); border: 1px solid var(--border);
          transition: all .22s;
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
          color: var(--text); outline:none;
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

        .page-mesh {
          background-color:#f5f7f9;
          background-image:
            radial-gradient(40% 45% at 50% 12%, rgba(13,17,23,0.06) 0%, transparent 66%),
            radial-gradient(32% 38% at 8% 28%, rgba(13,17,23,0.075) 0%, transparent 66%),
            radial-gradient(34% 40% at 93% 34%, rgba(0,0,0,0.065) 0%, transparent 66%),
            radial-gradient(38% 44% at 88% 62%, rgba(13,17,23,0.07) 0%, transparent 66%),
            radial-gradient(34% 40% at 10% 74%, rgba(0,0,0,0.06) 0%, transparent 66%),
            radial-gradient(40% 46% at 55% 90%, rgba(13,17,23,0.075) 0%, transparent 66%);
          background-attachment: fixed;
        }
        .mesh-dark {
          background-color:#0d1117;
          background-image:
            radial-gradient(50% 58% at 50% 36%, rgba(255,255,255,0.09) 0%, transparent 64%),
            radial-gradient(38% 46% at 8% 12%, rgba(0,0,0,0.55) 0%, transparent 66%),
            radial-gradient(42% 48% at 92% 8%, rgba(0,0,0,0.50) 0%, transparent 66%),
            radial-gradient(40% 52% at 90% 90%, rgba(255,255,255,0.055) 0%, transparent 62%),
            radial-gradient(46% 54% at 10% 88%, rgba(0,0,0,0.55) 0%, transparent 66%);
        }

        .sheen-text, .section-h, .tag {
          background-image: linear-gradient(115deg, #0d1117 30%, #46505d 50%, #0d1117 70%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        @media(max-width:960px){
          .hero-grid{grid-template-columns:1fr!important;}
          .hero-right{display:none!important;}
          .sobre-grid{grid-template-columns:1fr!important; gap:40px!important;}
          .footer-grid{grid-template-columns:1fr 1fr!important; gap:28px!important;}
          .features-grid{grid-template-columns:1fr 1fr!important;}
          .steps-grid{grid-template-columns:1fr!important;}
          .plan-grid{grid-template-columns:1fr!important; max-width:480px; margin:0 auto;}
        }
        @media(max-width:640px){
          .hero-h{font-size:34px!important; letter-spacing:-1px;}
          .section-h{font-size:24px!important;}
          .nav-links{display:none!important;}
          .nav-cta{display:none!important;}
          .ham-btn{display:flex!important;}
          .hero-btns{flex-direction:column!important;}
          .hero-btns .btn-primary,.hero-btns .btn-outline{width:100%;justify-content:center;}
          .features-grid{grid-template-columns:1fr!important;}
          .func-grid{grid-template-columns:1fr!important;}
          .footer-grid{grid-template-columns:1fr!important;}
          .stats-row{flex-direction:column!important; gap:16px!important;}
          .cta-dark{padding:48px 24px!important;}
          .hero-pills{display:none!important;}
        }
        @media(max-width:480px){
          .hero-h{font-size:28px!important;}
          .section-h{font-size:22px!important;}
        }
      `}</style>

      <nav className={`nav-bar${scrolled ? ' scrolled' : ''}`}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandMark />

          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {['Sobre', 'Funcionalidades', 'Planos', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="nav-link">{l}</a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => navigate('/login')} className="btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>Login</button>
              <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>Começar Agora ↗</button>
            </div>
            <button className="ham-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              {menuOpen ? <X size={22} color="#0d1117" /> : <Menu size={22} color="#0d1117" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="nav-menu-mobile" style={{ padding: '14px 24px 22px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Sobre', 'Funcionalidades', 'Planos', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, fontWeight: 600 }}>{l}</a>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button onClick={() => navigate('/login')} className="btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }}>Login</button>
              <button onClick={() => navigate('/login')} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }}>Começar Agora ↗</button>
            </div>
          </div>
        )}
      </nav>

      <section style={{ paddingTop: 100, paddingBottom: 80, position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', minHeight: '76vh' }}>
            <motion.div variants={heroContainer} initial="hidden" animate="show">
              <motion.div variants={heroItem} style={{ marginBottom: 20 }}>
                <span style={{ display: 'inline-block', padding: '7px 16px', border: '1px solid #e8eaed', background: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: '#0d1117', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  Plataforma de Gestão de Contratos
                </span>
              </motion.div>

              <motion.h1 className="hero-h" variants={heroItem} style={{ marginBottom: 22 }}>
                <span style={{ display: 'block', overflow: 'hidden' }}><motion.span variants={heroLine} className="sheen-text" style={{ display: 'block' }}>O fim das</motion.span></span>
                <span style={{ display: 'block', overflow: 'hidden' }}><motion.span variants={heroLine} className="sheen-text" style={{ display: 'block' }}>pastas de</motion.span></span>
                <span style={{ display: 'block', overflow: 'hidden' }}><motion.span variants={heroLine} style={{ display: 'block', WebkitTextStroke: '2px #0d1117', color: 'transparent' }}>email.</motion.span></span>
              </motion.h1>

              <motion.p variants={heroItem} className="sheen-text" style={{ fontSize: 17, lineHeight: 1.75, maxWidth: 430, marginBottom: 36, fontWeight: 400 }}>
                O Agree é a plataforma de gestão de contratos que centraliza o teu portfólio,
                automatiza aprovações, assinatura digital e nunca mais perdes um prazo de renovação.
              </motion.p>

              <motion.div variants={heroItem} className="hero-btns" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 52 }}>
                <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '14px 28px', fontSize: 15 }}>
                  Acessar o Sistema <ArrowRight size={16} />
                </button>
                {/*<button className="btn-outline" style={{ padding: '14px 22px', fontSize: 15 }}>
                  Ver Demonstração <ArrowUpRight size={16} />
                </button>*/}
              </motion.div>

              <motion.div variants={heroItem}>
                <div className="sheen-text" style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16, fontWeight: 600 }}>Usado por equipas de</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
                  {['Jurídico', 'Financeiro', 'Operações', 'Compliance', 'Procurement'].map(t => (
                    <span key={t} className="sheen-text" style={{ fontSize: 13, fontWeight: 700 }}>{t}</span>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            <motion.div className="hero-right" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 620 }}>
              <motion.div initial={{ opacity: 0, y: 44, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 16, delay: 0.5 }} style={{ position: 'relative', zIndex: 2 }}>
                <HeroCard />
              </motion.div>
              <motion.div className="hero-pills" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 17, delay: 0.85 }} style={{ position: 'absolute', top: '6%', right: '-4%', zIndex: 3 }}>
                <motion.div animate={{ y: [0, -9, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}>
                  <AlertPill icon={<Bell size={20} />} text="3 contratos a vencer em 30 dias" color="#f59e0b" />
                </motion.div>
              </motion.div>
              <motion.div className="hero-pills" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 17, delay: 1 }} style={{ position: 'absolute', bottom: '12%', left: '-10%', zIndex: 3 }}>
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                  <AlertPill icon={<CheckCircle size={20} />} text="98% conformidade · Auditado" color="#0d1117" />
                </motion.div>
              </motion.div>
              <motion.div className="hero-pills" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 17, delay: 1.15 }} style={{ position: 'absolute', top: '34%', right: '-12%', zIndex: 3 }}>
                <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}>
                  <AlertPill icon={<TrendingUp size={20} />} text="↑ 12 contratos esta semana" color="#6366f1" />
                </motion.div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ duration: 0.9, delay: 0.7 }} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-58%,-48%) rotate(-5deg) scale(0.9)', zIndex: 1 }}>
                <div style={{ width: 440, background: '#fff', borderRadius: 0, padding: '32px', border: '1px solid #e2e5e9' }}>
                  <div style={{ height: 12, borderRadius: 0, background: '#e8eaed', width: '80%', marginBottom: 14 }} />
                  <div style={{ height: 12, borderRadius: 0, background: '#e8eaed', width: '60%', marginBottom: 14 }} />
                  <div style={{ height: 12, borderRadius: 0, background: '#e8eaed', width: '70%' }} />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="sobre" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 72, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 340px' }}>
              <div className="tag" style={{ marginBottom: 14 }}>Gestão contratual</div>
              <h2 className="section-h">Experiência que<br />cresce com a<br />tua empresa.</h2>
            </div>
            <div style={{ flex: '1 1 340px', paddingTop: 8 }}>
              <p className="sheen-text" style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 16, fontWeight: 400 }}>
                Desenha um sistema de gestão contratual que funciona para o teu negócio — e simplifica cada etapa do ciclo de vida do contrato.
              </p>
              <p className="sheen-text" style={{ fontSize: 16, lineHeight: 1.8, fontWeight: 400 }}>
                O Agree já gere mais de 100 contratos ativos para equipas jurídicas, financeiras e de operações em todo o país.
              </p>
            </div>
          </motion.div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { icon: <FileSignature size={22} />, title: 'Assinatura Digital', desc: 'Assine contratos com validade jurídica plena, conforme a legislação angolana de documentos digitais. Sem impressoras.' },
              { icon: <Bell size={22} />, title: 'Alertas Automáticos', desc: 'Notificações inteligentes de vencimentos, renovações e revisões. Nunca mais perde um prazo importante.' },
              { icon: <Shield size={22} />, title: 'Compliance Total', desc: 'Auditoria automática, rastreabilidade completa e relatórios de conformidade gerados sem esforço.' },
            ].map((f, i) => (
              <motion.div key={i} className="card" initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }} style={{ padding: '28px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 0, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d1117', marginBottom: 18 }}>
                  {f.icon}
                </div>
                <div className="sheen-text" style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>{f.title}</div>
                <div className="sheen-text" style={{ fontSize: 13, lineHeight: 1.7, fontWeight: 400 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="funcionalidades" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="tag" style={{ marginBottom: 14 }}>Por que nos escolhem</div>
            <h2 className="section-h">Por que preferem<br />o Agree</h2>
          </motion.div>

          <div className="func-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <motion.div className="card" initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }} style={{ padding: '36px' }}>
              <CountUp to={100} duration={1.8} style={{ fontSize: 64, fontWeight: 800, fontFamily: "'Poppins',sans-serif", lineHeight: 1, marginBottom: 12, letterSpacing: -3, WebkitTextStroke: '2.5px #0d1117', color: 'transparent' }} />
              <div className="sheen-text" style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, fontFamily: "'Poppins',sans-serif" }}>Contratos activos</div>
              <div className="sheen-text" style={{ fontSize: 14, fontWeight: 400 }}>geridos por empresas angolanas na plataforma</div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="sheen-text" style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>Acesso instantâneo<br />ao portfólio completo</div>
                <div className="sheen-text" style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.7 }}>Pesquisa, filtra e exporta qualquer contrato em segundos. Sem pastas de email.</div>
              </div>
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
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }} style={{ padding: '36px' }}>
              <div className="sheen-text" style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>Zero prazos<br />perdidos</div>
              <div className="sheen-text" style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.7, marginBottom: 24 }}>
                Alertas automáticos de vencimentos e renovações. A tua equipa recebe a notificação certa, na hora certa.
              </div>
              <div style={{ background: '#f7f9fb', borderRadius: 0, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="sheen-text" style={{ fontSize: 11, fontWeight: 700 }}>Alertas enviados</span>
                  <span className="sheen-text" style={{ fontSize: 10, fontWeight: 700, background: '#f0f0f0', padding: '2px 8px', borderRadius: 0 }}>↑ 6 meses</span>
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
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }} style={{ padding: '36px' }}>
              <div className="sheen-text" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Painel em tempo real</div>
              <CountUp to={500} duration={2} format={(v) => `Kz ${v} mil`} style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Poppins',sans-serif", marginBottom: 4, letterSpacing: -1, WebkitTextStroke: '1.5px #0d1117', color: 'transparent' }} />
              <div className="sheen-text" style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>↑ valor total sob gestão</div>
              {[
                { label: 'Contratos activos', val: '847', pct: 100 },
                { label: 'Em negociação', val: '43', pct: 30 },
                { label: 'A vencer em 30d', val: '12', pct: 15, warn: true },
              ].map((row) => (
                <div key={row.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="sheen-text" style={{ fontSize: 12, fontWeight: 500 }}>{row.label}</span>
                    <span className="sheen-text" style={{ fontSize: 12, fontWeight: 700 }}>{row.val}</span>
                  </div>
                  <div style={{ height: 5, background: '#f0f0f0', borderRadius: 0, overflow: 'hidden' }}>
                    <div style={{ width: `${row.pct}%`, height: '100%', background: row.warn ? '#f59e0b' : 'linear-gradient(90deg,#000000,#0d1117)', borderRadius: 0 }} />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mesh-dark" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
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
              { n: '3', title: 'Monitoriza e renova', desc: 'Alertas de vencimento automáticos. Painéis de portfólio. Relatórios de compliance gerados sem esforço adicional.' },
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

      <section id="planos" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="tag" style={{ marginBottom: 14 }}>Escolhe o teu plano</div>
            <h2 className="section-h">O plano certo para cada fase da tua empresa</h2>
          </motion.div>
          <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

            <motion.div className="card" initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }} style={{ padding: '32px' }}>
              <div className="sheen-text" style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Poppins',sans-serif", marginBottom: 6 }}>Free</div>
              <div className="sheen-text" style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Poppins',sans-serif", marginBottom: 4, letterSpacing: -1 }}>Kz 0<span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>/mês</span></div>
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
                  <span className="sheen-text" style={{ fontSize: 13, fontWeight: 400 }}>{f}</span>
                </div>
              ))}
              <button className="btn-outline-teal" onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'space-between', marginTop: 24 }}>
                Começar grátis <ArrowUpRight size={15} />
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} style={{ background: 'linear-gradient(160deg,#0d1117 0%,#000000 60%)', border: '1.5px solid #000000', borderRadius: 0, padding: '34px 32px', position: 'relative', overflow: 'hidden', zIndex: 2, transform: 'translateY(-18px) scale(1.045)', boxShadow: '0 -12px 30px -18px rgba(0,0,0,0.4), 0 0 90px -30px rgba(0,0,0,0.4), 0 70px 100px -28px rgba(0,0,0,0.7), 0 38px 55px -22px rgba(0,0,0,0.5), 0 16px 26px -12px rgba(0,0,0,0.38)' }}>
              <div style={{ position: 'absolute', top: 8, left: 8, width: 16, height: 16, borderTop: '1.5px solid rgba(255,255,255,0.6)', borderLeft: '1.5px solid rgba(255,255,255,0.6)' }} />
              <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderTop: '1.5px solid rgba(255,255,255,0.6)', borderRight: '1.5px solid rgba(255,255,255,0.6)' }} />
              <div style={{ position: 'absolute', bottom: 8, left: 8, width: 16, height: 16, borderBottom: '1.5px solid rgba(255,255,255,0.6)', borderLeft: '1.5px solid rgba(255,255,255,0.6)' }} />
              <div style={{ position: 'absolute', bottom: 8, right: 8, width: 16, height: 16, borderBottom: '1.5px solid rgba(255,255,255,0.6)', borderRight: '1.5px solid rgba(255,255,255,0.6)' }} />
              <div style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, border: '1px dashed rgba(255,255,255,0.16)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -90, left: -90, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,rgba(13,17,23,0.55),transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'inline-block', background: '#fff', color: '#000000', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 0, marginBottom: 14, letterSpacing: 1 }}>✦ MAIS POPULAR</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Poppins',sans-serif", marginBottom: 6 }}>Pro</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', fontFamily: "'Poppins',sans-serif", marginBottom: 4, letterSpacing: -2, textShadow: '0 0 5px rgba(255,255,255,0.95), 0 0 16px rgba(255,255,255,0.65), 0 0 40px rgba(255,255,255,0.4), 0 0 90px rgba(255,255,255,0.2)' }}>Kz 39.900<span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>/mês</span></div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 400 }}>Para profissionais e PMEs</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 22px' }}>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3))' }} />
                <div style={{ width: 7, height: 7, background: '#fff', transform: 'rotate(45deg)', opacity: 0.8 }} />
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(255,255,255,0.3),transparent)' }} />
              </div>
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
              ].map((f, idx) => (
                <div key={f}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0' }}>
                    <CheckCircle size={14} color="#fff" />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>{f}</span>
                  </div>
                  {idx < 8 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginLeft: 22 }} />}
                </div>
              ))}
              <button className="btn-primary" onClick={() => { sessionStorage.setItem('openCheckoutOnLogin', 'pro'); navigate('/login'); }} style={{ width: '100%', justifyContent: 'space-between', marginTop: 26, background: '#fff', color: '#000000' }}>
                Começar agora <ArrowUpRight size={15} />
              </button>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }} style={{ padding: '32px', border: '1.5px solid #e5e7eb' }}>
              <div style={{ display: 'inline-block', background: '#e5e7eb', color: '#0d1117', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 0, marginBottom: 14, letterSpacing: 0.5 }}>SOB CONSULTA</div>
              <div className="sheen-text" style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Poppins',sans-serif", marginBottom: 6 }}>Enterprise</div>
              <div className="sheen-text" style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Poppins',sans-serif", marginBottom: 4, letterSpacing: -1 }}>Kz 99.900<span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>/mês</span></div>
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
                  <span className="sheen-text" style={{ fontSize: 13, fontWeight: 400 }}>{f}</span>
                </div>
              ))}
              <button className="btn-outline-teal" onClick={() => { sessionStorage.setItem('openCheckoutOnLogin', 'enterprise'); navigate('/login'); }} style={{ width: '100%', justifyContent: 'space-between', marginTop: 24 }}>
                Falar com vendas <ArrowUpRight size={15} />
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      <section id="faq" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="tag" style={{ marginBottom: 14 }}>Perguntas frequentes</div>
            <h2 className="section-h">Tens dúvidas?</h2>
            <p className="sheen-text" style={{ fontSize: 15, marginTop: 14, fontWeight: 400 }}>Tudo o que precisas de saber sobre o Agree numa só página.</p>
          </motion.div>
          {faqs.map((faq, i) => (
            <motion.div key={i} className="faq-item" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}>
              <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span className="sheen-text" style={{ color: openFaq === i ? '#0d1117' : '#0d1117' }}>
                  <span style={{ color: openFaq === i ? '#0d1117' : '#b0b8c1', fontWeight: 800, fontSize: 13, marginRight: 12 }}>0{i + 1}</span>
                  {faq.q}
                </span>
                {openFaq === i
                  ? <ChevronUp size={17} color="#0d1117" style={{ flexShrink: 0 }} />
                  : <ChevronDown size={17} color="#b0b8c1" style={{ flexShrink: 0 }} />}
              </button>
              {openFaq === i && (
                <div style={{ overflow: 'hidden', paddingBottom: 22, paddingLeft: 36 }}>
                  <p className="sheen-text" style={{ fontSize: 14, lineHeight: 1.82, fontWeight: 400 }}>{faq.a}</p>
                </div>
              )}
            </motion.div>
          ))}
          <div style={{ marginTop: 44, textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: '#9ca3af', marginBottom: 14, fontWeight: 400 }}>Ainda tens dúvidas?</div>
            <button className="btn-outline" style={{ padding: '11px 24px' }}>Fala connosco</button>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <motion.div className="cta-dark mesh-dark" initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} style={{ borderRadius: 0, padding: '72px 64px', position: 'relative', overflow: 'hidden' }}>
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
          </motion.div>
        </div>
      </section>

      <footer style={{ padding: '64px 24px 36px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <motion.div className="footer-grid" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', gap: 44, marginBottom: 52 }}>
            <div>
              <div style={{ marginBottom: 16 }}>
                <BrandMark size="lg" />
              </div>
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.78, maxWidth: 260, fontWeight: 400 }}>
                Startup angolana focada em gestão contratual inteligente, inovação e compliance digital.
              </p>
            </div>
            {footerSections.map(section => (
              <div key={section.title}>
                <h4 className="sheen-text" style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, fontFamily: "'Poppins',sans-serif" }}>{section.title}</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {section.links.map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="footer-link">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
          <div style={{ borderTop: '1px solid #e2e5e9', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#b0b8c1', fontWeight: 400 }}>© 2026 Agree. Todos os direitos reservados.</span>
            <div style={{ display: 'flex', gap: 18 }}>
              <Link to="/termos" className="footer-link" style={{ fontSize: 12 }}>Termos de Serviço</Link>
              <Link to="/privacidade" className="footer-link" style={{ fontSize: 12 }}>Política de Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
