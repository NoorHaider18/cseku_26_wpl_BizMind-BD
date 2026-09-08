import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  businessId: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(['owner', 'manager', 'staff'])
  role: 'owner' | 'manager' | 'staff';
}
