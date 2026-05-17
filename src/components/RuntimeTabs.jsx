import React, { useState, useEffect, useRef } from 'react';
import { useCompilerStore } from '../store/compilerStore';
import { EmptyState } from './GrammarTabs';
import { ChevronLeft, ChevronRight, Play, Pause, Database, Code, GitMerge, AlertTriangle } from 'lucide-react';
import * as d3 from 'd3';

// ====================================================================
// TABS 7: PARSE SIMULATION & STACK VISUALIZER (INTERACTIVE STEPPING)
// ====================================================================
export function ParseSimulatorTab() {
  const { simulationData } = useCompilerStore();
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setStepIdx(0);
    setIsPlaying(false);
  }, [simulationData]);

  useEffect(() => {
    let interval;
    if (isPlaying && simulationData) {
      interval = setInterval(() => {
        setStepIdx(prev => {
          if (prev >= simulationData.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simulationData]);

  if (!simulationData) return <EmptyState />;

  const currentStep = simulationData.steps[stepIdx] || simulationData.steps[0];

  return (
    <div className="flex flex-col gap-5 animate-fade-in h-full">
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-200">LALR(1) Stack Machine Simulation</h3>
          <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Step-by-Step</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={stepIdx === 0}
            onClick={() => { setIsPlaying(false); setStepIdx(p => Math.max(0, p-1)); }}
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 rounded-md transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 px-3 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-md text-xs font-bold flex items-center gap-1.5 border border-indigo-500/30 transition-all shadow-md"
          >
            {isPlaying ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Play</>}
          </button>
          <button 
            disabled={stepIdx >= simulationData.steps.length - 1}
            onClick={() => { setIsPlaying(false); setStepIdx(p => Math.min(simulationData.steps.length - 1, p+1)); }}
            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 rounded-md transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Player State HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center bg-slate-950/30 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Step Location</span>
          <span className="text-xl font-bold text-slate-200 font-mono mt-1">{stepIdx + 1} / {simulationData.steps.length}</span>
        </div>
        <div className="col-span-3 glass-card p-4 bg-indigo-950/10 border-indigo-500/20">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">Active Stack Pipeline</span>
          <div className="font-mono text-sm font-semibold text-slate-300 overflow-x-auto pb-1 select-all">
            {currentStep?.stackStr}
          </div>
        </div>
      </div>

      <div className="glass-card flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-800 text-xs font-bold text-slate-400 flex items-center justify-between uppercase">
          <span>Trace Log History</span>
          {simulationData.accept && <span className="text-emerald-400 text-[10px] font-extrabold tracking-wide animate-pulse">🎉 SUCCESSFUL COMPILE</span>}
        </div>
        <div className="flex-1 overflow-y-auto select-none">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-900 text-[10px] font-bold text-slate-500 tracking-wider sticky top-0">
                <th className="p-3 pl-5">STEP</th>
                <th className="p-3">REMAINING INPUT TOKENSTREAM</th>
                <th className="p-3">DECISION ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {simulationData.steps.map((step, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => { setIsPlaying(false); setStepIdx(idx); }}
                  className={`cursor-pointer transition-colors ${idx === stepIdx ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : 'hover:bg-slate-900/30 border-l-4 border-l-transparent'}`}
                >
                  <td className={`p-3 pl-5 font-bold ${idx === stepIdx ? 'text-indigo-400' : 'text-slate-600'}`}>{idx + 1}</td>
                  <td className="p-3 text-slate-300 truncate max-w-md select-all">{step.input}</td>
                  <td className="p-3">
                    <span className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      step.actionStr.startsWith('S') ? 'text-sky-400 bg-sky-500/5 border border-sky-500/10' :
                      step.actionStr.startsWith('R') ? 'text-amber-400 bg-amber-500/5 border border-amber-500/10' :
                      step.actionStr === 'acc' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-extrabold' :
                      'text-rose-400 bg-rose-950/30 font-extrabold'
                    }`}>
                      {step.actionStr}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TABS 8: SVG D3.JS PARSE TREE VISUALIZER
// ====================================================================
export function ParseTreeTab() {
  const { simulationData } = useCompilerStore();
  const svgRef = useRef(null);

  useEffect(() => {
    if (!simulationData?.parseTreeRoot || !svgRef.current) return;

    const width = 750;
    const height = 500;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // wipe old

    const g = svg.append('g');

    // Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    // Convert data to D3 Hierarchy
    const root = d3.hierarchy(simulationData.parseTreeRoot);
    
    // Layout Generator
    const treeLayout = d3.tree().size([width - 100, height - 120]);
    treeLayout(root);

    // Add Links (connecting paths)
    g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#334155')
      .attr('stroke-width', 2)
      .selectAll('path')
      .data(root.links())
      .enter().append('path')
      .attr('d', d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y));

    // Add Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(root.descendants())
      .enter().append('g')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Circle bubble backgrounds
    node.append('circle')
      .attr('r', 16)
      .attr('fill', d => {
        if (d.data.type === 'terminal') return '#0f172a';
        if (d.data.type === 'epsilon') return '#1e293b';
        return '#4f46e5'; // Non terminal
      })
      .attr('stroke', d => {
        if (d.data.type === 'terminal') return '#f59e0b';
        if (d.data.type === 'epsilon') return '#64748b';
        return '#312e81';
      })
      .attr('stroke-width', 2.5);

    // Add Text Label (Non-terminal shortname OR terminal literal)
    node.append('text')
      .attr('dy', '0.31em')
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.data.type === 'terminal' ? '#fbcfe8' : '#fff')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(d => d.data.name);

    // Leaf Values sub-label (lexemes like 'x', '5', 'total')
    node.filter(d => d.data.lexeme)
      .append('text')
      .attr('dy', '2.5em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#f59e0b')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('font-weight', 'extrabold')
      .text(d => `"${d.data.lexeme}"`);

    // Center the layout initial look
    svg.call(zoom.transform, d3.zoomIdentity.translate(50, 40).scale(0.9));

  }, [simulationData]);

  if (!simulationData?.parseTreeRoot) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 italic text-xs gap-2 py-16">
        <GitMerge className="w-8 h-8 text-slate-800 animate-pulse" />
        "Waiting for a valid derivation string sequence to render the structural Concrete Parse Tree."
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full animate-fade-in glass-card p-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-1">
        <div className="flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">SVG Interactive Concrete Parse Tree</h4>
        </div>
        <span className="text-[10px] text-slate-500">💡 Use scroll-wheel to Zoom • Drag background to Pan</span>
      </div>
      <div className="flex-1 bg-slate-950/60 rounded-xl border border-slate-800 relative overflow-hidden">
        <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 750 500" className="block" />
      </div>
    </div>
  );
}

// ====================================================================
// TABS 9: SYMBOL TABLE GRID
// ====================================================================
export function SymbolTableTab() {
  const { semanticData } = useCompilerStore();

  if (!semanticData || semanticData.symbolTable.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs gap-2 py-16">
        <Database className="w-8 h-8 text-slate-800" />
        No recognized identifiers found. Try declaring or assigning values to variables.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in h-full">
      <div className="border-b border-slate-800 pb-3 flex items-center gap-3">
        <h3 className="text-lg font-bold text-slate-200">Identifier Context Symbol Table</h3>
        <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Heap Memory Offset</span>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse text-sm font-mono">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-bold tracking-wider text-slate-500 uppercase">
              <th className="p-4">Identifier</th>
              <th className="p-4">Lexical Category Type</th>
              <th className="p-4">Initialization Block Scope</th>
              <th className="p-4 text-right">Static Byte Offset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {semanticData.symbolTable.map((sym, idx) => (
              <tr key={idx} className="hover:bg-slate-900/30">
                <td className="p-4 text-teal-300 font-bold text-base">"{sym.name}"</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${sym.type === 'implicit' || sym.type === 'inferred' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-300'}`}>
                    {sym.type}
                  </span>
                </td>
                <td className="p-4 text-slate-400 flex items-center gap-1.5 uppercase text-xs font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  {sym.scope}
                </td>
                <td className="p-4 text-slate-500 font-bold text-right text-base">0x00{sym.offset}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====================================================================
// TABS 10: SEMANTIC LOGS
// ====================================================================
export function SemanticTab() {
  const { semanticData } = useCompilerStore();

  if (!semanticData) return <EmptyState />;

  return (
    <div className="flex flex-col gap-5 animate-fade-in h-full">
      <div className="border-b border-slate-800 pb-3 flex items-center gap-3">
        <h3 className="text-lg font-bold text-slate-200">Semantic Phase Audit Transcript</h3>
      </div>
      
      <div className="glass-card p-5 flex flex-col gap-4 flex-1 bg-slate-950/40 border-slate-800">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Analysis Results & Safety Warnings
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {semanticData.errors.length > 0 ? (
            semanticData.errors.map((e, i) => (
              <div key={i} className="p-3 rounded-lg border border-amber-900/50 bg-amber-950/20 text-amber-300 text-xs font-mono flex items-start gap-2">
                <span className="font-bold">⚠️ [ALERT]</span> {e}
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-emerald-500 font-bold font-mono text-sm gap-2 py-10 bg-emerald-950/5 border border-emerald-900/20 rounded-xl">
              <span>✅</span> 0 Semantic Violations Discovered. Bindings are compliant!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TABS 11: INTERMEDIATE CODE GENERATOR (ICG)
// ====================================================================
export function ICGTab() {
  const { icgInstructions } = useCompilerStore();

  if (!icgInstructions || icgInstructions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs gap-2 py-16 italic">
        <Code className="w-8 h-8 text-slate-800" />
        "Execute code with math operations like assignments or additions to synthesise Three-Address instructions."
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in h-full">
      <div className="border-b border-slate-800 pb-3 flex items-center gap-3">
        <h3 className="text-lg font-bold text-slate-200">Intermediate Code Output (TAC)</h3>
        <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider">3-Address Code</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 overflow-y-auto pr-2">
        {/* Text Terminal */}
        <div className="glass-card overflow-hidden flex flex-col border-slate-800/80">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 font-mono text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Terminal: flat_tac_buffer
          </div>
          <div className="flex-1 bg-slate-950 p-5 font-mono text-emerald-400 text-sm leading-relaxed overflow-y-auto select-all">
            {icgInstructions.map((instr, idx) => (
              <div key={idx} className="flex items-center gap-5 border-b border-slate-900/50 py-2 hover:bg-slate-900/20 px-2 transition-colors">
                <span className="text-slate-600 font-bold w-8">({idx + 1})</span>
                <span className="font-semibold select-all text-base">{instr.stringRep}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Map Object Records */}
        <div className="glass-card overflow-hidden flex flex-col border-slate-800/80">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Structured Tuple Object Grid
          </div>
          <div className="flex-1 bg-slate-950/50 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3 pl-4">Index</th>
                  <th className="p-3">OP</th>
                  <th className="p-3">ARG 1</th>
                  <th className="p-3">ARG 2</th>
                  <th className="p-3">RESULT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {icgInstructions.map((instr, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="p-3 pl-4 text-slate-600 font-bold">({idx})</td>
                    <td className="p-3 text-amber-300 font-bold">{instr.op}</td>
                    <td className="p-3 text-slate-300">{instr.arg1}</td>
                    <td className="p-3 text-slate-300">{instr.arg2 || '-'}</td>
                    <td className="p-3 text-pink-300 font-extrabold">{instr.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
