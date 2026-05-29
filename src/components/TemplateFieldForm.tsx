import React from 'react';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'currency';
  required: boolean;
}

interface TemplateFieldFormProps {
  fields: FieldDef[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  templateName: string;
}

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  background: '#fff',
  border: '1.5px solid #e2e5e9',
  outline: 'none',
  fontFamily: "'Poppins',sans-serif",
  boxSizing: 'border-box',
};

export default function TemplateFieldForm({ fields, values, onChange, templateName }: TemplateFieldFormProps) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16
      }}>
        <div>
          <h3 style={{
            fontSize: 14, fontWeight: 700, color: '#0d1117', fontFamily: "'Poppins',sans-serif", margin: 0
          }}>
            Preencher {templateName}
          </h3>
          <p style={{ fontSize: 12, color: '#6b7280', fontFamily: "'Poppins',sans-serif", margin: '4px 0 0' }}>
            Preenche os campos abaixo para gerar o contrato
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16
      }}>
        {fields.map(field => (
          <div key={field.name} style={{
            gridColumn: field.type === 'textarea' ? '1 / -1' : undefined
          }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6,
              fontFamily: "'Poppins',sans-serif"
            }}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={values[field.name] || ''}
                onChange={e => onChange(field.name, e.target.value)}
                rows={4}
                style={{ ...inputBase, resize: 'vertical' }}
              />
            ) : (
              <input
                type={field.type === 'date' ? 'date' : 'text'}
                value={values[field.name] || ''}
                onChange={e => onChange(field.name, e.target.value)}
                style={inputBase}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
