import { Controller, Post, Req, Res, HttpService } from "@nestjs/common";

const apiKey = process.env.ROOMSERVICE_API_KEY;

@Controller("api/roomservice")
export class RoomserviceController {
  constructor(private readonly httpService: HttpService) {}

  @Post()
  async connect(@Req() req: any, @Res() res: any) {
    const { room, user } = req.body;

    const resources = [{ object: "room", reference: room, permission: "join" }];

    const { data } = await this.httpService
      .post(
        "https://super.roomservice.dev/provision",
        { user, resources },
        { headers: { Authorization: `Bearer ${process.env.ROOMSERVICE_API_KEY}` } }
      )
      .toPromise();

    res.json(data);
  }
}
