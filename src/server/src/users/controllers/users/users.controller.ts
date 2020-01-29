import { Controller } from "@nestjs/common";
import { Crud, CrudController } from "@nestjsx/crud";
import { User } from "../../entities/user.entity";
import { UsersService } from "../../services/users/users.service";

@Crud({
  model: {
    type: User
  }
})
@Controller("users")
export class UsersController implements CrudController<User> {
  constructor(public service: UsersService) {}
}
