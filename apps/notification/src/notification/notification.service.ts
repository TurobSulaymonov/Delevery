import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SendPaymentNotificationDto } from './dto/send-payment-notification.dto';
import { Notification } from './entity/notification.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationStatus } from 'apps/payment/src/payment/entity/payment.entity';
import {  ORDER_SERVICE } from '@app/common';
import { ClientGrpcProxy } from '@nestjs/microservices';

@Injectable()
export class NotificationService {

  constructor(
    @InjectModel(Notification.name)
    private readonly notifcationModel: Model<Notification>,
    @Inject(ORDER_SERVICE)
    private readonly orderService: ClientGrpcProxy,
  ){}
  async sendPaymentNotification(data: SendPaymentNotificationDto) {
  // 1) Notification yaratish
  const notification = await this.createNotification(data.to);

  // 2) Email yuborish
  await this.sendEmail();

  // 3) Status yangilash
  await this.updateNotificationStatus(notification._id.toString(), NotificationStatus.sent);

  this.sendDeliveryStartedMessage(data.orderId);

  return this.notifcationModel.findById(notification._id)
}

  async sendDeliveryStartedMessage(id: string){
      this.orderService.emit({
        cmd: 'delivery_started', 
      }, {
        id,
      })
  }


  async updateNotificationStatus(id: string, status: NotificationStatus){
    await this.notifcationModel.findByIdAndUpdate(id, {status})
  }

  async sendEmail() {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  async createNotification (to: string) {
   return await this.notifcationModel.create({
      from: 'turobsulaymonov@gmail.com',
      to: to,
      subject: '배송이 시작됐습니다!',
      content: `${to}님! 주문하신 물건이 배송이 시작됐습니다!`
    })
  }
  
}
