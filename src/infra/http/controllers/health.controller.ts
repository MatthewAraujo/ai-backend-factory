import { Controller, Get } from '@nestjs/common';

import { EnvService } from '@/infra/env/env.service';

@Controller('health')
export class HealthController {
  constructor(private readonly envService: EnvService) {}

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

