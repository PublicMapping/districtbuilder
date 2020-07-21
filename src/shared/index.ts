/*
 * Set which enforces uniqueness among objects values contained within it.
 */
export class UniqueObjectsSet extends Set {
  constructor(values: object[]) {
    super(values);
    const objects: object[] = [];
    for (let value of this) {
      if (objects.map(obj => JSON.stringify(obj)).includes(JSON.stringify(value))) {
        this.delete(value);
      } else {
        objects.push(value);
      }
    }
  }
}
