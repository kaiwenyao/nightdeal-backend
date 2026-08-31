/**
 * avalon barrel（index.ts）导出冒烟测试
 * 保证桶文件与子模块的公共导出保持一致
 */

import * as avalonIndex from './index';

describe('avalon barrel (index.ts)', () => {
  it('re-exports the public module surface', () => {
    expect(Object.keys(avalonIndex)).toEqual(expect.arrayContaining([
      // types
      'DEFAULT_AVALON_CONFIG',
      'QUEST_CONFIGS',
      'FACTION_COUNTS',
      // game-engine
      'generateRoles',
      'assignRoles',
      'getFaction',
      'resolveTeamVote',
      'resolveQuest',
      'assassinate',
      'checkWinCondition',
      'getLeaderId',
      'getPlayerFaction',
      'isEvilRole',
      // visibility
      'getPlayerView',
      'shouldPublicTeamVote',
      'isAnonymousQuestVote',
      'getTeamVoteView',
      'getQuestActionView',
      // service / gateway / module
      'AvalonService',
      'AvalonGateway',
      'AvalonModule',
      // dto
      'ProposeTeamDto',
      'SubmitTeamVoteDto',
      'SubmitQuestActionDto',
      'AssassinateDto',
      'GetPlayerViewDto',
      'BeginGameDto',
    ]));
  });

  it('exposes live entities from the concrete modules', () => {
    expect(avalonIndex.DEFAULT_AVALON_CONFIG.publicTeamVote).toBe(true);
    expect(avalonIndex.AvalonModule).toBeDefined();
    expect(avalonIndex.AvalonService).toBeDefined();
    expect(avalonIndex.AvalonGateway).toBeDefined();
    expect(typeof avalonIndex.generateRoles).toBe('function');
    expect(typeof avalonIndex.getPlayerView).toBe('function');
  });
});
