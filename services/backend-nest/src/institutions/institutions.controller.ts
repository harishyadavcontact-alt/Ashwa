import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('institutions')
export class InstitutionsController {
  constructor(private prisma: PrismaService) {}
  @Get() list() { return this.prisma.institution.findMany(); }
}
