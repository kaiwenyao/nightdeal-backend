import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(0, 20)
  nickName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
