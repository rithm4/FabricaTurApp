import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// La publicare, panoul stă la /FabricaTurApp/admin/, lângă varianta web a aplicației.
// În dezvoltare rulează de la rădăcină.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/FabricaTurApp/admin/' : '/',
  server: { port: 5174 },
}));
