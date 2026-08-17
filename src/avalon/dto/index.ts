/**
 * 阿瓦隆游戏 DTO 定义
 */

import { Transform } from 'class-transformer';
import { IsString, IsArray, IsEnum, IsNotEmpty, ArrayMinSize, ArrayMaxSize, Length, Matches } from 'class-validator';

class RoomCodeDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z]{6}$/)
  roomCode!: string;
}

/**
 * 提议任务队伍
 */
export class ProposeTeamDto extends RoomCodeDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  selectedPlayerIds!: string[];
}

/**
 * 提交组队投票
 */
export class SubmitTeamVoteDto extends RoomCodeDto {
  @IsEnum(['approve', 'reject'])
  vote!: 'approve' | 'reject';
}

/**
 * 提交任务行动
 */
export class SubmitQuestActionDto extends RoomCodeDto {
  @IsEnum(['success', 'fail'])
  action!: 'success' | 'fail';
}

/**
 * 刺杀梅林
 */
export class AssassinateDto extends RoomCodeDto {
  @IsString()
  @IsNotEmpty()
  targetPlayerId!: string;
}

/**
 * 获取玩家视角
 */
export class GetPlayerViewDto extends RoomCodeDto {}

/**
 * 房主确认身份揭示结束，进入组队
 */
export class BeginGameDto extends RoomCodeDto {}
