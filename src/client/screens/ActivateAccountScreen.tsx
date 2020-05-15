import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box } from "theme-ui";

import { activateAccount } from "../api";
import CenteredContent from "../components/CenteredContent";
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
  return (
    <CenteredContent>
      {"resource" in activationResource ? (
        <Box>Thank you for activating your account!</Box>
      ) : "errorMessage" in activationResource ? (
        <Box style={{ color: "red" }}>{activationResource.errorMessage}</Box>
      ) : "isPending" in activationResource && activationResource.isPending ? (
        <Box>Loading...</Box>
      ) : null}
    </CenteredContent>
  );
};

export default ActivateAccountScreen;
