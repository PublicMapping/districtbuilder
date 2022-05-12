/** @jsx jsx */
import React from "react";
import { Box, jsx } from "theme-ui";

const T_C_LINK = "https://www.azavea.com/terms-of-use/";

const RegisterTermsText = () => (
  <Box sx={{ fontSize: 0, textAlign: "start", fontWeight: "normal" }}>
    By creating an account, you agree to the{" "}
    <a href={T_C_LINK} sx={{ color: "blue.5" }} target="_blank" rel="noopener noreferrer">
      Terms of Service
    </a>
    . We will infrequently send you critical, account-related emails.
  </Box>
);

export default RegisterTermsText;
