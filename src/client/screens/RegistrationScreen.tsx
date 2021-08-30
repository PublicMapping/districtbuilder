/** @jsx jsx */
import React, { useState } from "react";
import { Link, Redirect, useLocation } from "react-router-dom";
import { connect } from "react-redux";
import { Alert, Box, Card, Close, Flex, Heading, jsx, Styled } from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";

import { isUserLoggedIn } from "../jwt";
import RegisterContent from "../components/RegisterContent";
import CenteredContent from "../components/CenteredContent";
import { IUser } from "../../shared/entities";
import { State } from "../reducers";
import { AuthLocationState } from "../types";
import { Resource } from "../resource";

interface StateProps {
  readonly user: Resource<IUser>;
}

const RegistrationScreen = ({ user }: StateProps) => {
  const isLoggedIn = "resource" in user && isUserLoggedIn();
  const location = useLocation<AuthLocationState>();
  const to = location.state?.from || { pathname: "/" };
  const toParams = new URLSearchParams(to.search);
  const [showStartProjectAlert, setShowStartProjectAlert] = useState(
    to.pathname === "/start-project" && toParams.has("name")
  );

  return (
    <CenteredContent>
      {isLoggedIn ? (
        <Redirect to={to} />
      ) : (
        <React.Fragment>
          <Heading as="h1" sx={{ textAlign: "center" }}>
            <Logo sx={{ maxWidth: "15rem" }} />
          </Heading>
          <Card sx={{ variant: "card.floating" }}>
            <RegisterContent>
              <Heading as="h2" sx={{ mb: 5, textAlign: "left" }}>
                Create an account!
              </Heading>
              {showStartProjectAlert && (
                <Alert sx={{ mb: 3 }}>
                  <Flex>
                    <Box>
                      Create an account or{" "}
                      <Styled.a
                        as={Link}
                        sx={{ variant: "links.alert" }}
                        to={{ pathname: "/login", state: location.state }}
                      >
                        log in
                      </Styled.a>{" "}
                      to create your &ldquo;{toParams.get("name")}&rdquo; map.
                    </Box>
                    <Close
                      as="a"
                      onClick={() => setShowStartProjectAlert(false)}
                      sx={{ ml: "auto", p: 0 }}
                    />
                  </Flex>
                </Alert>
              )}
            </RegisterContent>
          </Card>
          <Box sx={{ fontSize: 1, textAlign: "center" }}>
            Already have an account?{" "}
            <Styled.a
              as={Link}
              to={{ pathname: "/login", state: location.state }}
              sx={{ color: "primary" }}
            >
              Log in
            </Styled.a>
          </Box>
        </React.Fragment>
      )}
    </CenteredContent>
  );
};

function mapStateToProps(state: State) {
  return {
    user: state.user
  };
}

export default connect(mapStateToProps)(RegistrationScreen);
