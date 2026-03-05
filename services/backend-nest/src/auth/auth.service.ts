import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(data: any) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
        parentProfile: data.role === 'PARENT' ? { create: { name: data.name } } : undefined,
        driverProfile: data.role === 'DRIVER' ? { create: { name: data.name } } : undefined,
      },
    });
    return this.issue(user);
  }

  async login(data: any) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return this.issue(user);
  }

  async saveDeviceToken(userId: string, payload: any) {
    return this.prisma.deviceToken.upsert({
      where: { token: payload.token },
      update: { lastSeenAt: new Date(), platform: payload.platform, userId },
      create: { userId, token: payload.token, platform: payload.platform },
    });
  }

  private issue(user: any) {
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return { accessToken, user: { id: user.id, email: user.email, role: user.role } };
  }
}
