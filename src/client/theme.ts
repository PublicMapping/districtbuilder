import { Theme as StyledSystemTheme } from "@styled-system/css";
import { Theme } from "theme-ui";

export const heights = {
  header: "48px"
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
  spinner: {
    color: "accent",
    size: "24px",
    medium: {
      color: "accent",
      size: "36px"
    },
    large: {
      color: "accent",
      size: "48px"
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
    },
    table: {
      borderCollapse: "collapse"
    },
    tr: {
      borderBottomColor: "gray.3",
      borderBottomWidth: "1px",
      borderBottomStyle: "solid",
      "tbody > &:last-child": { borderBottom: "none" }
    },
    td: {}
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
