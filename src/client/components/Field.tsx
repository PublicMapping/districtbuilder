/** @jsx jsx */
import React, { RefAttributes } from "react";
import { Box, Input, InputProps, jsx, Label, Select, SelectProps, Styled } from "theme-ui";

import { ErrorMap } from "../../shared/types";
import { WriteResource } from "../resource";

function getFieldErrors<D, T>(resource: WriteResource<D, T>): ErrorMap<D> {
  return "errors" in resource && typeof resource.errors.message !== "string"
    ? resource.errors.message
    : {};
}

interface FieldProps<D, R> {
  readonly field: keyof D;
  readonly resource: WriteResource<D, R>;
}

export default function Field<D, R>({
  field,
  resource,
  children
}: {
  readonly children?: (hasErrors: boolean) => React.ReactNode;
} & FieldProps<D, R>): React.ReactElement {
  const errors = getFieldErrors(resource);
  const fieldErrors = errors ? errors[field] : undefined;
  return (
    <React.Fragment>
      <Label sx={{ display: "block" }}>{children && children(!!fieldErrors)}</Label>
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

interface InputFieldProps<D, R> extends FieldProps<D, R> {
  readonly label: string;
  readonly inputProps: RefAttributes<HTMLInputElement> & InputProps;
}

export function InputField<D, R>({
  field,
  label,
  resource,
  inputProps
}: InputFieldProps<D, R>): React.ReactElement {
  return (
    <Field field={field} resource={resource}>
      {hasErrors => (
        <React.Fragment>
          <span sx={{ display: "block" }}>{label}</span>
          <Input
            {...inputProps}
            id={field.toString()}
            sx={{ borderColor: hasErrors ? "warning" : undefined }}
          />
        </React.Fragment>
      )}
    </Field>
  );
}

interface SelectFieldProps<D, R> extends FieldProps<D, R> {
  readonly children: React.ReactNode;
  readonly label: string;
  readonly selectProps: RefAttributes<HTMLSelectElement> & SelectProps;
}

export function SelectField<D, R>({
  field,
  label,
  resource,
  children,
  selectProps
}: SelectFieldProps<D, R>): React.ReactElement {
  return (
    <Field field={field} resource={resource}>
      {hasErrors => (
        <React.Fragment>
          <span sx={{ display: "block" }}>{label}</span>
          <Select
            {...selectProps}
            id={field.toString()}
            sx={{ borderColor: hasErrors ? "warning" : undefined }}
          >
            {children}
          </Select>
        </React.Fragment>
      )}
    </Field>
  );
}
