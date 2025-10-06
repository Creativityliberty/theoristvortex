
import type { EquationParams, GridConfig } from './types';

export const GRID_CONFIG: GridConfig = {
  nx: 64,
  ny: 64,
  lx: 1.0,
  ly: 1.0,
  dt: 0.0005,
  n_steps: 300,
  get dx() { return this.lx / (this.nx - 1); },
  get dy() { return this.ly / (this.ny - 1); },
};

export const INITIAL_EQUATION_PARAMS: EquationParams = {
  D: 0.01,
  omega: 2.0,
  source_amp: 0.0,
  damping: 0.01,
};

export const VALIDATION_THRESHOLDS = {
  max_mass_drift: 0.05,
  max_energy_drift: 0.10,
  max_mass_variance: 0.02,
  max_cfl: 0.25,
  max_value_threshold: 1e6,
  min_diffusion: 1e-6,
  max_rotation_speed: 100.0,
  min_score_accept: 0.75,
  min_score_reject: 0.3,
};

export const MAX_ITERATIONS = 10;
