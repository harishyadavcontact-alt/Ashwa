import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { LoginSchema, RegisterSchema } from '@ashwa/shared/src';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register') register(@Body() body: any) { return this.auth.register(RegisterSchema.parse(body)); }
  @Post('login') login(@Body() body: any) { return this.auth.login(LoginSchema.parse(body)); }

  @UseGuards(JwtAuthGuard)
  @Post('device-token')
  deviceToken(@Req() req: any, @Body() body: { token: string; platform: string }) {
    return this.auth.saveDeviceToken(req.user.userId, body);
  }
}
