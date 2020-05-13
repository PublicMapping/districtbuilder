/** @jsx jsx */
import React from "react";
import { Card, Flex, Heading, jsx } from "theme-ui";

const CenteredCard = ({
  children,
  footer
}: {
  readonly children: React.ReactElement;
  readonly footer?: React.ReactElement;
}) => {
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
          <Heading as="h1">DistrictBuilder</Heading>
          <Card sx={{ backgroundColor: "muted", my: 4, p: 4 }}>{children}</Card>
          {footer}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default CenteredCard;
