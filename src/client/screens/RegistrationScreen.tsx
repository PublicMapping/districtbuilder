import React, { useState } from "react";

import { Register } from "../../shared/entities";
import { ErrorMap } from "../../shared/types";
import { registerUser } from "../api";
import { WriteResource } from "../resource";

const isFormInvalid = (form: RegistrationForm): boolean =>
  Object.values(form).some(value => value.trim() === "") || form.password !== form.confirmPassword;

function getErrors<F extends keyof RegistrationForm>(
  field: F,
  errors: ErrorMap<RegistrationForm>
): JSX.Element | null {
  const fieldErrors = errors[field];
  return fieldErrors ? (
    <div style={{ color: "red" }}>
      {fieldErrors && fieldErrors.map((msg: string, index: number) => <p key={index}>{msg}</p>)}
    </div>
  ) : null;
}

interface RegistrationForm extends Register {
  readonly confirmPassword: string;
}

const RegistrationScreen = () => {
  const [registrationResource, setRegistrationResource] = useState<
    WriteResource<RegistrationForm, void>
  >({
    data: {
      email: "",
      password: "",
      confirmPassword: "",
      name: ""
    }
  });
  const { data } = registrationResource;
  const errorMessage =
    "errors" in registrationResource && typeof registrationResource.errors.message === "string"
      ? registrationResource.errors.message
      : undefined;
  const fieldErrors =
    "errors" in registrationResource && typeof registrationResource.errors.message !== "string"
      ? registrationResource.errors.message
      : {};
  const setForm = (field: keyof RegistrationForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRegistrationResource({
      data: { ...data, [field]: e.currentTarget.value }
    });
  return "resource" in registrationResource ? (
    <div>
      Thanks for signing up for DistrictBuilder! Please click the link in your registration email to
      continue.
    </div>
  ) : (
    <form
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        setRegistrationResource({ data, isPending: true });
        registerUser(
          registrationResource.data.name,
          registrationResource.data.email,
          registrationResource.data.password
        )
          .then(() => setRegistrationResource({ data, resource: void 0 }))
          .catch(errors => {
            setRegistrationResource({ data, errors });
          });
      }}
    >
      {errorMessage ? <div style={{ color: "red" }}>{errorMessage}</div> : null}
      <div>
        <input type="text" placeholder="Name" onChange={setForm("name")} />
        {getErrors("name", fieldErrors)}
      </div>
      <div>
        <input type="text" placeholder="Email" onChange={setForm("email")} />
        {getErrors("email", fieldErrors)}
      </div>
      <div>
        <input type="password" placeholder="Password" onChange={setForm("password")} />
        {getErrors("password", fieldErrors)}
      </div>
      <div>
        <input
          type="password"
          placeholder="Confirm password"
          onChange={setForm("confirmPassword")}
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={
            ("isPending" in registrationResource && registrationResource.isPending) ||
            isFormInvalid(data)
          }
        >
          Register
        </button>
      </div>
    </form>
  );
};

export default RegistrationScreen;
