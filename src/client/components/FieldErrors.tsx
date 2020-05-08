/** @jsx jsx */
import React from "react";
import { Box, jsx, Styled } from "theme-ui";

import { ErrorMap } from "../../shared/types";
import { WriteResource } from "./../resource";

export function getErrorMessage<D, T>(resource: WriteResource<D, T>): string | undefined {
  return "errors" in resource && typeof resource.errors.message === "string"
    ? resource.errors.message
    : undefined;
}

export function getFieldErrors<D, T>(resource: WriteResource<D, T>): ErrorMap<D> {
  return "errors" in resource && typeof resource.errors.message !== "string"
    ? resource.errors.message
    : {};
}

interface FieldErrorsProps<D> {
  readonly field: keyof D;
  readonly errors: ErrorMap<D>;
}

export function FieldErrors<D>({ field, errors }: FieldErrorsProps<D>): JSX.Element | null {
  const fieldErrors = errors[field];
  return fieldErrors ? (
    <Box sx={{ color: "warning", textAlign: "left" }}>
      {fieldErrors &&
        fieldErrors.map((msg: string, index: number) => (
          <React.Fragment key={index}>
            {msg}
            <Styled.p />
          </React.Fragment>
        ))}
    </Box>
  ) : null;
}
