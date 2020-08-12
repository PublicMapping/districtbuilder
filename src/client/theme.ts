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
  maxHeight: "100%",
  fontFamily: "heading",
  fontWeight: "medium",
  borderRadius: "3px",
  cursor: "pointer",
  "& > svg": {
    mr: 1
  },
  "&:hover": {
    bg: "blue.5"
  },
  "&:active": {
    bg: "blue.7"
  },
  "&:focus": {
    outline: "none",
    boxShadow: "focus"
  },
  "&[disabled]": { opacity: 0.6 }
};

const theme: Theme & StyledSystemTheme = {
  fonts: {
    body:
      'proxima nova, proxima-nova, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    heading:
      'frank-new, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    monospace: "Menlo, monospace"
  },
  colors: {
    heading: "#141414",
    text: "#595959",
    background: "#eef0f2",
    primary: "#6d98ba",
    secondary: "#6d6d6d",
    muted: "#fff",
    accent: "#ffc08e",
    warning: "#f06543",
    success: [
      "#f7fde8",
      "#DCF8A5",
      "#BEEC75",
      "#9ED950",
      "#5AA516",
      "#438A0F",
      "#306F09",
      "#102c02"
    ],
    blue: [
      "#f2f6f9",
      "#e5edf3",
      "#bdd0e0",
      "#95b4cd",
      "#6d98ba",
      "#4c7ba0",
      "#395c78",
      "#2c485e",
      "#131f28"
    ],
    gray: [
      "#f8f9fa",
      "#eef0f2",
      "#d6d8da",
      "#8a8a8a",
      "#808080",
      "#6d6d6d",
      "#595959",
      "#2c2c2c",
      "#141414"
    ]
  },
  radii: {
    small: "2px",
    med: "4px"
  },
  shadows: {
    small: "0 0 4px rgba(0, 0, 0, .125)",
    large: "0 0 24px rgba(0, 0, 0, .30)",
    bright: "0 0 8px 2px rgba(109, 152, 186, 0.2)",
    focus: "0 0 0 2px rgba(109, 152, 186, 0.3)"
  },
  sizes: {
    form: "350px"
  },
  fontSizes: [9, 13, 15, 18, 21, 31, 37, 54],
  fontWeights: {
    light: 300,
    medium: 500,
    bold: 700,
    body: 500,
    heading: 300
  },
  lineHeights: {
    body: 1.65,
    heading: 1.125
  },
  text: {
    heading: {
      mb: 2,
      fontWeight: "heading",
      color: "heading"
    },
    caps: {
      textTransform: "uppercase",
      letterSpacing: "1px"
    }
  },
  card: {
    floating: {
      borderRadius: "small",
      boxShadow: "bright",
      backgroundColor: "muted",
      my: 4,
      p: 24
    }
  },
  space: [0, 4, 8, 12, 16, 24, 32, 48, 64, 128, 256],
  buttons: {
    primary: appButtonStyles,
    secondary: {
      ...appButtonStyles,
      ...{
        backgroundColor: "secondary",
        "&:hover": {
          bg: "gray.6"
        },
        "&:active": {
          bg: "gray.7"
        }
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
    label: {
      mb: 1,
      fontSize: 1,
      fontWeight: "bold",
      color: "gray.5",
      textAlign: "left",
      variant: "text.caps"
    },
    input: {
      borderColor: "gray.2",
      "&:focus": {
        borderColor: "primary",
        boxShadow: "focus",
        outline: "none"
      }
    },
    select: {
      borderColor: "gray.2",
      "&:focus": {
        borderColor: "primary",
        boxShadow: "focus",
        outline: "none"
      }
    },
    textarea: {
      borderColor: "gray.2",
      "&:focus": {
        borderColor: "primary",
        boxShadow: "focus",
        outline: "none"
      }
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
    small: {
      color: "accent",
      size: "24px",
      strokeWidth: "3px"
    },
    medium: {
      color: "accent",
      size: "48px",
      strokeWidth: "3px"
    },
    large: {
      color: "accent",
      strokeWidth: "3px",
      size: "60px"
    }
  },
  styles: {
    a: {
      "&:focus": {
        borderRadius: "small",
        boxShadow: "focus",
        outline: "none"
      }
    },
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
      fontSize: 2
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
