const {
  withAndroidManifest,
  withAndroidStyles,
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
  withProjectBuildGradle,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NDK_VERSION = '28.2.13676358';
const JVM_ARGS = '-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:ReservedCodeCacheSize=512m -XX:TieredStopAtLevel=1';

function setGradleProperty(properties, key, value) {
  const existing = properties.find((property) => property.type === 'property' && property.key === key);

  if (existing) {
    existing.value = value;
    return;
  }

  properties.push({
    type: 'property',
    key,
    value,
  });
}

module.exports = function withAndroidBuildSettings(config) {
  config = withGradleProperties(config, (config) => {
    setGradleProperty(config.modResults, 'org.gradle.jvmargs', JVM_ARGS);
    setGradleProperty(config.modResults, 'org.gradle.parallel', 'false');
    setGradleProperty(config.modResults, 'kotlin.compiler.execution.strategy', 'in-process');
    setGradleProperty(config.modResults, 'reactNativeArchitectures', 'arm64-v8a');
    setGradleProperty(config.modResults, 'android.ndkVersion', NDK_VERSION);
    return config;
  });

  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    const ndkVersionDeclaration = `ext.ndkVersion = "${NDK_VERSION}"`;
    const contents = config.modResults.contents;

    config.modResults.contents = /ext\.ndkVersion\s*=\s*["'][^"']+["']/.test(contents)
      ? contents.replace(/ext\.ndkVersion\s*=\s*["'][^"']+["']/g, ndkVersionDeclaration)
      : `${contents.trimEnd()}\n\n${ndkVersionDeclaration}\n`;

    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    let contents = config.modResults.contents;

    if (!contents.includes('VELO_UPLOAD_STORE_FILE')) {
      contents = contents.replace(
        /(signingConfigs\s*\{[\s\S]*?debug\s*\{[\s\S]*?\n\s*\})(\s*\n\s*\})/,
        (_match, debugConfig, closingBrace) => `${debugConfig}
        release {
            storeFile file(System.getenv("VELO_UPLOAD_STORE_FILE"))
            storePassword System.getenv("VELO_UPLOAD_STORE_PASSWORD")
            keyAlias System.getenv("VELO_UPLOAD_KEY_ALIAS")
            keyPassword System.getenv("VELO_UPLOAD_KEY_PASSWORD")
        }${closingBrace}`
      );
    }

    contents = contents.replace(
      /(debug\s*\{[\s\S]*?)signingConfig signingConfigs\.release/,
      '$1signingConfig signingConfigs.debug'
    );

    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release'
    );

    config.modResults.contents = contents;
    return config;
  });

  config = withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application?.$) {
      application.$['android:extractNativeLibs'] = 'true';
    }
    return config;
  });

  config = withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources?.style ?? [];
    const splashStyle = styles.find((style) => style.$?.name === 'Theme.App.SplashScreen');
    const items = splashStyle?.item ?? [];
    const iconItem = items.find((item) => item.$?.name === 'windowSplashScreenAnimatedIcon');

    if (iconItem) {
      iconItem._ = '@drawable/empty_splash_icon';
    }

    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const drawableDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'drawable');
      fs.mkdirSync(drawableDir, { recursive: true });
      fs.writeFileSync(
        path.join(drawableDir, 'empty_splash_icon.xml'),
        '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n' +
          '  <solid android:color="@android:color/transparent" />\n' +
          '  <size android:width="1dp" android:height="1dp" />\n' +
          '</shape>\n'
      );
      return config;
    },
  ]);

  return config;
};
