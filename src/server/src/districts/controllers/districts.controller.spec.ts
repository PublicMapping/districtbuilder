import { Test, TestingModule } from "@nestjs/testing";
import { DistrictsController } from "./districts.controller";

describe("Districts Controller", () => {
  let controller: DistrictsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DistrictsController]
    }).compile();

    controller = module.get<DistrictsController>(DistrictsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
