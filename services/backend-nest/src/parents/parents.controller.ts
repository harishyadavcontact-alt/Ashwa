import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PARENT')
@Controller('children')
export class ParentsController {
  constructor(private prisma: PrismaService) {}
  @Post() create(@Req() req: any, @Body() body: any) { return this.prisma.child.create({ data: { ...body, parentId: req.user.userId } }); }
  @Get() list(@Req() req: any) { return this.prisma.child.findMany({ where: { parentId: req.user.userId } }); }
  @Get(':id') get(@Req() req: any, @Param('id') id: string) { return this.prisma.child.findFirst({ where: { id, parentId: req.user.userId } }); }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.prisma.child.update({ where: { id, parentId: req.user.userId } as any, data: body }); }
}
