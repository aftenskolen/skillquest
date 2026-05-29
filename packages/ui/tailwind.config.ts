import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        primary: "#1B3A5C",
        secondary: "#2C6FAC",
        accent: "#0D7377",
        bg: "#F4F6F8",
        "text-dark": "#1A1A2E",
        "grey-border": "#CCCCCC",
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
      },
    },
  },
};

export default config;
