import React from "react";
import * as H from "history";
import { BrowserRouter as Router, Redirect, Route, RouteProps, Switch } from "react-router-dom";
import { ThemeProvider } from "theme-ui";

import { getJWT, jwtIsExpired } from "./jwt";
import Toast from "./components/Toast";
import ActivateAccountScreen from "./screens/ActivateAccountScreen";
import CreateProjectScreen from "./screens/CreateProjectScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import HomeScreen from "./screens/HomeScreen";
import ImportProjectScreen from "./screens/ImportProjectScreen";
import LoginScreen from "./screens/LoginScreen";
import OrganizationScreen from "./screens/OrganizationScreen";
import OrganizationAdminScreen from "./screens/OrganizationAdminScreen";
import ProjectScreen from "./screens/ProjectScreen";
import RegistrationScreen from "./screens/RegistrationScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import theme from "./theme";

import "./App.css";
import StartProjectScreen from "./screens/StartProjectScreen";
import PublishedMapsListScreen from "./screens/PublishedMapsListScreen";
import { PushReplaceHistory, QueryParamProvider } from "use-query-params";
import { createBrowserHistory } from "history";

const PrivateRoute = ({ children, ...props }: RouteProps) => {
  const savedJWT = getJWT();
  const notLoggedIn = !savedJWT || jwtIsExpired(savedJWT);
  return (
    <Route
      {...props}
      render={({ location }: { readonly location: H.Location }) => {
        return notLoggedIn ? (
          <Redirect to={{ pathname: "/login", state: { from: location } }} />
        ) : (
          children
        );
      }}
    />
  );
};

const history = createBrowserHistory();
const pushReplaceHistory: PushReplaceHistory = {
  push: (location: Location): void => {
    history.push(location);
  },
  replace: (location: Location): void => {
    history.replace(location);
  },
  location: window.location
};

const App = () => (
  <ThemeProvider theme={theme}>
    <Toast />
    <Router>
      <QueryParamProvider history={pushReplaceHistory}>
        <Switch>
          <PrivateRoute path="/" exact={true}>
            <HomeScreen />
          </PrivateRoute>
          <Route path="/o/:organizationSlug" exact={true} component={OrganizationScreen} />
          <PrivateRoute path="/o/:organizationSlug/admin" exact={true}>
            <OrganizationAdminScreen />
          </PrivateRoute>
          <Route path="/projects/:projectId" exact={true} component={ProjectScreen} />
          <Route path="/login" exact={true} component={LoginScreen} />
          <Route path="/maps" exact={true} component={PublishedMapsListScreen} />
          <Route path="/register" exact={true} component={RegistrationScreen} />
          <Route path="/forgot-password" exact={true} component={ForgotPasswordScreen} />
          <Route path="/activate/:token" exact={true} component={ActivateAccountScreen} />
          <Route
            path="/activate/:token/:organizationSlug"
            exact={true}
            component={ActivateAccountScreen}
          />
          <Route path="/password-reset/:token" exact={true} component={ResetPasswordScreen} />
          <PrivateRoute path="/create-project" exact={true}>
            <CreateProjectScreen />
          </PrivateRoute>
          <PrivateRoute path="/start-project" exact={true}>
            <StartProjectScreen />
          </PrivateRoute>
          <PrivateRoute path="/import-project" exact={true}>
            <ImportProjectScreen />
          </PrivateRoute>
        </Switch>
      </QueryParamProvider>
    </Router>
  </ThemeProvider>
);

export default App;
