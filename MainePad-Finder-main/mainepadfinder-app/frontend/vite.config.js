import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from "fs"
import path from 'path';

export default ({ mode }) => {
  const envDir = path.resolve(__dirname, '../../');
  const env = loadEnv(mode, envDir, 'VITE_');
  return defineConfig({
    plugins: [react()],
    server: {
      https: {
        key: fs.readFileSync(env.VITE_SSL_KEY_PATH),
        cert: fs.readFileSync(env.VITE_SSL_CERT_PATH),
      },
      port: 5173,
    },
  });
};