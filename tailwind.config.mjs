/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                // Paleta Origin - Minimalista y Elegante
                navy: {
                    50: '#faf9f7',    // off-white cálido
                    100: '#f5f3ef',   // crema muy claro
                    200: '#e8e4dc',   // beige claro
                    300: '#d4cfc3',   // beige medio
                    400: '#b8b0a0',   // taupe claro
                    500: '#9c9283',   // taupe
                    600: '#7a7064',   // gris cálido
                    700: '#5c544a',   // gris marrón
                    800: '#3d3831',   // marrón oscuro
                    900: '#2a2622',   // casi negro cálido
                    950: '#1a1816',   // negro cálido
                },
                carbon: {
                    50: '#f8f7f5',    // blanco cálido
                    100: '#f0ede8',   // crema
                    200: '#e0dbd2',   // beige
                    300: '#ccc5b8',   // taupe claro
                    400: '#ada397',   // taupe medio
                    500: '#8e8275',   // taupe oscuro
                    600: '#6f6458',   // marrón medio
                    700: '#544a40',   // marrón
                    800: '#3a332c',   // marrón oscuro
                    900: '#252119',   // muy oscuro
                    950: '#151310',   // casi negro
                },
                cream: {
                    50: '#fdfcf9',    // blanco cremoso
                    100: '#f9f7f2',   // crema muy claro
                    200: '#f2ede4',   // crema
                    300: '#e8e0d1',   // beige claro
                    400: '#d9cdb8',   // beige
                    500: '#c4b49a',   // beige dorado
                },
                accent: {
                    leather: '#8B4513',   // cuero (marrón silla)
                    gold: '#C9A962',       // dorado mate
                    'gold-matte': '#A68A4B', // dorado oscuro
                    terracotta: '#C4704E', // terracota
                    olive: '#6B7B3A',      // oliva
                }
            },
            fontFamily: {
                serif: ['Playfair Display', 'Georgia', 'serif'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            boxShadow: {
                'soft': '0 2px 15px rgba(42, 38, 34, 0.08)',
                'medium': '0 4px 25px rgba(42, 38, 34, 0.12)',
                'card-hover': '0 15px 40px rgba(42, 38, 34, 0.15)',
                'card-premium': '0 4px 20px rgba(42, 38, 34, 0.08)',
                'elegant': '0 10px 50px rgba(42, 38, 34, 0.1)',
            },
            animation: {
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.6s ease-out',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                slideIn: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(30px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
            },
            transitionDuration: {
                '400': '400ms',
            },
        },
    },
    plugins: [],
};

