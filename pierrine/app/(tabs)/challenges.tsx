import { Award } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import EmptyState from "@/components/ui/EmptyState";
import { colors } from "@/constants/theme/colors";
import { spacing } from "@/constants/theme/spacing";

export default function ChallengesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Award size={28} color={colors.plum} />
        <Text style={styles.title}>Challenges</Text>
      </View>
      <EmptyState
        title="Aucun challenge disponible"
        message="Les challenges seront affiches ici lorsqu'un endpoint backend dedie sera disponible."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.plum,
    fontSize: 28,
    fontWeight: "900",
  },
});
