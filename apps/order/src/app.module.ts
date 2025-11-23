import { PAYMENT_SERVICE, PRODUCT_SERVICE } from './../../../libs/common/src/const/services';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { OrderModule } from './order/order.module';
import { USER_SERRVICE } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // <-- bu juda muhim
      validationSchema: Joi.object({
        HTTP_PORT: Joi.number().required(),
        USER_HOST: Joi.string().required(),
        USER_TCP_PORT: Joi.number().required(),
        DB_URL: Joi.string().required(),
        PRODUCT_HOST: Joi.string().required(),
        PRODUCT_TCP_PORT: Joi.number().required(),
        PAYMENT_HOST: Joi.string().required(),
        PAYMENT_TCP_PORT: Joi.number().required(),
        
      }),
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('DB_URL'),
      }),
      inject: [ConfigService],
    }),

    ClientsModule.registerAsync({
      clients: [
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          name: USER_SERRVICE,
          useFactory: (configService: ConfigService) => ({
            transport: Transport.TCP,
            options: {
              host: configService.getOrThrow<string>('USER_HOST'),
              port: configService.getOrThrow<number>('USER_TCP_PORT'),
            },
          }),
          inject: [ConfigService],
        },
              {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          name: PRODUCT_SERVICE,
          useFactory: (configService: ConfigService) => ({
            transport: Transport.TCP,
            options: {
              host: configService.getOrThrow<string>('PRODUCT_HOST'),
              port: configService.getOrThrow<number>('PRODUCT_TCP_PORT'),
            },
          }),
          inject: [ConfigService],
        },
                 {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          name: PAYMENT_SERVICE,
          useFactory: (configService: ConfigService) => ({
            transport: Transport.TCP,
            options: {
              host: configService.getOrThrow<string>('PAYMENT_HOST'),
              port: configService.getOrThrow<number>('PAYMENT_TCP_PORT'),
            },
          }),
          inject: [ConfigService],
        },
        
      ],
      isGlobal: true,
    }),
    OrderModule,
  ],
})
export class AppModule {}
