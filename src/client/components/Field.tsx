/** @jsx jsx */
import React, { RefAttributes } from "react";
import { Box, Input, InputProps, jsx, Label, Styled } from "theme-ui";

import { ErrorMap } from "../../shared/types";
import { WriteResource } from "../resource";

function getFieldErrors<D, T>(resource: WriteResource<D, T>): ErrorMap<D> {
  return "errors" in resource && typeof resource.errors.message !== "string"
    ? resource.errors.message
    : {};
}

function Field<D, R>({
  field,
  label,
  resource,
  inputProps
}: {
  readonly field: keyof D;
  readonly label: string;
  readonly resource: WriteResource<D, R>;
  readonly inputProps: RefAttributes<HTMLInputElement> & InputProps;
}): React.ReactElement {
  const fieldErrors = getFieldErrors(resource)[field];
  return (
    <React.Fragment>
      <Label htmlFor={field.toString()}>{label}</Label>
      <Input
        {...inputProps}
        id={field.toString()}
        sx={{ borderColor: fieldErrors ? "warning" : undefined }}
      />

      <Box sx={{ color: "warning", textAlign: "left" }}>
        {fieldErrors &&
          fieldErrors.map((msg: string, index: number) => (
            <React.Fragment key={index}>
              {msg}
              <Styled.p />
            </React.Fragment>
          ))}
      </Box>
    </React.Fragment>
  );
}

export default Field;
