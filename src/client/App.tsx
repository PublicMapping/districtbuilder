import React from "react";
import * as H from "history";
import { BrowserRouter as Router, Redirect, Route, RouteProps, Switch } from "react-router-dom";
import { Provider, RollbarContext } from "@rollbar/react";
import Rollbar from "rollbar";
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
import UserAccountScreen from "./screens/UserAccountScreen";
import theme from "./theme";

import "./App.css";
import StartProjectScreen from "./screens/StartProjectScreen";
import PublishedMapsListScreen from "./screens/PublishedMapsListScreen";
import { PushReplaceHistory, QueryParamProvider } from "use-query-params";
import { createBrowserHistory } from "history";
import { DEBUG, ENVIRONMENT } from "../shared/constants";

const PrivateRoute = ({ children, ...props }: { children: React.ReactNode } & RouteProps) => {
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

const rollbarConfig: Rollbar.Configuration = {
  accessToken: process.env.ROLLBAR_CLIENT_ACCESS_TOKEN || "",
  captureUncaught: true,
  captureUnhandledRejections: true,
  enabled: !DEBUG,
  nodeSourceMaps: true,
  payload: {
    environment: ENVIRONMENT.toLowerCase(),
    client: {
      javascript: {
        code_version: "1.18.2",
        source_map_enabled: true
      }
    }
  }
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

const Routes = () => (
  <Router>
    <QueryParamProvider history={pushReplaceHistory}>
      <Switch>
        <PrivateRoute path="/" exact={true}>
          <RollbarContext context="home">
            <HomeScreen />
          </RollbarContext>
        </PrivateRoute>
        <Route path="/o/:organizationSlug" exact={true}>
          <RollbarContext context="organization">
            <OrganizationScreen />
          </RollbarContext>
        </Route>
        <PrivateRoute path="/o/:organizationSlug/admin" exact={true}>
          <RollbarContext context="organization-admin">
            <OrganizationAdminScreen />
          </RollbarContext>
        </PrivateRoute>
        <Route path="/projects/:projectId" exact={true}>
          <RollbarContext context="project">
            <ProjectScreen />
          </RollbarContext>
        </Route>
        <Route path="/login" exact={true}>
          <RollbarContext context="login">
            <LoginScreen />
          </RollbarContext>
        </Route>
        <Route path="/maps" exact={true}>
          <RollbarContext context="published-map-list">
            <PublishedMapsListScreen />
          </RollbarContext>
        </Route>
        <Route path="/register" exact={true}>
          <RollbarContext context="register">
            <RegistrationScreen />
          </RollbarContext>
        </Route>
        <Route path="/forgot-password" exact={true}>
          <RollbarContext context="forgot-password">
            <ForgotPasswordScreen />
          </RollbarContext>
        </Route>
        <Route path="/activate/:token" exact={true}>
          <RollbarContext context="activate-account">
            <ActivateAccountScreen />
          </RollbarContext>
        </Route>
        <Route path="/activate/:token/:organizationSlug" exact={true}>
          <RollbarContext context="activate-account-organization">
            <ActivateAccountScreen />
          </RollbarContext>
        </Route>
        <Route path="/password-reset/:token" exact={true}>
          <RollbarContext context="reset-password">
            <ResetPasswordScreen />
          </RollbarContext>
        </Route>
        <PrivateRoute path="/create-project" exact={true}>
          <RollbarContext context="create-project">
            <CreateProjectScreen />
          </RollbarContext>
        </PrivateRoute>
        <PrivateRoute path="/start-project" exact={true}>
          <RollbarContext context="start-project">
            <StartProjectScreen />
          </RollbarContext>
        </PrivateRoute>
        <PrivateRoute path="/import-project" exact={true}>
          <RollbarContext context="import-project">
            <ImportProjectScreen />
          </RollbarContext>
        </PrivateRoute>
        <PrivateRoute path="/user-account" exact={true}>
          <RollbarContext context="user-account">
            <UserAccountScreen />
          </RollbarContext>
        </PrivateRoute>
      </Switch>
    </QueryParamProvider>
  </Router>
);

const App = () => (
  <Provider config={rollbarConfig}>
    <ThemeProvider theme={theme}>
      <Toast />
      <Routes />
    </ThemeProvider>
  </Provider>
);

export default App;
