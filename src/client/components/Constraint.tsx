/** @jsx jsx */
import React from "react";
import { Box, Flex, jsx } from "theme-ui";

const Constraint = ({
  invalid,
  children
}: {
  readonly invalid: boolean;
  readonly children: React.ReactNode;
}) => {
  const color = invalid ? "warning" : "inherit";
  return (
    <Flex sx={{ flexDirection: "row", flex: 1 }}>
      <Box sx={{ width: "1rem", height: "1rem" }}>{!invalid && "✓"}</Box>
      <Box sx={{ flex: "auto", color }}>{children}</Box>
    </Flex>
  );
};

export default Constraint;
