import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-dto';
import { Authorization } from '../../../gateway/src/auth/decorator/authorization.decorator';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ParseBearerTokenDto } from './dto/parse-bearer-token.dto';
import { RpcInterceptor } from '@app/common/interceptor/rpc.interceptor';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post('register')
  // registerUser(
  //   @Authorization() token: string,
  //   @Body() registerDto: RegisterDto,
  // ) {
  //   if (token === null) {
  //     throw new UnauthorizedException(' Token expired');
  //   }

  //   return this.authService.register(token, registerDto);
  // }
  // @Post('login')
  // @UsePipes(ValidationPipe)
  // loginUser(@Authorization() token: string) {
  //   if (token === null) {
  //     throw new UnauthorizedException('토큰을 입력해주세요');
  //   }

  //   return this.authService.login(token);
  // }

 @MessagePattern({ cmd: 'register' })
async registerUser(@Payload() registerDto: RegisterDto) {
  const { token, ...data } = registerDto;

  if (!token) {
    throw new UnauthorizedException('Token expired');
  }

  // TODO: register logic
  const user = await this.authService.register(token, registerDto);

  return {
    user,
  };
}
@MessagePattern({ cmd: 'login' })
loginUser(@Payload() loginDto: LoginDto) {
   const {token} = loginDto
  if (token === null) {
  throw new UnauthorizedException('토큰을 입력해주세요');
  }

  return this.authService.login(token);
  }

}