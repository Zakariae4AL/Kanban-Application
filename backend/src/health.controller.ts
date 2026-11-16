import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from './auth/decorators';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @SkipThrottle()
  @Get()
  async check() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok' };
  }
}
