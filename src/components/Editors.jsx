import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { useCompilerStore } from '../store/compilerStore';
import { GRAMMAR_PRESETS } from '../core/presets';
import { Play, Wand2, Info, Sparkles, AlertCircle, RefreshCw, FileCode, Settings } from 'lucide-react';

export function LeftPanel() {
  const {
    grammarInput, setGrammarInput,
    sourceCodeInput, setSourceInput,
    loadPreset, generateSample,
    compileError, parsedGrammar,
    lexerTokens, simulationData
  } = useCompilerStore();

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto pr-2">
      {/* Header Dashboard */}
      <div className="glass-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 height-5 text-indigo-400" />
            <h2 className="font-bold text-slate-200 text-base">Control Dashboard</h2>
          </div>
          <button 
            onClick={generateSample}
            className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-indigo-500/50 shadow-lg hover:shadow-indigo-500/20 shadow-indigo-950"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Derive Sample
          </button>
        </div>
        
        {/* Preset Categories Dropdowns */}
        <div className="flex flex-col gap-2">
          {["Lecture Examples", "Advanced Examples", "Azadi++ Examples"].map(category => (
            <details key={category} className="group bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden">
              <summary className="p-2.5 font-bold text-xs text-slate-300 cursor-pointer list-none flex justify-between items-center hover:bg-slate-900/50 transition-colors">
                {category === "Lecture Examples" ? "📚 Lecture Examples" : category === "Advanced Examples" ? "🧮 Advanced Examples" : "🇵🇰 Azadi++ Examples"}
                <span className="text-[10px] text-indigo-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-2 pt-1 grid grid-cols-1 gap-2 bg-slate-950/40 border-t border-slate-800/50">
                {GRAMMAR_PRESETS.filter(p => p.category === category).map(p => (
                  <button
                    key={p.id}
                    onClick={() => loadPreset(p.id)}
                    className="p-2 text-left rounded-lg bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-800 text-xs text-slate-300 flex flex-col gap-1 transition-colors group/btn"
                  >
                    <span className="font-bold text-slate-200 group-hover/btn:text-indigo-300">{p.name}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{p.desc}</span>
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Grammar Editor Card */}
      <div className="glass-card flex flex-col overflow-hidden min-h-[280px]">
        <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Context-Free Grammar</span>
          </div>
          {compileError ? (
            <span className="text-[10px] text-red-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Syntax Error
            </span>
          ) : (
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin-slow" /> Compiled Live
            </span>
          )}
        </div>
        <div className="flex-1 bg-slate-950/80 text-sm font-mono">
          <CodeMirror
            value={grammarInput}
            height="100%"
            theme={vscodeDark}
            onChange={(value) => setGrammarInput(value)}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
            }}
          />
        </div>
        {compileError && (
          <div className="p-3 bg-red-950/30 border-t border-red-900/40 text-red-300 text-xs font-mono break-all">
            {compileError}
          </div>
        )}
      </div>

      {/* Source Editor Card */}
      <div className="glass-card flex flex-col overflow-hidden min-h-[240px]">
        <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Source Code Terminal</span>
          </div>
          {simulationData?.accept ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">ACCEPTED</span>
          ) : simulationData?.error ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">HALTED</span>
          ) : null}
        </div>
        <div className="flex-1 bg-slate-950/80 text-sm">
          <CodeMirror
            value={sourceCodeInput}
            height="100%"
            theme={vscodeDark}
            onChange={(value) => setSourceInput(value)}
            basicSetup={{
              lineNumbers: true,
            }}
          />
        </div>
        {simulationData?.error && (
          <div className="p-3 bg-rose-950/30 border-t border-rose-900/40 text-rose-300 text-xs font-mono">
            {simulationData.error}
          </div>
        )}
      </div>

      {/* Interactive Guided Guide Panel */}
      <div className="glass-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Info className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Language Vocabulary Guide</h3>
        </div>
        {parsedGrammar ? (
          <div className="flex flex-col gap-3 text-xs">
            <div>
              <div className="font-semibold text-slate-300 mb-1">Alphabet Terminals:</div>
              <div className="flex flex-wrap gap-1.5">
                {parsedGrammar.terminals.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-amber-200 font-mono font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
              <div>
                <div className="text-slate-500 font-bold mb-1 text-[10px]">SPECIAL MAPPING:</div>
                <div className="flex flex-col gap-1 text-slate-400">
                  {parsedGrammar.terminals.includes('id') && <div><span className="text-indigo-300 font-mono">id</span> ➔ variables (x, val)</div>}
                  {parsedGrammar.terminals.includes('num') && <div><span className="text-teal-300 font-mono">num</span> ➔ digits (10.5, 5)</div>}
                  {!parsedGrammar.terminals.includes('id') && !parsedGrammar.terminals.includes('num') && <div className="italic">Literal character match</div>}
                </div>
              </div>
              <div>
                <div className="text-slate-500 font-bold mb-1 text-[10px]">EXPECTED SEQUENCE:</div>
                <div className="text-[10px] text-emerald-300 font-mono leading-relaxed">
                  {simulationData?.steps[0]?.nextToken ? (
                    <>Next expected: <br /> {Object.keys(useCompilerStore.getState().lalrData?.actionTable[simulationData.steps[simulationData.steps.length - 1]?.stack.slice(-1)[0]] || {}).join(', ')}</>
                  ) : "Start parsing to reveal"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-slate-500 text-xs italic text-center">Enter a valid CFG to generate dictionary guide.</span>
        )}
      </div>

      {/* Footer Credit */}
      <div className="mt-auto pt-4 pb-2 text-center text-xs text-slate-500 font-medium">
        Made by <a href="https://www.linkedin.com/in/sara-arif-792p/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-bold">sara arif</a>
      </div>
    </div>
  );
}
