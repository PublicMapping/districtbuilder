/** @jsx jsx */
import { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Box, Flex, Spinner, Card, Themed, jsx, Text } from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";
import { ReactComponent as SuccessIllustration } from "../media/successfully-registered-illustration.svg";

import { activateAccount } from "../api";
import { isUserLoggedIn } from "../jwt";
import CenteredContent from "../components/CenteredContent";
import { Resource } from "../resource";
import { OrganizationSlug } from "../../shared/entities";

interface Params {
  readonly token: string;
  readonly organizationSlug: OrganizationSlug;
}

const ActivateAccountScreen = () => {
  const { token, organizationSlug } = useParams<Params>();
  const isLoggedIn = isUserLoggedIn();
  const history = useHistory();
  const [activationResource, setActivationResource] = useState<Resource<void>>({
    isPending: false
  });
  useEffect(() => {
    // Disabling 'functional/no-conditional-statement' without naming it.
    // See https://github.com/jonaskello/eslint-plugin-functional/issues/105
    // eslint-disable-next-line
    if (token !== undefined) {
      setActivationResource({ isPending: true });
      organizationSlug
        ? activateAccount(token)
            .then(() => {
              setActivationResource({ resource: void 0 });
            })
            .catch(errorMessage => setActivationResource({ errorMessage }))
        : activateAccount(token)
            .then(() => setActivationResource({ resource: void 0 }))
            .catch(errorMessage => setActivationResource({ errorMessage }));
    }
  }, [token, organizationSlug, history]);
  return (
    <CenteredContent>
      {"resource" in activationResource ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Logo sx={{ width: "15rem", mx: "auto", mb: 4 }} />
          <Card
            sx={{
              variant: "cards.floating",
              display: "flex",
              flexDirection: "column",
              justifyContent: "stretch"
            }}
          >
            <Box sx={{ mb: 3, mx: "auto" }}>
              <SuccessIllustration />
            </Box>
            <Text
              as="p"
              sx={{
                variant: "styles.header.title",
                textAlign: "center",
                fontSize: 3,
                mb: 4
              }}
            >
              Thank you for activating your account!
            </Text>

            <Themed.a
              as={Link}
              to={
                !isLoggedIn && organizationSlug
                  ? { pathname: "/login", state: { from: `/o/${organizationSlug}` } }
                  : !isLoggedIn
                  ? "/login"
                  : organizationSlug
                  ? `/o/${organizationSlug}`
                  : "/"
              }
              sx={{ variant: "linkButton" }}
            >
              {!isLoggedIn ? "Log in" : "Start mapping!"}
            </Themed.a>
          </Card>
        </Box>
      ) : "errorMessage" in activationResource ? (
        <Box style={{ color: "red" }}>{activationResource.errorMessage}</Box>
      ) : "isPending" in activationResource && activationResource.isPending ? (
        <Flex sx={{ justifyContent: "center" }}>
          <Spinner variant="styles.spinner.large" />
        </Flex>
      ) : null}
    </CenteredContent>
  );
};

export default ActivateAccountScreen;
