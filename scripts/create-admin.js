import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdminUser() {
    console.log('=== Crear Usuario Administrador ===\n');

    const email = await question('Email del administrador: ');
    const password = await question('Contraseña (mínimo 6 caracteres): ');

    if (!email || !password) {
        console.error('❌ Email y contraseña son requeridos');
        rl.close();
        return;
    }

    if (password.length < 6) {
        console.error('❌ La contraseña debe tener al menos 6 caracteres');
        rl.close();
        return;
    }

    // Usar las credenciales de .env
    const supabaseUrl = 'https://wuvvdavcymfidenpmqlp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dnZkYXZjeW1maWRlbnBtcWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTYxNjgsImV4cCI6MjA4MzQzMjE2OH0.1MkTfy24weLQVhVj5uxBb_m5F-ow2xUupXr9OQeydgU';

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n🔄 Creando usuario...');

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: undefined // No enviar email de confirmación
            }
        });

        if (error) {
            console.error('❌ Error al crear usuario:', error.message);
            rl.close();
            return;
        }

        console.log('\n✅ Usuario creado exitosamente!');
        console.log('📧 Email:', email);
        console.log('🔑 ID:', data.user?.id);
        console.log('\n⚠️  IMPORTANTE:');
        console.log('   Si Supabase tiene la confirmación de email habilitada,');
        console.log('   debes confirmar el email desde el Dashboard de Supabase:');
        console.log('   Authentication > Users > [tu usuario] > Confirm email');
        console.log('\n✨ Ahora puedes iniciar sesión en: http://localhost:4321/admin/login');

    } catch (err) {
        console.error('❌ Error inesperado:', err);
    }

    rl.close();
}

createAdminUser();
