/** @jsx jsx */
import React from "react";
import { Flex, jsx } from "theme-ui";

const CenteredContent = ({ children }: { readonly children: React.ReactNode }) => {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        minHeight: "100vh"
      }}
    >
      <Flex as="main" sx={{ width: "100%" }}>
        <Flex
          sx={{
            width: "100%",
            maxWidth: "form",
            mx: "auto",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          {children}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default CenteredContent;
