import { Injectable } from '@nestjs/common';
import { CreateProcurementDto } from './dto/create-procurement.dto.js';
import { UpdateProcurementDto } from './dto/update-procurement.dto.js';

@Injectable()
export class ProcurementService {
  create(createProcurementDto: CreateProcurementDto) {
    return 'This action adds a new procurement';
  }

  findAll() {
    return `This action returns all procurement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} procurement`;
  }

  update(id: number, updateProcurementDto: UpdateProcurementDto) {
    return `This action updates a #${id} procurement`;
  }

  remove(id: number) {
    return `This action removes a #${id} procurement`;
  }
}
