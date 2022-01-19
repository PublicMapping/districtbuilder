/** @jsx jsx */
import { useState } from "react";
import { connect } from "react-redux";
import { Link, Redirect, useLocation } from "react-router-dom";
import { Alert, Box, Card, Close, Flex, Heading, jsx, Themed } from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";

import { IUser } from "../../shared/entities";
import { isUserLoggedIn } from "../jwt";
import { showPasswordResetNotice } from "../actions/auth";
import { LoginContent } from "../components/AuthComponents";
import CenteredContent from "../components/CenteredContent";
import { State } from "../reducers";
import { Resource } from "../resource";
import store from "../store";
import { AuthLocationState } from "../types";

interface StateProps {
  readonly passwordResetNoticeShown: boolean;
  readonly user: Resource<IUser>;
}

const LoginScreen = ({ passwordResetNoticeShown, user }: StateProps) => {
  const isLoggedIn = "resource" in user && isUserLoggedIn();
  const location = useLocation<AuthLocationState>();
  const to = location.state?.from || { pathname: "/" };
  const toParams = new URLSearchParams(to.search);
  const [showStartProjectAlert, setShowStartProjectAlert] = useState(
    to.pathname === "/start-project" && toParams.has("name")
  );

  return isLoggedIn ? (
    <Redirect to={to} />
  ) : (
    <CenteredContent>
      <Heading as="h1" sx={{ textAlign: "center" }}>
        <Logo sx={{ maxWidth: "15rem" }} />
      </Heading>
      <Card sx={{ variant: "cards.floating" }}>
        <LoginContent>
          <Heading as="h2" sx={{ fontSize: 4, mb: 5 }}>
            Log in
          </Heading>
          {showStartProjectAlert && (
            <Alert sx={{ mb: 3 }}>
              <Flex>
                <Box>
                  Log in or{" "}
                  <Themed.a
                    as={Link}
                    sx={{ variant: "links.alert" }}
                    to={{ pathname: "/register", state: location.state }}
                  >
                    sign&nbsp;up
                  </Themed.a>{" "}
                  for a new account to create your &ldquo;{toParams.get("name")}&rdquo; map.
                </Box>
                <Close
                  as="a"
                  onClick={() => setShowStartProjectAlert(false)}
                  sx={{ ml: "auto", p: 0 }}
                />
              </Flex>
            </Alert>
          )}
          {passwordResetNoticeShown && (
            <Alert>
              Your password has been reset
              <Close
                as="a"
                onClick={() => store.dispatch(showPasswordResetNotice(false))}
                sx={{ ml: "auto", p: 0 }}
              />
            </Alert>
          )}
        </LoginContent>
      </Card>
      <Box sx={{ fontSize: 1, mt: 3, textAlign: "center" }}>
        Need an account?{" "}
        <Themed.a as={Link} to={{ pathname: "/register", state: location.state }}>
          Sign up for free
        </Themed.a>
      </Box>
      <Box sx={{ fontSize: 1, textAlign: "center" }}>
        Forgot password?{" "}
        <Themed.a as={Link} to={{ pathname: "/forgot-password", state: location.state }}>
          Password reset
        </Themed.a>
      </Box>
    </CenteredContent>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    passwordResetNoticeShown: state.auth.passwordResetNoticeShown,
    user: state.user
  };
}

export default connect(mapStateToProps)(LoginScreen);
