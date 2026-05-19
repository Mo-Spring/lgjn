import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inspiration.capsule',
  appName: '小米笔记',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
