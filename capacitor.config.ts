import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inspiration.capsule',
  appName: '灵感胶囊',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;