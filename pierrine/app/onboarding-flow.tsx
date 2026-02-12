import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const progress = (step / totalSteps) * 100;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => step > 1 && setStep(step - 1)}>
          <Text style={styles.back}>←</Text>
        </Pressable>

        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBarFill, { width: `${progress}%` }]}
          />
        </View>

        <Text style={styles.stepText}>{step}/{totalSteps}</Text>
      </View>

      {/* CONTENU DYNAMIQUE */}
      {step === 1 && (
        <>
          <Text style={styles.title}>
            Quel est votre objectif principal ?
          </Text>
          <Text style={styles.subtitle}>
            Nous adapterons votre programme
          </Text>

          <Option text="Prévention" />
          <Option text="Post-partum" />
          <Option text="Incontinence" />
          <Option text="Sport intensif" />
          <Option text="Bien-être intime" />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.title}>
            Avez-vous déjà accouché ?
          </Text>
          <Text style={styles.subtitle}>
            Cette information nous aide à adapter les exercices
          </Text>

          <Option text="Oui" />
          <Option text="Non" />
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.title}>
            Quels symptômes ressentez-vous ?
          </Text>
          <Text style={styles.subtitle}>
            Sélectionnez tout ce qui s'applique
          </Text>

          <Option text="Fuites lors d'efforts" />
          <Option text="Envies pressantes" />
          <Option text="Pesanteur pelvienne" />
          <Option text="Douleurs pendant les rapports" />
          <Option text="Aucun symptôme particulier" />
        </>
      )}

      {step === 4 && (
        <>
          <Text style={styles.title}>
            Votre expérience avec les exercices Kegel ?
          </Text>
          <Text style={styles.subtitle}>
            Nous calibrerons la difficulté
          </Text>

          <Option text="Débutante" />
          <Option text="Intermédiaire" />
          <Option text="Confirmée" />
        </>
      )}

      {step === 5 && (
        <>
          <Text style={styles.title}>
            Prêt(e) à commencer ?
          </Text>
          <Text style={styles.subtitle}>
            Nous allons personnaliser votre programme
          </Text>
        </>
      )}

      {/* Bouton */}
      <LinearGradient
        colors={["#B9657C", "#6A1E3A"]}
        style={styles.button}
      >
        <Pressable
          onPress={() =>
            step < totalSteps
              ? setStep(step + 1)
              : router.replace("/(tabs)")
          }
        >
          <Text style={styles.buttonText}>
            {step === totalSteps ? "Terminer" : "Suivant"}
          </Text>
        </Pressable>
      </LinearGradient>

    </View>
  );
}

function Option({ text }: { text: string }) {
  return (
    <TouchableOpacity style={styles.option}>
      <Text style={styles.optionText}>{text}</Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5ECEC",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 30,
  },
  back: {
    fontSize: 22,
    color: "#5A1A30",
    marginRight: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#E7D3D7",
    borderRadius: 10,
    marginHorizontal: 10,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: "#6A1E3A",
    borderRadius: 10,
  },
  stepText: {
    color: "#9B6A75",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#5A1A30",
    marginBottom: 10,
  },
  subtitle: {
    color: "#8A5A65",
    marginBottom: 25,
  },
  option: {
    backgroundColor: "#EDE7E8",
    padding: 20,
    borderRadius: 25,
    marginBottom: 15,
  },
  optionText: {
    fontSize: 18,
    color: "#5A1A30",
    fontWeight: "600",
  },
  button: {
    borderRadius: 40,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: "auto",
  },
  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 18,
  },
});
