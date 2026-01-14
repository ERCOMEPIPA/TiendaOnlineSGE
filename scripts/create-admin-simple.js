import { createClient } from '@supabase/supabase-js';

async function createAdminUser() {
    const email = 'admin@fashionstore.com';
    const password = 'admin123';

    const supabaseUrl = 'https://wuvvdavcymfidenpmqlp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dnZkYXZjeW1maWRlbnBtcWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTYxNjgsImV4cCI6MjA4MzQzMjE2OH0.1MkTfy24weLQVhVj5uxBb_m5F-ow2xUupXr9OQeydgU';

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('=== Creando Usuario Administrador ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('');

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }

        console.log('✅ Usuario creado exitosamente!');
        console.log('📧 Email:', email);
        console.log('🔑 ID:', data.user?.id);
        console.log('');
        console.log('⚠️  IMPORTANTE:');
        console.log('   Si Supabase requiere confirmación de email:');
        console.log('   1. Ve a: https://supabase.com/dashboard/project/wuvvdavcymfidenpmqlp');
        console.log('   2. Authentication > Users');
        console.log('   3. Busca el usuario y confirma el email');
        console.log('');
        console.log('✨ Credenciales para login:');
        console.log('   URL: http://localhost:4321/admin/login');
        console.log('   Email:', email);
        console.log('   Password:', password);

    } catch (err) {
        console.error('❌ Error inesperado:', err.message);
        process.exit(1);
    }
}

createAdminUser();
