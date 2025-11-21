import { describe, expect, it, vi } from 'vitest';
import { attemptRestoreSavedState, validateSavedState, GameResult, Player, Team } from './PennantGame';

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

const buildPlayer = (): Player => ({
  id: 'player-1',
  name: 'Test Player',
  position: 'P',
  age: 24,
  potential: 'A',
  growthExp: 0,
  contact: 50,
  power: 50,
  speed: 50,
  defense: 50,
  control: 50,
  stamina: 50,
  condition: 'normal',
  games: 0,
  atBats: 0,
  hits: 0,
  homeruns: 0,
  rbi: 0,
  innings: 0,
  earnedRuns: 0,
  wins: 0,
  losses: 0,
  saves: 0,
});

const buildTeam = (): Team => ({
  id: 'team-1',
  name: 'Team One',
  short: 'T1',
  color: 'color',
  textColor: 'text',
  border: 'border',
  softBg: 'soft',
  players: [buildPlayer()],
  wins: 0,
  losses: 0,
  draws: 0,
  runsScored: 0,
  runsAllowed: 0,
});

type SavedState = {
  teams: Team[];
  currentDay: number;
  gameHistory: GameResult[];
  isPlaying: boolean;
  selectedTeamId: string;
  gameSpeed: number;
};

const buildState = (overrides: Partial<SavedState> = {}): SavedState => ({
  teams: [buildTeam()],
  currentDay: 1,
  gameHistory: [],
  isPlaying: false,
  selectedTeamId: 'team-1',
  gameSpeed: 500,
  ...overrides,
});

describe('validateSavedState', () => {
  it('accepts well-formed saved payloads', () => {
    const validState = buildState();
    const result = validateSavedState(validState);

    expect(result).toMatchObject({
      teams: validState.teams,
      currentDay: validState.currentDay,
      gameHistory: validState.gameHistory,
    });
  });
});

describe('attemptRestoreSavedState', () => {
  const storageKey = 'pennantGameState';

  it('clears corrupted payloads and resets the season', () => {
    const storage = new MockStorage();
    const resetSeason = vi.fn();
    const corruptedState = buildState();
    corruptedState.teams[0] = {
      ...corruptedState.teams[0],
      players: [{ ...buildPlayer(), position: 'INVALID' as Player['position'] }],
    };

    storage.setItem(storageKey, JSON.stringify(corruptedState));

    const result = attemptRestoreSavedState(storage, storageKey, resetSeason);

    expect(result).toBeNull();
    expect(storage.getItem(storageKey)).toBeNull();
    expect(resetSeason).toHaveBeenCalledTimes(1);
  });

  it('handles malformed JSON gracefully', () => {
    const storage = new MockStorage();
    const resetSeason = vi.fn();
    storage.setItem(storageKey, '{bad json');

    const result = attemptRestoreSavedState(storage, storageKey, resetSeason);

    expect(result).toBeNull();
    expect(storage.getItem(storageKey)).toBeNull();
    expect(resetSeason).toHaveBeenCalledTimes(1);
  });

  it('returns validated data without clearing storage', () => {
    const storage = new MockStorage();
    const resetSeason = vi.fn();
    const validState = buildState();

    storage.setItem(storageKey, JSON.stringify(validState));

    const result = attemptRestoreSavedState(storage, storageKey, resetSeason);

    expect(result).not.toBeNull();
    expect(result?.teams[0].id).toBe('team-1');
    expect(resetSeason).not.toHaveBeenCalled();
    expect(storage.getItem(storageKey)).not.toBeNull();
  });
});
