import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { getRuntimeEnv } from '../config';

@Module({
  imports: [PassportModule, JwtModule.register({ secret: getRuntimeEnv().JWT_SECRET, signOptions: { expiresIn: '7d' } })],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
