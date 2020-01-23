import { compose, createStore } from "redux";
import { install, StoreCreator } from "redux-loop";
import rootReducer, { initialState } from "./reducers";

const enhancedCreateStore = createStore as StoreCreator;
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

/* tslint:disable:no-unused-declaration */
declare global {
  interface Window {
    readonly __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}
/* tslint:enable */

export default enhancedCreateStore(rootReducer, initialState, composeEnhancers(install()));
