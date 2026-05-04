import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'ori-green':'#2D6A2D','ori-green-l':'#4A8C3F','ori-green-bg':'#E8F3E8','ori-green-shadow':'#1A4A1A',
        'ori-orange':'#D94F1E','ori-orange-l':'#F06B35','ori-orange-bg':'#FDEEE8','ori-orange-shadow':'#A03010',
        'ori-blue':'#1A5EA8','ori-blue-l':'#2B7DD4','ori-blue-bg':'#E3EEF8','ori-blue-shadow':'#0A3A6A',
        'ori-yellow':'#E8B800','ori-yellow-l':'#F5D020','ori-yellow-bg':'#FEF8DC','ori-yellow-shadow':'#A07800',
        'paper-cream':'#F5EDD8','paper-cream-d':'#EDE0C4','paper-white':'#FAF6EE',
        'ink':'#1A1208','ink-mid':'#3D2E18','ink-light':'#7A6A50','ink-faint':'#B0A090',
        'wagashi-sakura':'#F2AABF','wagashi-matcha':'#9EC4A0','wagashi-kinako':'#E8C87A','wagashi-sora':'#A8C5E0','washi':'#FAF7F2',
      },
      fontFamily: {
        display:['"Fredoka One"','"Noto Sans Thai"','sans-serif'],
        sans:['"Noto Sans Thai"','sans-serif'],
        serif:['"Noto Serif Thai"','serif'],
      },
      boxShadow: {
        'paper-sm':'2px 2px 0 #1A1208','paper':'4px 4px 0 #1A1208','paper-md':'5px 5px 0 #1A1208',
        'paper-lg':'6px 6px 0 #1A1208','paper-xl':'8px 8px 0 #1A1208',
        'fold-green':'5px 5px 0 #1A4A1A, 8px 8px 0 rgba(0,0,0,0.12)',
        'fold-orange':'5px 5px 0 #A03010, 8px 8px 0 rgba(0,0,0,0.12)',
        'fold-blue':'5px 5px 0 #0A3A6A, 8px 8px 0 rgba(0,0,0,0.12)',
        'fold-yellow':'5px 5px 0 #A07800, 8px 8px 0 rgba(0,0,0,0.12)',
      },
      borderRadius: { 'ori':'12px','ori-lg':'20px','ori-xl':'28px','pill':'999px' },
      borderWidth: { '2.5':'2.5px','3':'3px' },
      keyframes: {
        'fold-in':{'0%':{opacity:'0',transform:'translateY(20px)'},'100%':{opacity:'1',transform:'translateY(0)'}},
        'blink':{'0%,100%':{opacity:'1'},'50%':{opacity:'0.3'}},
        'scroll-l':{'0%':{transform:'translateX(0)'},'100%':{transform:'translateX(-50%)'}},
        'float':{'0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-6px)'}},
      },
      animation: {
        'fold-in':'fold-in 0.5s ease forwards',
        'blink':'blink 1.5s infinite',
        'scroll-l':'scroll-l 30s linear infinite',
        'float':'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
