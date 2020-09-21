/** @jsx jsx */
import React, { RefAttributes } from "react";
import { Box, Flex, Input, InputProps, jsx, Label, Select, SelectProps, Styled } from "theme-ui";

import { validate as validatePassword } from "../../shared/password-validator";
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
      <Box sx={{ fontSize: 1, color: "warning", textAlign: "left" }}>
        {fieldErrors &&
          fieldErrors.map((msg: string, index: number) => (
            <React.Fragment key={index}>
              {msg}
              <Styled.div />
            </React.Fragment>
          ))}
      </Box>
    </React.Fragment>
  );
}

interface InputFieldProps<D, R> extends FieldProps<D, R> {
  readonly label: string | React.ReactElement;
  readonly description?: string | React.ReactElement;
  readonly inputProps: RefAttributes<HTMLInputElement> & InputProps;
}

export function InputField<D, R>({
  field,
  label,
  description,
  resource,
  inputProps
}: InputFieldProps<D, R>): React.ReactElement {
  return (
    <Field field={field} resource={resource}>
      {hasErrors => (
        <React.Fragment>
          <Label htmlFor={field.toString()} sx={{ display: "block" }}>
            {label}
          </Label>
          {description && (
            <span id={`description-${field.toString()}`} sx={{ display: "block" }}>
              {description}
            </span>
          )}
          <Input
            {...inputProps}
            id={field.toString()}
            aria-describedby={description ? `description-${field.toString()}` : undefined}
            sx={{ borderColor: hasErrors ? "warning" : undefined }}
          />
        </React.Fragment>
      )}
    </Field>
  );
}

interface SelectFieldProps<D, R> extends FieldProps<D, R> {
  readonly children: React.ReactNode;
  readonly label: string | React.ReactElement;
  readonly description?: string | React.ReactElement;
  readonly selectProps: RefAttributes<HTMLSelectElement> & SelectProps;
}

export function SelectField<D, R>({
  field,
  label,
  description,
  resource,
  children,
  selectProps
}: SelectFieldProps<D, R>): React.ReactElement {
  return (
    <Field field={field} resource={resource}>
      {hasErrors => (
        <React.Fragment>
          <Label htmlFor={field.toString()} sx={{ display: "block" }}>
            {label}
          </Label>
          {description && (
            <span id={`description-${field.toString()}`} sx={{ display: "block" }}>
              {description}
            </span>
          )}
          <Select
            {...selectProps}
            id={field.toString()}
            aria-describedby={description ? `description-${field.toString()}` : undefined}
            sx={{ borderColor: hasErrors ? "warning" : undefined }}
          >
            {children}
          </Select>
        </React.Fragment>
      )}
    </Field>
  );
}

interface PasswordFieldProps<D, R> extends FieldProps<D, R> {
  readonly label: string | React.ReactElement;
  readonly password: string;
  readonly userAttributes: readonly string[];
  readonly inputProps: RefAttributes<HTMLInputElement> & InputProps;
}

const PasswordConstraint = ({
  invalid,
  children
}: {
  readonly invalid: boolean;
  readonly children: React.ReactNode;
}) => {
  const color = invalid ? "warning" : "inherit";
  return (
    <Flex sx={{ flexDirection: "row", flex: 1 }}>
      <Box sx={{ color: "success.4", width: "1rem", height: "1rem" }}>{!invalid && "✓"}</Box>
      <Box sx={{ flex: "auto", color }}>{children}</Box>
    </Flex>
  );
};

export function PasswordField<D, R>({
  field,
  label,
  password,
  userAttributes,
  resource,
  inputProps
}: PasswordFieldProps<D, R>): React.ReactElement {
  const pwErrors = validatePassword(password, userAttributes);
  const hasErrors = password && Object.values(pwErrors).some(hasError => hasError);
  return (
    <Box sx={{ position: "relative" }}>
      <Field field={field} resource={resource}>
        {() => (
          <React.Fragment>
            <span sx={{ display: "block" }}>{label}</span>
            <Input
              {...inputProps}
              type="password"
              id={field.toString()}
              sx={{ borderColor: hasErrors ? "warning" : undefined }}
            />
            <Box
              sx={{
                "input:focus + &": {
                  display: "block"
                },
                display: "none",
                position: "absolute",
                backgroundColor: "white",
                fontSize: 1,
                right: "0",
                left: "0",
                top: "0",
                transform: "translateY(-100%)",
                px: 3,
                py: 2,
                mb: 2,
                zIndex: 1,
                border: "1px solid",
                borderColor: "gray.2",
                boxShadow: "small",
                borderRadius: "small",
                "@media screen and (min-width: 1040px)": {
                  transform: "translateY(-50%)",
                  left: "100%",
                  right: "auto",
                  top: "50%",
                  mb: "0",
                  ml: 2,
                  width: "350px"
                }
              }}
            >
              <PasswordConstraint invalid={pwErrors.minLength}>
                At least 8 characters
              </PasswordConstraint>
              <PasswordConstraint invalid={pwErrors.hasNonNumeric}>
                At least 1 letter
              </PasswordConstraint>
              <PasswordConstraint invalid={pwErrors.common}>
                Not a commonly used password
              </PasswordConstraint>
              <PasswordConstraint invalid={pwErrors.similar}>
                Different from your email or name
              </PasswordConstraint>
            </Box>
          </React.Fragment>
        )}
      </Field>
    </Box>
  );
}
