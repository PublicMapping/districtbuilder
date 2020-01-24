import { Injectable } from '@nestjs/common';
import { getTestString } from '../../shared/TestFns';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World! - ' + getTestString();
  }
}
