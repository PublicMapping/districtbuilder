import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Repository } from "typeorm";

import { Register } from "../../../../shared/entities";
import { User } from "../entities/user.entity";

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }

  async create(data: Register): Promise<User> {
    const user = new User(data);
    await user.setPassword(data.password);
    return this.save(user);
  }

  save(user: User): Promise<User> {
    // @ts-ignore
    return this.repo.save(user);
  }
}
