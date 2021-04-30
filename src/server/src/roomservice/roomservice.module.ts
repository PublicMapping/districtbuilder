import { Module } from "@nestjs/common";
import { RoomserviceController } from "./controllers/roomservice.controller";

@Module({
  controllers: [RoomserviceController],
})
export class RoomserviceModule {}
