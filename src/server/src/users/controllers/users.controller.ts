import { Controller } from "@nestjs/common";
import { Crud, CrudAuth, CrudController } from "@nestjsx/crud";
import { User } from "../entities/user.entity";
import { UsersService } from "../services/users.service";

@Crud({
  model: {
    type: User
  },
  query: {
    exclude: ["email", "passwordHash"]
  },
  routes: {
    only: ["getOneBase", "updateOneBase"]
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
@Controller("users")
export class UsersController implements CrudController<User> {
  constructor(public service: UsersService) {}
}
