import { Redirect } from 'expo-router';

export default function Index() {
  // Rediriger vers l'onboarding
  return <Redirect href="/onboarding" />;
}

