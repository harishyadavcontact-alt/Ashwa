import { Body, Controller, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { DeviceTokenSchema, LoginSchema, RegisterSchema } from '@ashwa/shared';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  register(@Body() body: any) {
    return this.auth.register(body);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() body: any) {
    return this.auth.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('device-token')
  @UsePipes(new ZodValidationPipe(DeviceTokenSchema))
  deviceToken(@Req() req: any, @Body() body: { token: string; platform: string }) {
    return this.auth.saveDeviceToken(req.user.userId, body);
  }
}
