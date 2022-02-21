declare module "JSONStream" {
  export function parse(path?: string): any;
}

declare module "lru-cache" {
  class LRUCache<K, V> {
    constructor(opt: any);
    get(k: K): V;
    set(k: K, v: V): boolean;
  }
  export = LRUCache;
}
