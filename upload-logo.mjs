import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configura VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function upload() {
  console.log('🚀 A fazer upload do logo para Supabase Storage...\n');

  // 1. Criar bucket "logos" se não existir
  console.log('📦 Criando bucket "logos"...');
  const { error: bucketError } = await supabase.storage.createBucket('logos', {
    public: true,
  });
  if (bucketError && !bucketError.message?.includes('already exists')) {
    console.error('❌ Erro ao criar bucket:', bucketError);
    process.exit(1);
  }
  console.log('✅ Bucket "logos" pronto');

  // 2. Ler o ficheiro SVG
  const svgContent = readFileSync('src/Agree-logo.svg', 'utf-8');

  // 3. Upload do logo
  console.log('\n📤 Enviando logo...');
  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload('agree-logo.svg', svgContent, {
      contentType: 'image/svg+xml',
      upsert: true,
    });

  if (uploadError) {
    console.error('❌ Erro ao fazer upload:', uploadError);
    process.exit(1);
  }
  console.log('✅ Logo enviado');

  // 4. Obter URL público
  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl('agree-logo.svg');

  console.log(`\n🌐 URL público:\n${publicUrl}`);
  console.log('\n✅ Concluído!');
}

upload().catch(console.error);
