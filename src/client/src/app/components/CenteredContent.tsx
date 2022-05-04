/** @jsx jsx */
import React from "react";
import { Flex, jsx } from "theme-ui";

const CenteredContent = ({ children }: { readonly children?: React.ReactNode }) => {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        py: 3,
        "@media screen and (min-height: 600px)": {
          mt: "0",
          height: "100vh"
        }
      }}
    >
      <Flex as="main" sx={{ width: "100%", height: "100%" }}>
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
