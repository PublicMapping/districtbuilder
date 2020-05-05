import React, { useState } from "react";

import { Register } from "../../shared/entities";
import { registerUser } from "../api";
import { FieldErrors, getErrorMessage, getFieldErrors } from "../components/FieldErrors";
import { WriteResource } from "../resource";

const isFormInvalid = (form: RegistrationForm): boolean =>
  Object.values(form).some(value => value.trim() === "") || form.password !== form.confirmPassword;

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
  const errorMessage = getErrorMessage(registrationResource);
  const fieldErrors = getFieldErrors(registrationResource);

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
        <FieldErrors field={"name"} errors={fieldErrors} />
      </div>
      <div>
        <input type="text" placeholder="Email" onChange={setForm("email")} />
        <FieldErrors field={"email"} errors={fieldErrors} />
      </div>
      <div>
        <input type="password" placeholder="Password" onChange={setForm("password")} />
        <FieldErrors field={"password"} errors={fieldErrors} />
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
