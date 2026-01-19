/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                // Paleta principal - Rosa/Lavanda Moderno
                navy: {
                    50: '#fdf2f8',   // rose-50
                    100: '#fce7f3',  // rose-100
                    200: '#fbcfe8',  // rose-200
                    300: '#f9a8d4',  // rose-300
                    400: '#f472b6',  // rose-400
                    500: '#ec4899',  // rose-500
                    600: '#db2777',  // rose-600
                    700: '#be185d',  // rose-700
                    800: '#9d174d',  // rose-800
                    900: '#831843',  // rose-900
                    950: '#500724',  // rose-950
                },
                carbon: {
                    50: '#faf5ff',   // purple-50
                    100: '#f3e8ff',  // purple-100
                    200: '#e9d5ff',  // purple-200
                    300: '#d8b4fe',  // purple-300
                    400: '#c084fc',  // purple-400
                    500: '#a855f7',  // purple-500
                    600: '#9333ea',  // purple-600
                    700: '#7c3aed',  // purple-700 (violet)
                    800: '#6b21a8',  // purple-800
                    900: '#581c87',  // purple-900
                    950: '#3b0764',  // purple-950
                },
                cream: {
                    50: '#fefce8',   // yellow-50 (soft cream)
                    100: '#fef9c3',  // yellow-100
                    200: '#fef08a',  // yellow-200
                    300: '#fde047',  // yellow-300
                    400: '#facc15',  // yellow-400
                    500: '#eab308',  // yellow-500
                },
                accent: {
                    leather: '#be185d',  // rose-700 for buttons
                    gold: '#f472b6',     // rose-400 for highlights
                    'gold-matte': '#db2777', // rose-600 for hover
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
            animation: {
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
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
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};
