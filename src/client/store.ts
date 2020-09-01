import { compose, createStore, applyMiddleware } from "redux";
import { install, StoreCreator } from "redux-loop";
import GTM from "./GTM";
import rootReducer, { initialState } from "./reducers";

const enhancedCreateStore = createStore as StoreCreator;
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

declare global {
  interface Window {
    readonly __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

export default enhancedCreateStore(
  rootReducer,
  initialState,
  composeEnhancers(install(), applyMiddleware(GTM))
);
