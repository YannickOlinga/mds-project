import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

const splashVideo = require('@/assets/images/p.mp4');

export default function Index() {
  const [finished, setFinished] = useState(false);

  const player = useVideoPlayer(splashVideo, (player) => {
    player.loop = false;
    player.muted = false;
    player.play();
  });

  // Fin de la vidéo -> on passe à la suite
  useEventListener(player, 'playToEnd', () => {
    setFinished(true);
  });

  // Sécurité : si la vidéo ne se charge pas, on continue après un délai
  useEffect(() => {
    const timeout = setTimeout(() => setFinished(true), 8000);
    return () => clearTimeout(timeout);
  }, []);

  if (finished) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
});
