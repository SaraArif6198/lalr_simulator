import React from 'react';
import { useCompilerStore } from '../store/compilerStore';
import { ArrowRight, HelpCircle } from 'lucide-react';

// ====================================================================
// TABS 1: GRAMMAR VIEW & MATH STYLE
// ====================================================================
export function GrammarTab() {
  const { parsedGrammar } = useCompilerStore();
  
  if (!parsedGrammar) return <EmptyState />;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-slate-200">Dynamic Grammar Definition</h3>
        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 tracking-wider uppercase">Parsed</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5 flex flex-col gap-4">
          <div className="text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-800/60 pb-2">
            Parsed Productions (Original)
          </div>
          <div className="flex flex-col gap-2.5">
            {parsedGrammar.productions.slice(1).map((p, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm font-mono bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                <span className="text-slate-600 w-8 font-bold">P{p.originalIdx}.</span>
                <span className="text-sky-300 font-bold">{p.lhs}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-amber-200">{p.rhs.join(' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col gap-4">
          <div className="text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-800/60 pb-2">
            Augmented Grammar (G')
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <p className="text-xs text-slate-400 leading-relaxed italic mb-2">
              "Augmenting creates an artificial start symbol {parsedGrammar.augmentedStart} pointing to your original root to ensure the parser has a unique, clean acceptance state."
            </p>
            {parsedGrammar.productions.map((p, idx) => (
              <div key={idx} className={`flex items-center gap-3 text-sm font-mono p-2.5 rounded ${idx === 0 ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200' : 'text-slate-300'}`}>
                <span className="w-6 font-bold text-slate-600">{idx}.</span>
                <span className="font-bold text-sky-400">{p.lhs}</span>
                <span>→</span>
                <span className="text-slate-100">{p.rhs.join(' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TABS 2: FIRST & FOLLOW VIEWS
// ====================================================================
export function FirstFollowTab() {
  const { parsedGrammar, firstFollowData } = useCompilerStore();

  if (!parsedGrammar || !firstFollowData) return <EmptyState />;

  const { nonTerminals } = parsedGrammar;
  const { nullable, first, follow } = firstFollowData;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="border-b border-slate-800 pb-3 flex items-center gap-3">
        <h3 className="text-lg font-bold text-slate-200">Dynamic FIRST & FOLLOW Sets</h3>
        <span className="px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Computed</span>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="p-4">Non-Terminal (A)</th>
              <th className="p-4">Nullable</th>
              <th className="p-4">FIRST (A)</th>
              <th className="p-4">FOLLOW (A)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {nonTerminals.map(nt => (
              <tr key={nt} className="hover:bg-slate-900/30 text-sm font-mono">
                <td className="p-4 text-sky-400 font-bold text-base">{nt}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${nullable.has(nt) ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' : 'bg-slate-950 border border-slate-800 text-slate-500'}`}>
                    {nullable.has(nt) ? 'YES' : 'NO'}
                  </span>
                </td>
                <td className="p-4 text-emerald-300">
                  {'{ ' + Array.from(first.get(nt) || []).join(', ') + ' }'}
                </td>
                <td className="p-4 text-amber-400 font-semibold">
                  {'{ ' + Array.from(follow.get(nt) || []).join(', ') + ' }'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs bg-slate-950/40 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-col gap-1">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> What is FIRST?
          </div>
          <p className="text-slate-500">
            The set of all terminals that can appear at the beginning of strings derived from that non-terminal. Used to decide which production rule to look at.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> What is FOLLOW?
          </div>
          <p className="text-slate-500">
            The set of all terminals that can appear immediately to the right of that non-terminal in any sentential form. Vital for deciding reduction conditions when epsilon rules fire.
          </p>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TABS 3: ACTION / GOTO PARSING TABLE
// ====================================================================
export function ParsingTableTab() {
  const { parsedGrammar, lalrData } = useCompilerStore();

  if (!parsedGrammar || !lalrData) return <EmptyState />;

  const { terminals, nonTerminals, augmentedStart } = parsedGrammar;
  const { actionTable, gotoTable, conflicts, lalrStatesCount } = lalrData;

  // Columns sorted properly
  const terminalCols = [...terminals];
  const nonTerminalCols = nonTerminals.filter(nt => nt !== augmentedStart);

  const getActionStyle = (val) => {
    if (!val) return '';
    if (val.includes('/')) return 'bg-rose-950/80 border border-rose-700 text-rose-200 font-bold shadow-[0_0_8px_rgba(190,24,74,0.2)]'; // Conflict
    if (val === 'acc') return 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold'; // Accept
    if (val.startsWith('S')) return 'bg-sky-500/15 border border-sky-500/30 text-sky-300'; // Shift
    if (val.startsWith('R')) return 'bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold'; // Reduce
    return 'text-slate-400';
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in h-full">
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-200">Dynamic LALR(1) Parsing Matrix</h3>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 uppercase tracking-wider">ACTION & GOTO</span>
        </div>
        {conflicts.length > 0 && (
          <span className="px-3 py-1 text-xs font-bold bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg shadow-lg animate-pulse">
            🚨 {conflicts.length} Parser Conflicts Detected!
          </span>
        )}
      </div>

      {conflicts.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-xl flex flex-col gap-2">
          <h4 className="text-rose-300 text-xs font-bold uppercase tracking-wider">Conflict Warning Terminal:</h4>
          <div className="flex flex-col gap-1 text-xs font-mono">
            {conflicts.map((c, i) => (
              <div key={i} className="text-rose-200/90">
                • State <span className="font-bold">I{c.state}</span> on Symbol <span className="font-bold text-amber-300">"{c.symbol}"</span>: {c.type} conflict between [{c.actions.join(' and ')}].
              </div>
            ))}
          </div>
          <p className="text-[10px] text-rose-400/80 italic">
            "To fix conflicts, resolve ambiguities in your Context Free Grammar by making operators explicit or introducing hierarchical precedence levels."
          </p>
        </div>
      )}

      <div className="glass-card overflow-x-auto flex-1">
        <table className="w-full text-center border-collapse text-xs font-mono select-none">
          <thead>
            {/* Phase Header */}
            <tr className="border-b border-slate-800 text-[10px] font-bold tracking-widest text-slate-500 uppercase bg-slate-950">
              <th rowSpan={2} className="p-4 border-r border-slate-800 text-slate-400 bg-slate-900/50 w-16 sticky left-0">State</th>
              <th colSpan={terminalCols.length} className="p-2 bg-indigo-950/10 border-r border-slate-800 text-indigo-400">ACTION FIELD</th>
              <th colSpan={nonTerminalCols.length} className="p-2 bg-emerald-950/10 text-emerald-400">GOTO FIELD</th>
            </tr>
            {/* Symbols Header */}
            <tr className="bg-slate-900/70 border-b-2 border-slate-800/80 text-slate-300 font-bold">
              {terminalCols.map(t => (
                <th key={t} className="p-3 border-r border-slate-800/40 font-bold text-slate-100 min-w-[55px]">{t}</th>
              ))}
              {nonTerminalCols.map(nt => (
                <th key={nt} className="p-3 border-r border-slate-800/40 text-emerald-300 font-bold min-w-[55px]">{nt}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {Array.from({ length: lalrStatesCount }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-900/30">
                <td className="p-3 font-bold text-slate-400 border-r border-slate-800 bg-slate-900/30 sticky left-0">I{rowIdx}</td>
                {terminalCols.map(t => {
                  const action = actionTable[rowIdx] ? actionTable[rowIdx][t] : '';
                  return (
                    <td key={t} className="p-2 border-r border-slate-800/30 h-11">
                      {action && (
                        <div className={`mx-auto w-fit px-2.5 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm transition-all duration-200 ${getActionStyle(action)}`}>
                          {action}
                        </div>
                      )}
                    </td>
                  );
                })}
                {nonTerminalCols.map(nt => {
                  const stateJump = gotoTable[rowIdx] ? gotoTable[rowIdx][nt] : '';
                  return (
                    <td key={nt} className="p-2 border-r border-slate-800/30 font-bold text-emerald-400 text-sm">
                      {stateJump !== undefined ? stateJump : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-slate-600 gap-2 py-20">
      <span className="text-4xl">⚙️</span>
      <p className="text-sm font-medium">Waiting for grammar to compile successfully.</p>
    </div>
  );
}
