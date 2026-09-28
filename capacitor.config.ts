import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.wusool.school",
  appName: "وصول",
  webDir: "dist/public",
  bundledWebRuntime: false,
  server: { androidScheme: "https" },
  plugins: {
    SplashScreen: { launchShowDuration: 250, launchAutoHide: true, backgroundColor: "#071a33", showSpinner: false },
    StatusBar: { style: "DARK", backgroundColor: "#071a33" },
  },
};
export default config;
