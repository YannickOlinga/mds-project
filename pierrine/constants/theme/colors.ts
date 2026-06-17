export const colors = {
  background: "#FCF7F4",
  surface: "#FFFFFF",
  surfaceAlt: "#FFF2F3",
  blush: "#F7C5C8",
  coral: "#C95F7B",
  plum: "#571534",
  plumMuted: "#8A5A65",
  border: "#F0D9DC",
  success: "#2E7D62",
  warning: "#B7791F",
  danger: "#B42318",
  text: "#2A1820",
  textMuted: "#7A6670",
} as const;

export const gradients = {
  primary: [colors.coral, colors.plum] as const,
  soft: [colors.surfaceAlt, colors.blush] as const,
} as const;
