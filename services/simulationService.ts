
import type { GridConfig, EquationParams, SimMetrics } from '../types';

export class Solver2D {
  private config: GridConfig;
  private params: EquationParams;
  private u: number[][];
  private time: number;
  private history: { mass: number[]; energy: number[] };
  private X: number[][];
  private Y: number[][];

  constructor(config: GridConfig, params: EquationParams) {
    this.config = config;
    this.params = params;
    this.time = 0.0;
    this.history = { mass: [], energy: [] };

    this.u = Array.from({ length: config.ny }, () => Array(config.nx).fill(0));
    this.X = Array.from({ length: config.ny }, () => Array(config.nx).fill(0));
    this.Y = Array.from({ length: config.ny }, () => Array(config.nx).fill(0));

    const x_coords = Array.from({ length: config.nx }, (_, i) => i * config.dx);
    const y_coords = Array.from({ length: config.ny }, (_, i) => i * config.dy);

    for (let j = 0; j < config.ny; j++) {
      for (let i = 0; i < config.nx; i++) {
        this.X[j][i] = x_coords[i];
        this.Y[j][i] = y_coords[j];
      }
    }
    
    this.setInitialCondition();
  }

  private setInitialCondition() {
    const { lx, ly } = this.config;
    const x0 = lx / 2;
    const y0 = ly / 2;
    const sigma = 0.1;
    for (let j = 0; j < this.config.ny; j++) {
      for (let i = 0; i < this.config.nx; i++) {
        const dx = this.X[j][i] - x0;
        const dy = this.Y[j][i] - y0;
        this.u[j][i] = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      }
    }
    this._recordMetrics();
  }

  private _laplacian(u: number[][]): number[][] {
    const { nx, ny, dx, dy } = this.config;
    const dx2 = dx * dx;
    const dy2 = dy * dy;
    const lap = Array.from({ length: ny }, () => Array(nx).fill(0));

    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const u_xx = (u[j][i + 1] - 2 * u[j][i] + u[j][i - 1]) / dx2;
        const u_yy = (u[j + 1][i] - 2 * u[j][i] + u[j - 1][i]) / dy2;
        lap[j][i] = u_xx + u_yy;
      }
    }
    return lap; // Note: simplified boundary conditions (zero flux)
  }

  private _advectionTerm(u: number[][]): number[][] {
    const { nx, ny, lx, ly, dx, dy } = this.config;
    const { omega } = this.params;
    const x0 = lx / 2;
    const y0 = ly / 2;
    const adv = Array.from({ length: ny }, () => Array(nx).fill(0));

    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const vx = -omega * (this.Y[j][i] - y0);
        const vy = omega * (this.X[j][i] - x0);
        const grad_x = (u[j][i + 1] - u[j][i - 1]) / (2 * dx);
        const grad_y = (u[j + 1][i] - u[j - 1][i]) / (2 * dy);
        adv[j][i] = -(vx * grad_x + vy * grad_y);
      }
    }
    return adv;
  }

  private _sourceTerm(): number[][] {
    const { nx, ny, lx, ly } = this.config;
    const { source_amp } = this.params;
    const source = Array.from({ length: ny }, () => Array(nx).fill(0));
    if (source_amp === 0.0) return source;

    const x0 = lx / 2;
    const y0 = ly / 2;
    const sigma = 0.05;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const dx = this.X[j][i] - x0;
        const dy = this.Y[j][i] - y0;
        source[j][i] = source_amp * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      }
    }
    return source;
  }

  private step(): void {
    const { nx, ny, dt } = this.config;
    const { D, damping } = this.params;

    const diffusion = this._laplacian(this.u);
    const advection = this._advectionTerm(this.u);
    const source = this._sourceTerm();
    
    const du_dt = Array.from({ length: ny }, () => Array(nx).fill(0));

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        du_dt[j][i] = D * diffusion[j][i] + advection[j][i] + source[j][i] - damping * this.u[j][i];
        this.u[j][i] += dt * du_dt[j][i];
      }
    }
    this.time += dt;
    this._recordMetrics();
  }

  private _recordMetrics(): void {
    const { dx, dy } = this.config;
    let mass = 0;
    let energy = 0;
    for (let j = 0; j < this.config.ny; j++) {
      for (let i = 0; i < this.config.nx; i++) {
        mass += this.u[j][i];
        energy += this.u[j][i] * this.u[j][i];
      }
    }
    this.history.mass.push(mass * dx * dy);
    this.history.energy.push(energy * dx * dy);
  }

  public run(): { finalState: number[][]; metrics: SimMetrics } {
    for (let i = 0; i < this.config.n_steps; i++) {
      this.step();
      
      let max_val = 0;
      for (let j = 0; j < this.config.ny; j++) {
        for (let k = 0; k < this.config.nx; k++) {
          if (isNaN(this.u[j][k]) || !isFinite(this.u[j][k])) {
            return { finalState: this.u, metrics: this.getMetrics(i + 1, false) };
          }
          max_val = Math.max(max_val, Math.abs(this.u[j][k]));
        }
      }
      if (max_val > 1e10) {
        return { finalState: this.u, metrics: this.getMetrics(i + 1, false) };
      }
    }
    return { finalState: this.u, metrics: this.getMetrics(this.config.n_steps, true) };
  }

  private getMetrics(stepsCompleted: number, stable: boolean): SimMetrics {
    const hist = this.history;
    const mass0 = hist.mass[0] || 1e-12;
    const energy0 = hist.energy[0] || 1e-12;

    const mass_drift = Math.abs(hist.mass[hist.mass.length - 1] - mass0) / Math.abs(mass0);
    const energy_drift = Math.abs(hist.energy[hist.energy.length - 1] - energy0) / Math.abs(energy0);

    const massMean = hist.mass.reduce((a, b) => a + b, 0) / hist.mass.length;
    // FIX: Renamed `massVariance` to `mass_variance` to match the SimMetrics type and fix the reference error.
    const mass_variance = Math.sqrt(hist.mass.map(x => Math.pow(x - massMean, 2)).reduce((a, b) => a + b, 0) / hist.mass.length) / (Math.abs(massMean) + 1e-12);

    let max_value = 0;
    for (let j = 0; j < this.config.ny; j++) {
      for (let i = 0; i < this.config.nx; i++) {
        if(isFinite(this.u[j][i])) {
            max_value = Math.max(max_value, Math.abs(this.u[j][i]));
        }
      }
    }

    return {
      stable,
      mass_drift,
      energy_drift,
      mass_variance,
      max_value,
      cfl_number: (this.config.dt / (this.config.dx * this.config.dx)) * this.params.D,
      n_steps_completed: stepsCompleted
    };
  }
}