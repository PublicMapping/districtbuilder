/** @jsx jsx */
import React from "react";
import { Box, jsx } from "theme-ui";

import { WriteResource } from "./../resource";

export default function FormError({
  resource
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly resource: WriteResource<any, any>;
}): React.ReactElement | null {
  const errorMessage =
    "errors" in resource && typeof resource.errors.message === "string"
      ? resource.errors.message
      : undefined;
  return errorMessage ? (
    <Box sx={{ backgroundColor: "warning", color: "white" }}>{errorMessage}</Box>
  ) : null;
}
