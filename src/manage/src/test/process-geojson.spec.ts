import { abbreviateNumber } from "../commands/process-geojson";

describe("process geojson", () => {
  it("should abbreviate numbers", () => {
    expect(abbreviateNumber(0)).toEqual("0");
  });
});
