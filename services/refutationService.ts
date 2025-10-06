
import { VALIDATION_THRESHOLDS } from '../constants';
import type { EquationSpec, SimMetrics, GridConfig, Evaluation } from '../types';

export class Refutator {
  private thresholds = VALIDATION_THRESHOLDS;

  public evaluate(equationSpec: EquationSpec, simMetrics: SimMetrics): Evaluation {
    const critiques: string[] = [];
    const suggestions: string[] = [];
    const penalties: number[] = [];

    // 1. Stability
    if (!simMetrics.stable) {
      critiques.push("INSTABILITY detected (NaN/Inf/Explosion)");
      penalties.push(0.7); // Heavy penalty
      suggestions.push("Reduce dt, increase damping, or reduce omega.");
    }

    // 2. Conservation Laws
    if (simMetrics.mass_drift > this.thresholds.max_mass_drift) {
      critiques.push(`Mass drift exceeds threshold (${(simMetrics.mass_drift * 100).toFixed(1)}%)`);
      penalties.push(0.15);
      suggestions.push("Check source/damping terms or boundary conditions.");
    }
    if (simMetrics.energy_drift > this.thresholds.max_energy_drift) {
      critiques.push(`Energy drift exceeds threshold (${(simMetrics.energy_drift * 100).toFixed(1)}%)`);
      penalties.push(0.1);
      suggestions.push("Increase damping or reduce source term.");
    }
    if (simMetrics.mass_variance > this.thresholds.max_mass_variance) {
      critiques.push(`Temporal regularity is low (variance: ${simMetrics.mass_variance.toFixed(3)})`);
      penalties.push(0.05);
    }

    // 3. Numerical Coherence
    if (simMetrics.cfl_number > this.thresholds.max_cfl) {
      critiques.push(`CFL condition violated (is ${simMetrics.cfl_number.toFixed(3)}, max ${this.thresholds.max_cfl})`);
      penalties.push(0.2);
      suggestions.push("Reduce diffusion 'D' or timestep 'dt'.");
    }

    // 4. Physical Plausibility
    const { params } = equationSpec;
    if (params.D < this.thresholds.min_diffusion) {
      critiques.push("Diffusion coefficient is too low or negative.");
      penalties.push(0.05);
    }
    if (Math.abs(params.omega) > this.thresholds.max_rotation_speed) {
      critiques.push("Rotation speed is non-physically high.");
      penalties.push(0.1);
      suggestions.push("Reduce 'omega' significantly.");
    }

    // 5. Score Calculation
    const totalPenalty = penalties.reduce((sum, p) => sum + p, 0);
    const score = Math.max(0.0, 1.0 - totalPenalty);

    // 6. Decision
    let decision: 'accept' | 'revise' | 'reject';
    if (!simMetrics.stable || score < this.thresholds.min_score_reject) {
      decision = 'reject';
    } else if (score >= this.thresholds.min_score_accept) {
      decision = 'accept';
    } else {
      decision = 'revise';
    }
    
    if (decision === 'revise' && suggestions.length === 0) {
        suggestions.push("Attempt minor parameter adjustments to improve score.");
    }


    return {
      score,
      decision,
      critiques,
      suggestions: [...new Set(suggestions)], // Unique suggestions
    };
  }
}
