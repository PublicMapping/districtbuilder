import { Controller, Get } from "@nestjs/common";

const apiKey = process.env.ROOMSERVICE_API_KEY;

@Controller("api/roomservice")
export class RoomserviceController {
    @Get()
    get(): string {
        return `${process.env.ROOMSERVICE_API_KEY}`;
    }
}
