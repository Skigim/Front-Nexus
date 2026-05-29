import { type Player } from './types';

/** Win rate as a 0–1 fraction; 0 when the player has no recorded matches. */
export function winRate(player: Pick<Player, 'wins' | 'losses'>): number {
  const wins = player.wins || 0;
  const losses = player.losses || 0;
  const total = wins + losses;
  return total === 0 ? 0 : wins / total;
}
