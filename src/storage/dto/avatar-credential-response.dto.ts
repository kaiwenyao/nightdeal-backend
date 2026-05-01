import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class AvatarCredentialResponseDto {
  @ApiProperty() accessKeyId: string;
  @ApiPropertyOptional() securityToken?: string;
  @ApiProperty() policy: string;
  @ApiProperty() signature: string;
  @ApiProperty() key: string;
  @ApiProperty() bucket: string;
  @ApiProperty() region: string;
  @ApiProperty() host: string;
  @ApiProperty() expiredTime: number;
  @ApiProperty() publicUrl: string;
}
