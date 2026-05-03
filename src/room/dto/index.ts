import { Transform, Type } from 'class-transformer';
import { IsString, Length, Matches, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { GameType } from '../../../prisma/generated/prisma/client.js';
import { PartialRoleConfig } from '../role-config.schema';
import { SgsRoleConfig } from '../sgs-role-assigner';

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
  targetUserId: string;
}

export class KickRoomBodyDto {
  @IsString()
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
  @IsString()
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
