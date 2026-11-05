import type { UnitKind } from '../config/balance';

export type Team = 'player' | 'enemy' | 'neutral';

export type EntityId = number;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Unit {
  id: EntityId;
  kind: UnitKind;
  team: Team;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  targetId: EntityId | null;
  moveTarget: Vec2 | null;
  gatherNodeId: EntityId | null;
  carrying: number;
  attackCd: number;
  selected: boolean;
  radius: number;
  speed: number;
  dmg: number;
  range: number;
  vision: number;
  canGather: boolean;
}

export type BuildingKind = 'keep' | 'barracks';

export interface Building {
  id: EntityId;
  kind: BuildingKind;
  team: Team;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  buildProgress: number; // 0..1, 1 = done
  trainQueue: UnitKind[];
  trainProgress: number;
  rally: Vec2;
  selected: boolean;
  radius: number;
}

export interface ForageNode {
  id: EntityId;
  x: number;
  y: number;
  remaining: number;
  radius: number;
}

export interface Wardstone {
  id: EntityId;
  x: number;
  y: number;
  owner: Team;
  captureTeam: Team | null;
  captureProgress: number; // 0..1
  radius: number;
}

export interface TeamState {
  forage: number;
  aura: number;
  holdTimerMs: number;
}

export type MatchOutcome =
  | { kind: 'playing' }
  | { kind: 'win'; reason: 'wardstones' | 'keep' }
  | { kind: 'loss'; reason: 'wardstones' | 'keep' };

export interface World {
  nextId: EntityId;
  units: Unit[];
  buildings: Building[];
  forageNodes: ForageNode[];
  wardstones: Wardstone[];
  player: TeamState;
  enemy: TeamState;
  outcome: MatchOutcome;
  elapsedMs: number;
  coach: string;
}
