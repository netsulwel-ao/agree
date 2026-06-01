import React from 'react';
import { SUPPORTED_CURRENCIES } from '../services/currency';

interface Props {
  value: string;
  onChange: (code: string) => void;
  style?: React.CSSProperties;
}

export default function CurrencySelect({ value, onChange, style }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '10px 12px', fontSize: 13, border: '1.5px solid #e2e5e9',
        outline: 'none', fontFamily: "'Poppins',sans-serif", color: '#0d1117',
        background: '#fff', cursor: 'pointer', ...style,
      }}
    >
      {SUPPORTED_CURRENCIES.map(c => (
        <option key={c.code} value={c.code}>{c.symbol} — {c.name}</option>
      ))}
    </select>
  );
}
