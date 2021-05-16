import { Module, HttpModule } from "@nestjs/common";
import { RoomserviceController } from "./controllers/roomservice.controller";

@Module({
  imports: [HttpModule],
  controllers: [RoomserviceController]
})
export class RoomserviceModule {}
