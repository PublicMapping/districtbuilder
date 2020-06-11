import React from "react";
import { BrowserRouter as Router, Redirect, Route, RouteProps, Switch } from "react-router-dom";
import { ThemeProvider } from "theme-ui";

import { getJWT, jwtIsExpired } from "./jwt";
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

const PrivateRoute = ({ component, ...props }: RouteProps) => {
  const savedJWT = getJWT();
  return !savedJWT || jwtIsExpired(savedJWT) ? (
    <Redirect to="/login" />
  ) : (
    <Route component={component} {...props} />
  );
};

const App = () => (
  <ThemeProvider theme={theme}>
    <Router>
      <Switch>
        <Route path="/" exact={true} component={HomeScreen} />
        <PrivateRoute path="/projects/:projectId" exact={true} component={ProjectScreen} />
        <Route path="/login" exact={true} component={LoginScreen} />
        <Route path="/register" exact={true} component={RegistrationScreen} />
        <Route path="/forgot-password" exact={true} component={ForgotPasswordScreen} />
        <Route path="/activate/:token" exact={true} component={ActivateAccountScreen} />
        <Route path="/password-reset/:token" exact={true} component={ResetPasswordScreen} />
        <PrivateRoute path="/create-project" exact={true} component={CreateProjectScreen} />
      </Switch>
    </Router>
  </ThemeProvider>
);

export default App;
