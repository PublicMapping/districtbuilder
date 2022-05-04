import { compose, createStore, applyMiddleware } from "redux";
import { composeWithDevTools } from "redux-devtools-extension/developmentOnly";
import { install, StoreCreator } from "redux-loop";
import { getType } from "typesafe-actions";
import { redo, undo } from "./actions/districtDrawing";
import GTM from "./GTM";
import rootReducer, { initialState } from "./reducers";

const enhancedCreateStore = createStore as StoreCreator;
const composeEnhancers = composeWithDevTools({
  actionSanitizer: action => {
    if (action.type === getType(undo) || action.type === getType(redo)) {
      return { ...action, payload: "map object" };
    } else {
      return action;
    }
  }
});

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
