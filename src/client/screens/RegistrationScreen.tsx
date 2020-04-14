import React, { useState } from "react";

import { Register } from "../../shared/entities";
import { registerUser } from "../api";
import { Resource } from "../types";

const isFormValid = (form: RegistrationForm): boolean =>
  Object.values(form).some(value => value.trim() === "") || form.password !== form.confirmPassword;

interface RegistrationForm extends Register {
  readonly confirmPassword: string;
}

const RegistrationScreen = () => {
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm>({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
  const [registrationResource, setRegistrationResource] = useState<Resource<void>>({
    isPending: false
  });
  const setForm = (field: keyof RegistrationForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRegistrationForm({
      ...registrationForm,
      [field]: e.currentTarget.value
    });
  return "resource" in registrationResource ? (
    <div>
      Thanks for signing up for DistrictBuilder! Please click the link in your registration email to
      continue.
    </div>
  ) : (
    <>
      <div>
        <input type="text" placeholder="Name" onChange={setForm("name")} />
      </div>
      <div>
        <input type="text" placeholder="Email" onChange={setForm("email")} />
      </div>
      <div>
        <input type="password" placeholder="Password" onChange={setForm("password")} />
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
          onClick={() => {
            setRegistrationResource({ isPending: true });
            registerUser(registrationForm.name, registrationForm.email, registrationForm.password)
              .then(() => setRegistrationResource({ resource: void 0 }))
              .catch(errorMessage => setRegistrationResource({ errorMessage }));
          }}
          disabled={
            ("isPending" in registrationResource && registrationResource.isPending) ||
            isFormValid(registrationForm)
          }
        >
          Register
        </button>
      </div>
      {"errorMessage" in registrationResource ? (
        <div style={{ color: "red" }}>{registrationResource.errorMessage}</div>
      ) : null}
    </>
  );
};

export default RegistrationScreen;
