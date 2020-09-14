import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import App from "./client/App";
import "./client/index.css";
import store from "./client/store";

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
