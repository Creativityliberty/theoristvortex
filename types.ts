
export interface EquationParams {
  D: number;
  omega: number;
  source_amp: number;
  damping: number;
}

export interface EquationSpec {
  name: string;
  params: EquationParams;
}

export interface GridConfig {
  nx: number;
  ny: number;
  lx: number;
  ly: number;
  dt: number;
  n_steps: number;
  dx: number;
  dy: number;
}

export interface SimMetrics {
  stable: boolean;
  mass_drift: number;
  energy_drift: number;
  mass_variance: number;
  max_value: number;
  cfl_number: number;
  n_steps_completed: number;
}

export interface Evaluation {
  score: number;
  decision: 'accept' | 'revise' | 'reject';
  critiques: string[];
  suggestions: string[];
}

export type AgentName = 'Theorist' | 'Simulator' | 'Refutator';

export type AgentStatus = 'idle' | 'running' | 'success' | 'failure';

export interface IterationLog {
  iteration: number;
  equationSpec: EquationSpec;
  simMetrics: SimMetrics;
  evaluation: Evaluation;
}

export interface HallOfFameEntry {
  name: string;
  score: number;
  params: EquationParams;
}
