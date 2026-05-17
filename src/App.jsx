import React, { useEffect } from 'react';
import { useCompilerStore } from './store/compilerStore';
import { LeftPanel } from './components/Editors';
import { GrammarTab, FirstFollowTab, ParsingTableTab } from './components/GrammarTabs';
import { LRItemsTab, DFAGraphTab, LALRMergeTab } from './components/DfaTabs';
import { ParseSimulatorTab, ParseTreeTab, SymbolTableTab, SemanticTab, ICGTab } from './components/RuntimeTabs';
import { 
  Cpu, FileText, GitBranch, Layers, Table, PlayCircle, 
  Share2, ShieldCheck, Binary, GitPullRequest, Workflow
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'grammar', name: 'Grammar View', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10' },
  { id: 'firstFollow', name: 'FIRST / FOLLOW', icon: GitBranch, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  { id: 'items', name: 'LR Item Sets', icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'dfa', name: 'DFA State Graph', icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'lalrMerge', name: 'LALR Merge Audit', icon: GitPullRequest, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { id: 'table', name: 'ACTION / GOTO', icon: Table, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'simulation', name: 'Parse Trace', icon: PlayCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'tree', name: 'Parse Tree', icon: Workflow, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { id: 'symbols', name: 'Symbol Table', icon: ShieldCheck, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
  { id: 'semantic', name: 'Semantic Errors', icon: ShieldCheck, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'icg', name: 'Intermediate Code', icon: Binary, color: 'text-blue-400', bg: 'bg-blue-400/10' },
];

function App() {
  const { activeTab, setActiveTab, compileGrammar, runSimulation } = useCompilerStore();

  useEffect(() => {
    // Initialize store on bootstrap
    const success = compileGrammar();
    if (success) runSimulation();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'grammar': return <GrammarTab />;
      case 'firstFollow': return <FirstFollowTab />;
      case 'items': return <LRItemsTab />;
      case 'dfa': return <DFAGraphTab />;
      case 'lalrMerge': return <LALRMergeTab />;
      case 'table': return <ParsingTableTab />;
      case 'simulation': return <ParseSimulatorTab />;
      case 'tree': return <ParseTreeTab />;
      case 'symbols': return <SymbolTableTab />;
      case 'semantic': return <SemanticTab />;
      case 'icg': return <ICGTab />;
      default: return <GrammarTab />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* TOP NAVBAR */}
      <header className="px-6 h-16 border-b border-slate-800/60 backdrop-blur-md flex items-center justify-between bg-slate-900/20 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-slate-100 leading-tight text-lg flex items-center gap-2">
              Dynamic LALR(1) Compiler Simulator
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Educational Engineering Sandbox</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded bg-slate-900 border border-slate-800 flex items-center gap-2 select-none text-slate-500 text-xs font-mono">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            D3.js & Framer Enabled
          </div>
        </div>
      </header>

      {/* CORE LAYOUT CONTAINER */}
      <main className="flex-1 grid grid-cols-[380px_1fr] gap-5 p-5 h-[calc(100vh-4rem)] overflow-hidden max-w-[1920px] mx-auto w-full">
        
        {/* Left Controller Columns */}
        <div className="h-full overflow-hidden">
          <LeftPanel />
        </div>

        {/* Right Tab Pipeline */}
        <div className="h-full flex flex-col overflow-hidden gap-5">
          
          {/* Dynamic Horizontal Tab Navigation Scroll */}
          <nav className="glass-card overflow-x-auto flex gap-1 p-1.5 bg-slate-900/50 whitespace-nowrap shrink-0 scrollbar-thin">
            {TABS.map(tab => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all tracking-wide border shrink-0 ${
                    isActive 
                      ? `${tab.bg} border-slate-700 text-slate-100 shadow-inner shadow-slate-950` 
                      : 'border-transparent hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-500'}`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>

          {/* Workspace Tab Output Canvas */}
          <div className="glass-card flex-1 overflow-hidden p-6 bg-slate-900/30 flex flex-col relative shadow-2xl shadow-slate-950/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
