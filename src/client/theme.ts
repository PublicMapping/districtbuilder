import { Theme as StyledSystemTheme } from "@styled-system/css";
import { Theme } from "theme-ui";

export const heights = {
  header: "48px"
};

export const icons = {
  search: {
    viewBox: "0 0 512 512",
    path:
      "M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"
  }
};

const appButtonStyles = {
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  justifyContent: "center",
  height: "48px",
  maxHeight: "100%",
  py: 0,
  "& > svg": {
    mr: 1
  },
  "&[disabled]": { opacity: 0.6 }
};

const theme: Theme & StyledSystemTheme = {
  fonts: {
    body:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    heading:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    monospace: "Menlo, monospace"
  },
  colors: {
    heading: "#222",
    text: "#666",
    background: "#f6f6f6",
    primary: "#093EA7",
    secondary: "#455066",
    muted: "#fff",
    accent: "#29303D",
    warning: "#C00339",
    gray: [
      "#f7fafc",
      "#edf2f7",
      "#e2e8f0",
      "#cbd5e0",
      "#a0aec0",
      "#718096",
      "#4a5568",
      "#2d3748",
      "#1a202c"
    ]
  },
  sizes: {
    form: "500px"
  },
  fontSizes: [13, 15, 18, 21, 31, 37, 54],
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
      fontWeight: "heading",
      color: "heading"
    }
  },
  space: [0, 4, 8, 12, 16, 24, 32, 48, 64, 128, 256],
  buttons: {
    primary: appButtonStyles,
    secondary: {
      ...appButtonStyles,
      ...{
        backgroundColor: "secondary"
      }
    },
    subtle: {
      ...appButtonStyles,
      ...{
        backgroundColor: "gray.1",
        color: "heading"
      }
    },
    minimal: {
      ...appButtonStyles,
      ...{
        background: "none"
      }
    },
    circular: {
      ...appButtonStyles,
      ...{
        borderRadius: "100px"
      }
    },
    circularSubtle: {
      ...appButtonStyles,
      ...{
        borderRadius: "100px",
        backgroundColor: "gray.1",
        color: "heading"
      }
    }
  },
  forms: {
    input: {
      mb: 2
    },
    label: {
      mb: 1,
      textAlign: "left"
    }
  },
  links: {
    button: {
      backgroundColor: "primary",
      color: "white",
      fontSize: 2,
      borderRadius: "4px",
      textDecoration: "none",
      fontWeight: "body",
      px: 3,
      py: 2
    }
  },
  styles: {
    img: {
      maxWidth: "100%",
      height: "auto"
    },
    root: {
      m: 0,
      p: 0,
      fontFamily: "body",
      lineHeight: "body",
      fontWeight: "body",
      fontSize: 1
    }
  },
  header: {
    app: {
      height: heights.header,
      flexShrink: 0,
      p: 2
    },
    left: {
      justifyContent: "flex-start",
      alignItems: "center",
      flex: 1
    },
    center: {
      justifyContent: "center",
      alignItems: "center",
      flex: 1
    },
    right: {
      justifyContent: "flex-end",
      alignItems: "center",
      flex: 1
    }
  }
};

export default theme;
