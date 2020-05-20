import { Cmd, Loop, loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";
import {
  staticMetadataFetch,
  staticMetadataFetchFailure,
  staticMetadataFetchSuccess
} from "../actions/staticMetadata";

import { IStaticMetadata } from "../../shared/entities";
import { Resource } from "../resource";
import { fetchStaticMetadata } from "../s3";

export type StaticMetadataState = Resource<IStaticMetadata>;

export const initialState = {
  isPending: false
};

const staticMetadataReducer: LoopReducer<StaticMetadataState, Action> = (
  state: StaticMetadataState = initialState,
  action: Action
): StaticMetadataState | Loop<StaticMetadataState, Action> => {
  switch (action.type) {
    case getType(staticMetadataFetch):
      return loop(
        {
          isPending: true
        },
        Cmd.run(fetchStaticMetadata, {
          successActionCreator: staticMetadataFetchSuccess,
          failActionCreator: staticMetadataFetchFailure,
          args: [action.payload] as Parameters<typeof fetchStaticMetadata>
        })
      );
    case getType(staticMetadataFetchSuccess):
      return {
        resource: action.payload
      };
    case getType(staticMetadataFetchFailure):
      return {
        errorMessage: action.payload
      };
    default:
      return state;
  }
};

export default staticMetadataReducer;
