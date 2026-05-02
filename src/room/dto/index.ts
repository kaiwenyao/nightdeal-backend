import { IsString, Length, Matches, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { PartialRoleConfig } from '../role-config.schema';

export class JoinRoomDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Za-z0-9]{6}$/, { message: '房间码格式无效' })
  roomCode: string;
}

export class LeaveRoomDto {
  @IsString()
  @Length(6, 6)
  roomCode: string;
}

export class StartGameDto {
  @IsString()
  @Length(6, 6)
  roomCode: string;
}

export class KickPlayerDto {
  @IsString()
  @Length(6, 6)
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
  roleConfig?: PartialRoleConfig;

  @IsOptional()
  @IsNumber()
  @Min(5)
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
  @IsNumber()
  @Min(5)
  @Max(10)
  maxPlayers?: number;

  @IsOptional()
  roleConfig?: PartialRoleConfig;
}

// WebSocket payload for updating room settings
export class SettingsUpdateDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Za-z0-9]{6}$/, { message: '房间码格式无效' })
  roomCode: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(10)
  maxPlayers?: number;

  @IsOptional()
  roleConfig?: PartialRoleConfig;
}
