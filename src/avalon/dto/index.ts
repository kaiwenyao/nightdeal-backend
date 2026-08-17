/**
 * 阿瓦隆游戏 DTO 定义
 */

import { IsString, IsArray, IsEnum, IsNotEmpty, ArrayMinSize, ArrayMaxSize } from 'class-validator';

/**
 * 提议任务队伍
 */
export class ProposeTeamDto {
  @IsString()
  @IsNotEmpty()
  roomCode!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  selectedPlayerIds!: string[];
}

/**
 * 提交组队投票
 */
export class SubmitTeamVoteDto {
  @IsString()
  @IsNotEmpty()
  roomCode!: string;

  @IsEnum(['approve', 'reject'])
  vote!: 'approve' | 'reject';
}

/**
 * 提交任务行动
 */
export class SubmitQuestActionDto {
  @IsString()
  @IsNotEmpty()
  roomCode!: string;

  @IsEnum(['success', 'fail'])
  action!: 'success' | 'fail';
}

/**
 * 刺杀梅林
 */
export class AssassinateDto {
  @IsString()
  @IsNotEmpty()
  roomCode!: string;

  @IsString()
  @IsNotEmpty()
  targetPlayerId!: string;
}

/**
 * 获取玩家视角
 */
export class GetPlayerViewDto {
  @IsString()
  @IsNotEmpty()
  roomCode!: string;
}

/**
 * 房主确认身份揭示结束，进入组队
 */
export class BeginGameDto {
  @IsString()
  @IsNotEmpty()
  roomCode!: string;
}
