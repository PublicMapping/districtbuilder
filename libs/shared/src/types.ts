export type ErrorMap<D> = { readonly [P in keyof D]?: readonly string[] };

export interface Errors<D> {
  readonly error: string;
  readonly message: string | ErrorMap<D>;
}
