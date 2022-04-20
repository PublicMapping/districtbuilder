import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { IUser, JWTPayload } from "@districtbuilder/shared/entities";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(payload: JWTPayload): Promise<IUser> {
    return payload;
  }
}
