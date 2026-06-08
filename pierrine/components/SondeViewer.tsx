/**
 * SondeViewer — Affiche le modèle 3D de la sonde (.glb) via WebView + model-viewer.
 * Le modèle est chargé depuis les assets locaux et encodé en base64.
 */
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Variant = 'rose' | 'vert' | 'violet';

const MODELS: Record<Variant, number> = {
  rose:   require('@/assets/images/sonde rose.glb'),
  vert:   require('@/assets/images/sonde vert.glb'),
  violet: require('@/assets/images/sonde violet.glb'),
};

function buildHtml(base64: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
    model-viewer {
      width: 100%;
      height: 100%;
      background-color: transparent;
      --poster-color: transparent;
    }
  </style>
</head>
<body>
  <script
    type="module"
    src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js">
  </script>
  <model-viewer
    src="data:model/gltf-binary;base64,${base64}"
    auto-rotate
    rotation-per-second="25deg"
    camera-controls
    disable-zoom
    shadow-intensity="0.6"
    exposure="1.2"
    camera-orbit="0deg 75deg 2.5m"
    style="background: transparent;">
  </model-viewer>
</body>
</html>`;
}

type Props = {
  variant?: Variant;
  size?: number;
};

export default function SondeViewer({ variant = 'violet', size = 260 }: Props) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const asset = Asset.fromModule(MODELS[variant]);
        await asset.downloadAsync();
        if (cancelled || !asset.localUri) return;

        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: 'base64',
        });
        if (!cancelled) setHtml(buildHtml(base64));
      } catch (e) {
        console.warn('[SondeViewer] Erreur de chargement :', e);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [variant]);

  if (!html) {
    return (
      <View style={[styles.loader, { width: size, height: size }]}>
        <ActivityIndicator color="#C95F7B" size="large" />
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <WebView
        source={{ html }}
        style={{ width: size, height: size, backgroundColor: 'transparent' }}
        originWhitelist={['*']}
        allowFileAccess
        allowFileAccessFromFileURLs
        mixedContentMode="always"
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        backgroundColor="transparent"
        onShouldStartLoadWithRequest={() => true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
