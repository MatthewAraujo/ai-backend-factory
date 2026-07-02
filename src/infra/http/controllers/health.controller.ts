import { EnvService } from '@/infra/env/env.service';
import { Inject } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor(@Inject(EnvService) private readonly envService: EnvService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: 'ai-backend-factory',
      environment: this.envService.nodeEnv,
      timestamp: new Date().toISOString(),
    };
  }
}
