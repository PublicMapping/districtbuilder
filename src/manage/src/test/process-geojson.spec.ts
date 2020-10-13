import { abbreviateNumber } from "../commands/process-geojson";

describe("process geojson", () => {
  it("should abbreviate numbers", () => {
    expect(abbreviateNumber(0)).toEqual("0");
    expect(abbreviateNumber(99500)).toEqual("99k");
    expect(abbreviateNumber(999500)).toEqual("999k");
  });
});
