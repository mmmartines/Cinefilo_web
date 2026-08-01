import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '../app', // Aponta para a pasta do Mobile
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'], // Permite usar as variáveis com prefixo do Expo
})
