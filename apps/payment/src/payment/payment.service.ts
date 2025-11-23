import { Injectable, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from './entity/payment.entity';
import { Repository } from 'typeorm';
import { MakePaymentDto } from './dto/make-payment.dto';

@Injectable()
export class PaymentService {

constructor(
  @InjectRepository(Payment)
  private readonly paymentRepository: Repository<Payment>
){}

async makePayment(
  payload: MakePaymentDto
){
  let paymentId


  try{
   const result = await this.paymentRepository.save(payload)
   
   paymentId = result.id

   await this.processPayment();

   await this.updatePaymentStatus(result.id, PaymentStatus.approved)
  // TODO: notification send

  return this.paymentRepository.findOneBy({id: result.id})
}catch(e) {
  await this.updatePaymentStatus(paymentId, PaymentStatus.rejected)
}
}

async processPayment() {
  await new Promise((resolve) => setTimeout(resolve, 1000)) 
}

async updatePaymentStatus(id: string, status: PaymentStatus) {
  this.paymentRepository.update({
    id,
  }, {
    paymentStatus: status
  }
)
}
}
