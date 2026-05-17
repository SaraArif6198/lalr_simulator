import { create } from 'zustand';
import { parseGrammar, computeNullableFirstFollow, generateSampleString } from '../core/grammarEngine';
import { buildLALRParser } from '../core/lalrEngine';
import { runLexer, runParseSimulator, analyzeSemantics, generateTAC } from '../core/runtimeEngine';
import { GRAMMAR_PRESETS } from '../core/presets';

export const useCompilerStore = create((set, get) => ({
  grammarInput: GRAMMAR_PRESETS[0].grammar,
  sourceCodeInput: GRAMMAR_PRESETS[0].sampleCode,
  
  // Computed Structures
  parsedGrammar: null,
  firstFollowData: null,
  lalrData: null,
  
  // Runtime Simulation Structures
  lexerTokens: [],
  simulationData: null,
  semanticData: null,
  icgInstructions: [],

  // Interface UI states
  activeTab: 'grammar',
  compiling: false,
  compileError: null,

  setGrammarInput: (val) => {
    set({ grammarInput: val });
    get().compileGrammar();
  },
  
  setSourceInput: (val) => {
    set({ sourceCodeInput: val });
    get().runSimulation();
  },

  setActiveTab: (tabId) => set({ activeTab: tabId }),

  loadPreset: (presetId) => {
    const preset = GRAMMAR_PRESETS.find(p => p.id === presetId);
    if (preset) {
      set({
        grammarInput: preset.grammar,
        sourceCodeInput: preset.sampleCode,
        activeTab: 'grammar'
      });
      // Force full cascade
      const grammarRes = get().compileGrammar();
      if (grammarRes) get().runSimulation();
    }
  },

  generateSample: () => {
    const { parsedGrammar } = get();
    if (parsedGrammar) {
      const sample = generateSampleString(parsedGrammar.productions, parsedGrammar.startSymbol);
      set({ sourceCodeInput: sample });
      get().runSimulation();
    }
  },

  compileGrammar: () => {
    const { grammarInput } = get();
    set({ compiling: true, compileError: null });
    try {
      // 1. Parse Grammar
      const parsed = parseGrammar(grammarInput);
      
      // 2. Compute First & Follow sets
      const ff = computeNullableFirstFollow(parsed.productions, parsed.nonTerminals, parsed.terminals);
      
      // 3. Construct LR(1) closure stack and LALR states/tables
      const lalr = buildLALRParser(parsed.productions, parsed.nonTerminals, parsed.terminals, ff);

      set({
        parsedGrammar: parsed,
        firstFollowData: ff,
        lalrData: lalr,
        compiling: false
      });
      return true;
    } catch (err) {
      set({
        compileError: err.message,
        compiling: false,
        parsedGrammar: null,
        firstFollowData: null,
        lalrData: null
      });
      return false;
    }
  },

  runSimulation: () => {
    const { sourceCodeInput, parsedGrammar, lalrData } = get();
    if (!parsedGrammar || !lalrData) return;

    try {
      // 1. Tokenize input
      const tokens = runLexer(sourceCodeInput, parsedGrammar.terminals);

      // 2. Run stack simulator using Action/Goto tables
      const sim = runParseSimulator(
        tokens, 
        lalrData.actionTable, 
        lalrData.gotoTable, 
        parsedGrammar.productions
      );

      // 3. Analyze symbol bindings and types
      const sem = analyzeSemantics(sim.parseTreeRoot);

      // 4. Emit Three Address Code from reductions
      const icg = generateTAC(sim.parseTreeRoot);

      set({
        lexerTokens: tokens,
        simulationData: sim,
        semanticData: sem,
        icgInstructions: icg
      });
    } catch (err) {
      console.error("Simulator crash:", err);
    }
  }
}));
