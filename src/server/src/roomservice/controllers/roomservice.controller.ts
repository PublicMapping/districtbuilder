import { Controller, Post, Req, Res, HttpService } from "@nestjs/common";

@Controller("api/roomservice")
export class RoomserviceController {
  constructor(private readonly httpService: HttpService) {}

  @Post("/connect")
  async connect(@Req() req: any, @Res() res: any) {
    const { project, user } = req.body;

    const resources = [{ object: "room", reference: project, permission: "join" }];

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
