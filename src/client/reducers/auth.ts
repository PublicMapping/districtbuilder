import { createReducer } from "typesafe-actions";

import { Action } from "../actions";
import { showPasswordResetNotice } from "../actions/auth";

export interface AuthState {
  readonly passwordResetNoticeShown: boolean;
}

export const initialState: AuthState = { passwordResetNoticeShown: false };

const authReducer = createReducer<AuthState, Action>(initialState).handleAction(
  showPasswordResetNotice,
  (state, action) => ({
    passwordResetNoticeShown: action.payload
  })
);

export default authReducer;
