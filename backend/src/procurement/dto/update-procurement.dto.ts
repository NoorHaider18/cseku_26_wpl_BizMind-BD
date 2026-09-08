import { PartialType } from '@nestjs/mapped-types';
import { CreateProcurementDto } from './create-procurement.dto.js';

export class UpdateProcurementDto extends PartialType(CreateProcurementDto) {}
