import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthUser, ChildUpsertSchema } from '@ashwa/shared';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma.service';
import { CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARENT')
@Controller('children')
export class ParentsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ChildUpsertSchema))
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.prisma.child.create({ data: { ...body, parentId: user.userId } });
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.child.findMany({ where: { parentId: user.userId } });
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const child = await this.prisma.child.findFirst({ where: { id, parentId: user.userId } });
    if (!child) {
      throw new NotFoundException('Child not found');
    }
    return child;
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(ChildUpsertSchema.partial()))
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    const child = await this.prisma.child.findFirst({ where: { id, parentId: user.userId } });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    return this.prisma.child.update({ where: { id }, data: body });
  }
}
