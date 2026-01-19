import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cherifi.app',
  appName: 'CheriFi Music',
  webDir: 'dist',
  server: {
    // For development, you can override the server
    url: 'https://frank-loui-lapore-hp-probook-640-g1.tail11c2e9.ts.net',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#040448", 
      androidSplashResourceName: "icon_foreground",
      androidScaleType: "CENTER"
    }
  }
};

export default config;