
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { AgentName, AgentStatus, EquationParams, EquationSpec, Evaluation, HallOfFameEntry, IterationLog, SimMetrics } from './types';
import { GRID_CONFIG, INITIAL_EQUATION_PARAMS, MAX_ITERATIONS } from './constants';
import { getRevisedParams } from './services/theoristService';
import { Solver2D } from './services/simulationService';
import { Refutator } from './services/refutationService';
import { AgentCard } from './components/AgentCard';
import { MetricsDisplay } from './components/MetricsDisplay';
import { SimulationCanvas } from './components/SimulationCanvas';
import { TimelineEvent } from './components/TimelineEvent';
import { TheoristIcon } from './components/icons/TheoristIcon';
import { SimulatorIcon } from './components/icons/SimulatorIcon';
import { RefutatorIcon } from './components/icons/RefutatorIcon';
import { PlayIcon } from './components/icons/PlayIcon';
import { PauseIcon } from './components/icons/PauseIcon';
import { ResetIcon } from './components/icons/ResetIcon';

const App: React.FC = () => {
  const [iteration, setIteration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentName, AgentStatus>>({
    Theorist: 'idle',
    Simulator: 'idle',
    Refutator: 'idle',
  });

  const [equationSpec, setEquationSpec] = useState<EquationSpec | null>(null);
  const [simMetrics, setSimMetrics] = useState<SimMetrics | null>(null);
  const [gridData, setGridData] = useState<number[][] | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const [logs, setLogs] = useState<IterationLog[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  
  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const resetState = useCallback(() => {
    setIsRunning(false);
    setIteration(0);
    setAgentStatuses({ Theorist: 'idle', Simulator: 'idle', Refutator: 'idle' });
    setEquationSpec(null);
    setSimMetrics(null);
    setGridData(null);
    setEvaluation(null);
    setLogs([]);
    // hall of fame is not cleared on reset
  }, []);

  const runIteration = useCallback(async (currentIteration: number, lastParams?: EquationParams, lastEval?: Evaluation) => {
    if (!isRunningRef.current) return;

    // 1. Theorist
    setAgentStatuses(prev => ({ ...prev, Theorist: 'running', Simulator: 'idle', Refutator: 'idle' }));
    let newSpec: EquationSpec;
    if (currentIteration === 1) {
      newSpec = { name: `initial_hypothesis`, params: INITIAL_EQUATION_PARAMS };
    } else {
      if (!lastParams || !lastEval) {
        console.error("Missing previous data for revision");
        setIsRunning(false);
        return;
      }
      const newParams = await getRevisedParams(lastParams, lastEval);
      newSpec = { name: `hypothesis_v${currentIteration}`, params: newParams };
    }
    setEquationSpec(newSpec);
    setAgentStatuses(prev => ({ ...prev, Theorist: 'success' }));
    await new Promise(res => setTimeout(res, 500));

    if (!isRunningRef.current) return;

    // 2. Simulator
    setAgentStatuses(prev => ({ ...prev, Simulator: 'running' }));
    const solver = new Solver2D(GRID_CONFIG, newSpec.params);
    const { finalState, metrics } = solver.run();
    setSimMetrics(metrics);
    setGridData(finalState);
    setAgentStatuses(prev => ({ ...prev, Simulator: metrics.stable ? 'success' : 'failure' }));
    await new Promise(res => setTimeout(res, 500));
    
    if (!isRunningRef.current) return;

    // 3. Refutator
    setAgentStatuses(prev => ({ ...prev, Refutator: 'running' }));
    const refutator = new Refutator();
    const newEvaluation = refutator.evaluate(newSpec, metrics);
    setEvaluation(newEvaluation);
    setAgentStatuses(prev => ({ ...prev, Refutator: 'success' }));
    await new Promise(res => setTimeout(res, 500));
    
    if (!isRunningRef.current) return;

    // 4. Orchestrator
    const newLog: IterationLog = {
      iteration: currentIteration,
      equationSpec: newSpec,
      simMetrics: metrics,
      evaluation: newEvaluation,
    };
    setLogs(prev => [newLog, ...prev]);

    if (newEvaluation.decision === 'accept') {
      setHallOfFame(prev => [...prev, { name: newSpec.name, score: newEvaluation.score, params: newSpec.params }].sort((a,b) => b.score - a.score));
      setIsRunning(false);
    } else if (newEvaluation.decision === 'reject' || currentIteration >= MAX_ITERATIONS) {
      setIsRunning(false);
    } else { // revise
      setIteration(currentIteration + 1);
      setTimeout(() => runIteration(currentIteration + 1, newSpec.params, newEvaluation), 1000);
    }

  }, []);

  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    const startIteration = iteration === 0 ? 1 : iteration;
    if (startIteration === 1) {
       resetState();
       setIsRunning(true); // resetState sets it to false
    }
    setIteration(startIteration);
    runIteration(startIteration, equationSpec?.params, evaluation || undefined);
  };
  
  const handlePause = () => setIsRunning(false);

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">VortexLab</h1>
            <p className="text-gray-400">Multi-Agent System for PDE Exploration</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button onClick={handleStart} disabled={isRunning} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg flex items-center space-x-2 transition-colors">
            <PlayIcon className="w-5 h-5" /> <span>Start</span>
          </button>
          <button onClick={handlePause} disabled={!isRunning} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 rounded-lg flex items-center space-x-2 transition-colors">
            <PauseIcon className="w-5 h-5" /> <span>Pause</span>
          </button>
          <button onClick={resetState} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg flex items-center space-x-2 transition-colors">
            <ResetIcon className="w-5 h-5" /> <span>Reset</span>
          </button>
        </div>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <AgentCard title="Theorist" status={agentStatuses.Theorist} icon={<TheoristIcon className="w-8 h-8 text-purple-400"/>}>
              {/* FIX: Spread `equationSpec.params` to create an object literal, which is assignable to the `data` prop of MetricsDisplay. */}
              {equationSpec ? <MetricsDisplay title="Proposed Parameters" data={{...equationSpec.params}} /> : <p className="text-gray-500">Awaiting instructions...</p>}
            </AgentCard>
            <AgentCard title="Simulator" status={agentStatuses.Simulator} icon={<SimulatorIcon className="w-8 h-8 text-blue-400"/>}>
               {simMetrics ? <MetricsDisplay title="Simulation Metrics" data={{...simMetrics, stable: simMetrics.stable ? '✅' : '❌'}} /> : <p className="text-gray-500">Awaiting equation...</p>}
            </AgentCard>
            <AgentCard title="Refutator" status={agentStatuses.Refutator} icon={<RefutatorIcon className="w-8 h-8 text-green-400"/>}>
              {evaluation ? <>
                <MetricsDisplay title="Evaluation" data={{score: evaluation.score, decision: evaluation.decision}}/>
                {evaluation.critiques.length > 0 && <div className="text-sm text-red-400 mt-2"><b>Critiques:</b> {evaluation.critiques.join(', ')}</div>}
                {evaluation.suggestions.length > 0 && <div className="text-sm text-yellow-400 mt-2"><b>Suggestions:</b> {evaluation.suggestions.join(', ')}</div>}
              </> : <p className="text-gray-500">Awaiting results...</p>}
            </AgentCard>
          </div>
          <div className="flex-grow">
             <SimulationCanvas gridData={gridData} />
          </div>
        </div>
        <aside className="flex flex-col gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex-1">
                <h3 className="text-xl font-bold mb-4">Iteration Timeline</h3>
                <ol className="relative border-s border-gray-700 max-h-[300px] overflow-y-auto pr-2">
                    {logs.length > 0 ? logs.map(log => <TimelineEvent key={log.iteration} log={log} />) : <p className="text-gray-500 ml-4">No iterations yet.</p>}
                </ol>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex-1">
                <h3 className="text-xl font-bold mb-4">🏆 Hall of Fame</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {hallOfFame.length > 0 ? hallOfFame.map(entry => (
                        <div key={entry.name} className="bg-gray-900/70 p-3 rounded-lg border border-yellow-500/50">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-yellow-300">{entry.name}</span>
                                <span className="font-mono text-lg">{entry.score.toFixed(3)}</span>
                            </div>
                        </div>
                    )) : <p className="text-gray-500">No accepted hypotheses yet.</p>}
                </div>
            </div>
        </aside>
      </main>
    </div>
  );
};

export default App;