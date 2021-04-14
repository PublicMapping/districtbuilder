import { Controller, UseGuards } from "@nestjs/common";
import { Crud, CrudAuth, CrudController } from "@nestjsx/crud";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { User } from "../entities/user.entity";
import { UpdateUserDataDto } from "../entities/update-user.dto";
import { UsersService } from "../services/users.service";

@Crud({
  model: {
    type: User
  },
  query: {
    exclude: ["passwordHash"],
    join: {
      organizations: {
        allow: ["slug", "name", "logoUrl"],
        eager: true
      }
    }
  },
  routes: {
    only: ["getOneBase", "updateOneBase"]
  },
  dto: {
    update: UpdateUserDataDto
  },
  params: {
    id: {
      type: "uuid",
      primary: true,
      disabled: true
    }
  }
})
@CrudAuth({
  property: "user",
  filter: (user: User) => {
    return {
      id: user ? user.id : undefined
    };
  }
})
@UseGuards(JwtAuthGuard)
@Controller("api/user")
// @ts-ignore
export class UsersController implements CrudController<User> {
  constructor(public service: UsersService) {}
}
