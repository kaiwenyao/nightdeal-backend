import { Transform, Type } from 'class-transformer';
import { IsString, Length, Matches, IsOptional, IsNumber, Min, Max, IsEnum, Validate, IsNotEmpty } from 'class-validator';
import { GameType } from '../../../prisma/generated/prisma/client.js';
import { PartialRoleConfig } from '../role-config.schema';
import { SgsRoleConfig } from '../sgs-role-assigner';
import { IsAvatarUrlConstraint } from '../../auth/dto/update-profile.dto';

export class JoinRoomDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z]{6}$/, { message: '房间码格式无效' })
  roomCode: string;
}

export class LeaveRoomDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z]{6}$/, { message: '房间码格式无效' })
  roomCode: string;
}

export class StartGameDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z]{6}$/, { message: '房间码格式无效' })
  roomCode: string;
}

export class KickPlayerDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z]{6}$/, { message: '房间码格式无效' })
  roomCode: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  targetUserId: string;
}

export class KickRoomBodyDto {
  @IsString()
  @IsNotEmpty({ message: 'userId 不能为空' })
  @Length(1, 64, { message: 'userId 长度必须在1-64之间' })
  userId: string;
}

export class CreateRoomDto {
  @IsOptional()
  @IsEnum(GameType)
  gameType?: GameType;

  @IsOptional()
  roleConfig?: PartialRoleConfig | Partial<SgsRoleConfig>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2)
  @Max(10)
  maxPlayers?: number;
}

export class UpdatePlayerDto {
  @IsOptional()
  @IsString()
  @Length(1, 20)
  nickName?: string;

  @IsOptional()
  @Validate(IsAvatarUrlConstraint)
  avatarUrl?: string;
}

// DTO for updating room settings via HTTP PATCH
export class UpdateRoomSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2)
  @Max(10)
  maxPlayers?: number;

  @IsOptional()
  roleConfig?: PartialRoleConfig | Partial<SgsRoleConfig>;
}

// WebSocket payload for updating room settings
export class SettingsUpdateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z]{6}$/, { message: '房间码格式无效' })
  roomCode: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2)
  @Max(10)
  maxPlayers?: number;

  @IsOptional()
  roleConfig?: PartialRoleConfig | Partial<SgsRoleConfig>;
}
