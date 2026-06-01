import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

const presetColors = [
  '#0d1117', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#db2777', '#0891b2',
];

function getColorForTag(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return presetColors[Math.abs(hash) % presetColors.length];
}

export default function TagInput({ tags, onChange, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      onChange([...tags, t]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {tags.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 20,
              background: getColorForTag(tag) + '15',
              color: getColorForTag(tag), fontSize: 12, fontWeight: 600,
            }}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                padding: 0, display: 'flex', color: 'inherit',
              }}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
            if (e.key === ',' || e.key === 'Tab') { e.preventDefault(); addTag(input.replace(',', '')); }
            if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Adicionar tag..."
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 12,
            border: '1px solid #e2e5e9', fontSize: 13, outline: 'none',
            fontFamily: "'Poppins', sans-serif",
          }}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
            background: '#fff', border: '1px solid #e2e5e9', borderRadius: 12,
            marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden',
          }}>
            {filteredSuggestions.map(s => (
              <div
                key={s}
                onMouseDown={() => addTag(s)}
                style={{
                  padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                  borderBottom: '1px solid #f3f4f6',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseOut={e => (e.currentTarget.style.background = '')}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
