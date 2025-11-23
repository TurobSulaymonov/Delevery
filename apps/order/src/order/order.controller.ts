import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Authorization } from 'apps/gateway/src/auth/decorator/authorization.decorator';
import { CreateOrderDto } from './dto/create-order';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RpcInterceptor } from '@app/common/interceptor/rpc.interceptor';
import { DeliveryStartedDto } from './dto/delivery.-started.dto';
import { OrderStatus } from './entity/order.entity';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UsePipes(ValidationPipe)
  async createOrder(
    @Authorization() token: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(createOrderDto, token);
  }

  @EventPattern({cmd: 'delivery_started'})
  @UseInterceptors(RpcInterceptor)
  async deliveryStarted(@Payload() payload: DeliveryStartedDto) {
    await this.orderService.changeOrderStatus(payload.id, OrderStatus.deliveryStarted)
  }
}
