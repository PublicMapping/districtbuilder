import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Flex, Spinner } from "theme-ui";

import { activateAccount } from "../api";
import CenteredContent from "../components/CenteredContent";
import { Resource } from "../resource";

const ActivateAccountScreen = () => {
  const { token } = useParams();
  const [activationResource, setActivationResource] = useState<Resource<void>>({
    isPending: false
  });
  useEffect(() => {
    // Disabling 'functional/no-conditional-statement' without naming it.
    // See https://github.com/jonaskello/eslint-plugin-functional/issues/105
    // eslint-disable-next-line
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
        <Flex sx={{ justifyContent: "center" }}>
          <Spinner variant="spinner.large" />
        </Flex>
      ) : null}
    </CenteredContent>
  );
};

export default ActivateAccountScreen;
