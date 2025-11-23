import { NOTIFICATION_SERVICE } from './../../../libs/common/src/const/services';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { PaymentModule } from './payment/payment.module';
import { } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DB_URL: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.getOrThrow('DB_URL'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    ClientsModule.registerAsync({
          clients: [
            {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              name: NOTIFICATION_SERVICE,
              useFactory: (configService: ConfigService) => ({
                transport: Transport.TCP,
                options: {
                  host: configService.getOrThrow<string>('NOTIFICATION_HOST'),
                  port: configService.getOrThrow<number>('NOTIFIFCATION_TCP_PORT'),
                },
              }),
              inject: [ConfigService],
            },
            
          ],
          isGlobal: true,
        }),

    PaymentModule,
  ],
})
export class AppModule {}
