import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  businessId: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string; // hashed in the service before persisting

  @IsIn(['owner', 'manager', 'staff'])
  role: 'owner' | 'manager' | 'staff';
}
