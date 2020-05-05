import { Errors } from "../shared/types";

export interface ResourceEditing<D> {
  readonly data: D;
}
export interface ResourcePending {
  readonly isPending: boolean;
}
export interface ResourceSuccess<T> {
  readonly resource: T;
}
export interface ResourceFailure {
  readonly errorMessage: string;
}
export interface ResourceWritePending<D> {
  readonly data: D;
  readonly isPending: true;
}
export interface ResourceWriteSuccess<D, T> {
  readonly data: D;
  readonly resource: T;
}
export interface ResourceWriteFailure<D> {
  readonly data: D;
  readonly errors: Errors<D>;
}

export type Resource<T> = ResourcePending | ResourceSuccess<T> | ResourceFailure;

export type WriteResource<D, T> =
  | ResourceEditing<D>
  | ResourceWritePending<D>
  | ResourceWriteSuccess<D, T>
  | ResourceWriteFailure<D>;
