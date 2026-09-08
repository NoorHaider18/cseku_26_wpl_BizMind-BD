import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProcurementService } from './procurement.service.js';
import { CreateProcurementDto } from './dto/create-procurement.dto.js';
import { UpdateProcurementDto } from './dto/update-procurement.dto.js';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post()
  create(@Body() createProcurementDto: CreateProcurementDto) {
    return this.procurementService.create(createProcurementDto);
  }

  @Get()
  findAll() {
    return this.procurementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.procurementService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProcurementDto: UpdateProcurementDto) {
    return this.procurementService.update(+id, updateProcurementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.procurementService.remove(+id);
  }
}
