import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { USER_SERRVICE } from '@app/common';
import { PaymentCancelledException } from './exception/payment-cancelled.exception';

@Injectable()
export class OrderService {
  constructor(
    @Inject(USER_SERRVICE)
    private readonly userService: ClientProxy,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, token: string) {
    // 1) 사용자 정보 가져오기
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.getUserFromToken(token);
    console.log('user', user);
  }

  async getUserFromToken(token: string) {
    // 1) User MS : JWT 토큰 검증
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const resp = await lastValueFrom(
      this.userService.send({ cmd: 'parse_bearer_token' }, { token }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (resp.status === 'error') {
      throw new PaymentCancelledException(resp);
    }

    console.log('-----------------');
    console.log('Resp', resp);
    // 2) User MS : 사용자 정보 가져오기
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = resp.data.sub;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const uResp = await lastValueFrom(
      this.userService.send({ cmd: 'get_user_info' }, { userId }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (uResp.status === 'error') {
      throw new PaymentCancelledException(uResp);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return uResp.data;
  }
}
