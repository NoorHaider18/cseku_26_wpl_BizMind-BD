import { Module } from '@nestjs/common';
import { ProcurementService } from './procurement.service.js';
import { ProcurementController } from './procurement.controller.js';

@Module({
  controllers: [ProcurementController],
  providers: [ProcurementService],
})
export class ProcurementModule {}
