import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

// This guard is for use in a view that's accessible to both logged in
// and not logged in users, but we optionally want to have access to
// user information in order to drive what's being returned.
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  handleRequest<T>(_err: any, user: T): T {
    return user;
  }
}
