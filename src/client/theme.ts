import { Theme } from "theme-ui";

const theme: Theme = {
  fonts: {
    body:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    heading:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    monospace: "Menlo, monospace"
  },
  colors: {
    heading: "#000",
    text: "#444",
    background: "#f6f6f6",
    primary: "#33e",
    secondary: "#33e",
    muted: "#fff",
    accent: "#33e",
    warning: "#C00339"
  },
  sizes: {
    form: "468px"
  },
  fontSizes: [12, 14, 16, 21, 28, 38, 50],
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700
  },
  lineHeights: {
    body: 1.5,
    heading: 1.125
  },
  text: {
    heading: {
      mb: 2,
      fontWeight: "heading"
    }
  },
  space: [4, 8, 12, 16, 24, 32, 48, 64, 128, 256],
  // @ts-ignore
  forms: {
    input: {
      mb: 2
    },
    label: {
      mb: 1
    }
  },
  styles: {
    img: {
      maxWidth: "100%",
      height: "auto"
    },
    root: {
      fontFamily: "body",
      lineHeight: "body",
      fontWeight: "body"
    }
  }
};

export default theme;
