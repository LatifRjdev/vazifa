export default {
  expo: {
    name: "ProtocolMobile",
    slug: "protocol-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    description: "Мобильное приложение для управления задачами и проектами",
    keywords: ["задачи", "проекты", "управление", "productivity", "tasks", "projects"],
    privacy: "public",
    platforms: ["ios", "android", "web"],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.protocol.mobile",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "Приложение использует камеру для загрузки фотографий к задачам",
        NSPhotoLibraryUsageDescription: "Приложение использует галерею для загрузки изображений к задачам",
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.protocol.mobile",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "f3fa7c1f-92c7-48e8-a081-cd7e3f17a313"
      },
      apiUrl: process.env.NODE_ENV === 'production' 
        ? 'https://ptapi.oci.tj/api-v1'
        : process.env.API_URL || 'https://ptapi.oci.tj/api-v1',
      environment: process.env.NODE_ENV || 'development'
    },
    owner: process.env.EXPO_OWNER || "latifrjdev",
    updates: {
      url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID || "f3fa7c1f-92c7-48e8-a081-cd7e3f17a313"}`
    },
    runtimeVersion: {
      policy: "sdkVersion"
    }
  }
};
