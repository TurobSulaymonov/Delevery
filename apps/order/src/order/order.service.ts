import { AddressDto } from './dto/address.dto';
import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { PAYMENT_SERVICE, PRODUCT_SERVICE, USER_SERRVICE } from '@app/common';
import { PaymentCancelledException } from './exception/payment-cancelled.exception';
import { Product } from './entity/product.entity';
import { Customer } from './entity/customer.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderStatus } from './entity/order.entity';
import { Model } from 'mongoose';
import { PaymentDto } from './dto/payments.dto';
import { Payment } from './entity/payment.entity';
import { PaymentFailedException } from './exception/payment-failed.exception';

@Injectable()
export class OrderService {
  constructor(
    @Inject(USER_SERRVICE)
    private readonly userService: ClientProxy,
    @Inject(PRODUCT_SERVICE)
    private readonly productService: ClientProxy,
    @Inject(PAYMENT_SERVICE)
    private readonly paymentService: ClientProxy,
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, token: string) {
    const {productIds, address, payment} = createOrderDto;

    // 1) 사용자 정보 가져오기
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.getUserFromToken(token);
    
    // 2) 상품 정보 가져오기
    const products = await this.getProductByIds(productIds)

    // 3) 총 금액 개산하기
    const totalAmount = this.calculateTotalAmount(products)
    
    // 4) 금액 검증하기 => total이 맞는지 (프론트에서 보내준 데이터랑)
     this.validatePaymentAmount(totalAmount, payment.amount)
    
     // 5) 주문 생성하기 = 데이터베이스에 넣기 
     const customer = this.createCustomer(user);
     const order = await this.createNewOrder(customer, products, address, payment)

    // 6) 결제 시도하기
    const processPayment = await this.processPayment(order._id.toString(), payment, user.email)
    // 7) 결과 반환하기
    return this.orderModel.findById(order._id)
  }

  private async getUserFromToken(token: string) {
    // 1) User MS : JWT 토큰 검증
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const resp = await lastValueFrom(
      this.userService.send({ cmd: 'parse_bearer_token' }, { token }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (resp.status === 'error') {
      throw new PaymentCancelledException(resp);
    }

  
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

  private async getProductByIds(productIds: string[]) : Promise<Product[]> {
    const pResp = await lastValueFrom(this.productService.send({cmd: 'get_products_info'},{productIds}))

    if (pResp.status === 'error') {
      throw new PaymentCancelledException('상품 정보 잘못됐습니다!')
    }

    return pResp.data.map((product) => ({
      productId: product.id,
      name: product.name,
      price: product.price
    }))

  }

  private calculateTotalAmount(product: Product[]) {
    return product.reduce((acc, next) => acc + next.price, 0)
  }

  private validatePaymentAmount (totalA: number, totalB: number) {
    if(totalA !== totalB) {
      throw new PaymentCancelledException('결제하려는 금액이 변경됐습니다!')
    }
  }

  private createCustomer(user: {id: string, email: string, name: string}){
    return {
      userId: user.id,
      email: user.email,
      name: user.name
    }
  }

  private createNewOrder(customer: Customer, products: Product[], deliveryAddress: AddressDto, payment: PaymentDto) {
   return this.orderModel.create({
    customer,
    products,
    deliveryAddress,
    payment,
   })
  }
private async processPayment(
  orderId: string,
  payment: PaymentDto,
  userEmail: string
) {
  try {
    // 1) Payment MS-ga so‘rov jo‘natish
    const resp = await lastValueFrom(
      this.paymentService.send(
        { cmd: 'make_payment' },
        { ...payment, userEmail , orderId},
        
        
      )
    );

    if (resp.status === 'error') {
      throw new PaymentFailedException(resp.error || '결제 오류가 발생했습니다.');
    }

    const status = resp.data?.paymentStatus || resp.paymentStatus;

    // 2) Pending bo‘lsa -> order holati PaymentPending
    if (status === 'Pending') {
      await this.orderModel.findByIdAndUpdate(orderId, {
        status: OrderStatus.paymentPending,
      });

      return {
        status: 'pending',
        message: '결제가 진행 중입니다.',
      };
    }

    // 3) Approved bo‘lsa -> success
    if (status === 'Approved') {
      await this.orderModel.findByIdAndUpdate(orderId, {
        status: OrderStatus.paymentProcessed,
      });

      return {
        status: 'success',
        message: '결제가 완료되었습니다.',
        data: resp.data,
      };
    }

    // 4) Boshqa holatlar → Rejected, Failed, Error
    await this.orderModel.findByIdAndUpdate(orderId, {
      status: OrderStatus.paymentFailed,
    });

    throw new PaymentFailedException('결제가 승인되지 않았습니다.');

  } catch (e) {
    // 5) General catch
    if (e instanceof PaymentFailedException) {
      await this.orderModel.findByIdAndUpdate(orderId, {
        status: OrderStatus.paymentFailed,
      });
    }

    throw e;
  }
}

changeOrderStatus(orderId: string, status: OrderStatus) {
  return this.orderModel.findByIdAndUpdate(orderId, {status})
}

}
