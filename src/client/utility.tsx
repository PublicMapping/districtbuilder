import React from "react";
import { ErrorMap } from "../shared/types";
import { WriteResource } from "./resource";

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

export function buildErrors<D, F extends keyof D>(
  field: F,
  errors: ErrorMap<D>
): JSX.Element | null {
  const fieldErrors = errors[field];
  return fieldErrors ? (
    <div style={{ color: "red" }}>
      {fieldErrors && fieldErrors.map((msg: string, index: number) => <p key={index}>{msg}</p>)}
    </div>
  ) : null;
}
