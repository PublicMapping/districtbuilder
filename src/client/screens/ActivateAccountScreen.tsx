import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { activateAccount } from "../api";
import { Resource } from "../resource";

const ActivateAccountScreen = () => {
  const { token } = useParams();
  const [activationResource, setActivationResource] = useState<Resource<void>>({
    isPending: false
  });
  useEffect(() => {
    // tslint:disable-next-line no-if-statement
    if (token !== undefined) {
      setActivationResource({ isPending: true });
      activateAccount(token)
        .then(() => setActivationResource({ resource: void 0 }))
        .catch(errorMessage => setActivationResource({ errorMessage }));
    }
  }, [token]);
  return "resource" in activationResource ? (
    <div>Thank you for activating your account!</div>
  ) : "errorMessage" in activationResource ? (
    <div style={{ color: "red" }}>{activationResource.errorMessage}</div>
  ) : "isPending" in activationResource && activationResource.isPending ? (
    <span>Loading...</span>
  ) : null;
};

export default ActivateAccountScreen;
