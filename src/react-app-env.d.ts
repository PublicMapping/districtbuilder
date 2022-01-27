/// <reference types="react-scripts" />

declare module "workerize-loader-5!*" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyFunction = (...args: readonly any[]) => any;
  type Async<F extends AnyFunction> = (...args: Parameters<F>) => Promise<ReturnType<F>>;

  type Workerized<T> = Worker & { [K in keyof T]: T[K] extends AnyFunction ? Async<T[K]> : never };

  function createInstance<T>(): Workerized<T>;
  export = createInstance;
}
