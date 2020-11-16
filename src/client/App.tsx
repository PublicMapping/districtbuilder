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
import LoginScreen from "./screens/LoginScreen";
import ProjectScreen from "./screens/ProjectScreen";
import RegistrationScreen from "./screens/RegistrationScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import theme from "./theme";

import "./App.css";
import StartProjectScreen from "./screens/StartProjectScreen";

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

const App = () => (
  <ThemeProvider theme={theme}>
    <Toast />
    <Router>
      <Switch>
        <PrivateRoute path="/" exact={true}>
          <HomeScreen />
        </PrivateRoute>
        <Route path="/projects/:projectId" exact={true} component={ProjectScreen} />
        <Route path="/login" exact={true} component={LoginScreen} />
        <Route path="/register" exact={true} component={RegistrationScreen} />
        <Route path="/forgot-password" exact={true} component={ForgotPasswordScreen} />
        <Route path="/activate/:token" exact={true} component={ActivateAccountScreen} />
        <Route path="/password-reset/:token" exact={true} component={ResetPasswordScreen} />
        <PrivateRoute path="/create-project" exact={true}>
          <CreateProjectScreen />
        </PrivateRoute>
        <PrivateRoute path="/start-project" exact={true}>
          <StartProjectScreen />
        </PrivateRoute>
      </Switch>
    </Router>
  </ThemeProvider>
);

export default App;
