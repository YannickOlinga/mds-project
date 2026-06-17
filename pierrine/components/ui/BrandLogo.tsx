import { Image, StyleSheet, View } from "react-native";

type BrandLogoProps = {
  compact?: boolean;
};

export default function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Image
        source={require("../../assets/images/perinea-logo.png")}
        style={[styles.logo, compact && styles.logoCompact]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: "100%",
  },
  wrapCompact: {
    alignItems: "flex-start",
  },
  logo: {
    height: 108,
    width: 250,
  },
  logoCompact: {
    height: 58,
    width: 172,
  },
});
