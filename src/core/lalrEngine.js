/**
 * LALR(1) Engine
 * Computes Closure, GOTO, Builds canonical LR(1) items,
 * Merges cores for LALR(1), generates ACTION/GOTO table,
 * and detects Shift-Reduce / Reduce-Reduce conflicts.
 */

import { EOF, EPSILON } from './grammarEngine';

// Format item as a unique string key for Set comparisons: "prodIdx_dot_lookahead"
function stringifyItem(prodIdx, dot, lookahead) {
  return `${prodIdx}_${dot}_${lookahead}`;
}

function parseItemKey(key) {
  const parts = key.split('_');
  return {
    prodIdx: parseInt(parts[0], 10),
    dot: parseInt(parts[1], 10),
    lookahead: parts[2]
  };
}

// Standard comparison to compare two item sets by key ordering
function getItemSetKey(itemsSet) {
  return Array.from(itemsSet).sort().join('|');
}

export function buildLALRParser(productions, nonTerminals, terminals, firstFollowData) {
  const { computeFirstOfSequence } = firstFollowData;
  const allSymbols = [...nonTerminals, ...terminals].filter(s => s !== EOF && s !== EPSILON);
  const startProdIdx = 0; // S' -> S

  // --------------------------------------------------------------------
  // 1. LR(1) CLOSURE
  // --------------------------------------------------------------------
  function computeClosureLR1(initialItemsSet) {
    const closure = new Set(initialItemsSet);
    const queue = Array.from(closure);
    
    let head = 0;
    while (head < queue.length) {
      const currentKey = queue[head++];
      const { prodIdx, dot, lookahead } = parseItemKey(currentKey);
      const prod = productions[prodIdx];
      
      // If dot is at the end, or pointing at epsilon, skip
      if (dot >= prod.rhs.length || prod.rhs[dot] === EPSILON) continue;
      
      const symbolAtDot = prod.rhs[dot];
      if (!nonTerminals.includes(symbolAtDot)) continue; // Only expand if it's a non-terminal

      // β = the sequence after the dot symbol
      const beta = prod.rhs.slice(dot + 1);
      // First(β a)
      const firstBetaA = computeFirstOfSequence([...beta, lookahead]);

      // For every production of B
      for (let pIdx = 0; pIdx < productions.length; pIdx++) {
        if (productions[pIdx].lhs !== symbolAtDot) continue;
        
        // Standard items have dot starting at 0
        for (const terminalLookahead of firstBetaA) {
          if (terminalLookahead === EPSILON) continue; // Lookaheads can't be epsilon
          const newItemKey = stringifyItem(pIdx, 0, terminalLookahead);
          if (!closure.has(newItemKey)) {
            closure.add(newItemKey);
            queue.push(newItemKey);
          }
        }
      }
    }
    return closure;
  }

  // --------------------------------------------------------------------
  // 2. LR(1) GOTO
  // --------------------------------------------------------------------
  function computeGotoLR1(itemsSet, symbol) {
    const shiftedItems = new Set();
    for (const itemKey of itemsSet) {
      const { prodIdx, dot, lookahead } = parseItemKey(itemKey);
      const prod = productions[prodIdx];
      
      if (dot < prod.rhs.length && prod.rhs[dot] === symbol) {
        shiftedItems.add(stringifyItem(prodIdx, dot + 1, lookahead));
      }
    }
    if (shiftedItems.size === 0) return null;
    return computeClosureLR1(shiftedItems);
  }

  // --------------------------------------------------------------------
  // 3. BUILD CANONICAL LR(1) STATES COLLECTION
  // --------------------------------------------------------------------
  const initialItem = stringifyItem(startProdIdx, 0, EOF);
  const I0 = computeClosureLR1(new Set([initialItem]));
  
  const lr1States = [I0];
  const lr1StateKeys = [getItemSetKey(I0)];
  const lr1Transitions = []; // [{ from: idx, symbol: 'X', to: idx }]

  let currentQueueIdx = 0;
  
  // Safety harness against explosive state expansions (like 500 states max)
  while (currentQueueIdx < lr1States.length && lr1States.length < 500) {
    const currentStateIdx = currentQueueIdx;
    const currentState = lr1States[currentQueueIdx++];

    for (const sym of allSymbols.concat([EOF])) {
      const gotoResult = computeGotoLR1(currentState, sym);
      if (!gotoResult) continue;

      const key = getItemSetKey(gotoResult);
      let destinationIdx = lr1StateKeys.indexOf(key);
      if (destinationIdx === -1) {
        destinationIdx = lr1States.length;
        lr1States.push(gotoResult);
        lr1StateKeys.push(key);
      }

      lr1Transitions.push({
        from: currentStateIdx,
        symbol: sym,
        to: destinationIdx
      });
    }
  }

  // --------------------------------------------------------------------
  // 4. LALR(1) MERGE CORES
  // --------------------------------------------------------------------
  // An LR(0) core is just the list of [prodIdx, dot] strings
  function extractCoreKey(itemsSet) {
    const cores = new Set();
    for (const itemKey of itemsSet) {
      const parts = itemKey.split('_');
      cores.add(`${parts[0]}_${parts[1]}`);
    }
    return Array.from(cores).sort().join('|');
  }

  // Groups mapping core keys -> list of LR1 state indices
  const coreToLR1StateIdx = new Map();
  lr1States.forEach((state, idx) => {
    const coreKey = extractCoreKey(state);
    if (!coreToLR1StateIdx.has(coreKey)) {
      coreToLR1StateIdx.set(coreKey, []);
    }
    coreToLR1StateIdx.get(coreKey).push(idx);
  });

  // Construct merged states list
  const lalrStates = [];
  const lr1ToLALRMap = new Map(); // Index translation map

  coreToLR1StateIdx.forEach((lr1Indices, coreKey) => {
    const mergedStateIdx = lalrStates.length;
    const mergedSet = new Set();
    
    // Union items from all matching states
    lr1Indices.forEach(origIdx => {
      lr1ToLALRMap.set(origIdx, mergedStateIdx);
      for (const item of lr1States[origIdx]) {
        mergedSet.add(item);
      }
    });

    lalrStates.push({
      items: mergedSet,
      originalIndices: lr1Indices,
      coreKey
    });
  });

  // Recompute transitions using the mapping
  const lalrTransitions = [];
  const transitionCache = new Set(); // Avoid duplicates after merging

  lr1Transitions.forEach(t => {
    const fromMerged = lr1ToLALRMap.get(t.from);
    const toMerged = lr1ToLALRMap.get(t.to);
    const cacheKey = `${fromMerged}_${t.symbol}_${toMerged}`;
    
    if (!transitionCache.has(cacheKey)) {
      transitionCache.add(cacheKey);
      lalrTransitions.push({
        from: fromMerged,
        symbol: t.symbol,
        to: toMerged
      });
    }
  });

  // --------------------------------------------------------------------
  // 5. BUILD ACTION/GOTO PARSING TABLE & CONFLICT CHECKER
  // --------------------------------------------------------------------
  const actionTable = []; // rows indexed by state idx
  const gotoTable = [];
  const conflicts = []; // [{ state: idx, symbol: 'X', type: 'SR/RR', actions: [...] }]

  // Initialize empty table rows
  lalrStates.forEach(() => {
    actionTable.push({});
    gotoTable.push({});
  });

  // Helper to add entries to Action Table safely (detecting conflicts)
  const addAction = (stateIdx, terminalSymbol, actionStr) => {
    const currentRow = actionTable[stateIdx];
    if (currentRow[terminalSymbol]) {
      const existing = currentRow[terminalSymbol];
      if (existing !== actionStr) {
        // Found conflict! Preserve first, log error
        const conflictType = (existing.startsWith('S') && actionStr.startsWith('R')) ||
                             (existing.startsWith('R') && actionStr.startsWith('S')) ? 'Shift-Reduce' : 'Reduce-Reduce';
        
        conflicts.push({
          state: stateIdx,
          symbol: terminalSymbol,
          type: conflictType,
          actions: [existing, actionStr]
        });
        // Keep both in visual logs, but typically shift is preferred by default or smaller reduction index
        currentRow[terminalSymbol] = `${existing}/${actionStr}`;
      }
    } else {
      currentRow[terminalSymbol] = actionStr;
    }
  };

  // A. Add SHIFT actions and GOTO jumps from transitions
  lalrTransitions.forEach(trans => {
    const { from, symbol, to } = trans;
    if (terminals.includes(symbol)) {
      addAction(from, symbol, `S${to}`);
    } else if (nonTerminals.includes(symbol)) {
      gotoTable[from][symbol] = to;
    }
  });

  // B. Add REDUCE / ACCEPT actions
  lalrStates.forEach((state, stateIdx) => {
    for (const itemKey of state.items) {
      const { prodIdx, dot, lookahead } = parseItemKey(itemKey);
      const prod = productions[prodIdx];

      // Condition: Dot is at end of production OR production is A -> epsilon
      const isEpsilonProd = prod.rhs.length === 1 && prod.rhs[0] === EPSILON;
      if (dot === prod.rhs.length || isEpsilonProd) {
        
        if (prodIdx === 0) {
          // Accept condition for Augmented S' -> S
          if (lookahead === EOF) {
            addAction(stateIdx, EOF, 'acc');
          }
        } else {
          // Reduce reduction rule "Rk" where k is originalIdx
          addAction(stateIdx, lookahead, `R${prod.originalIdx}`);
        }
      }
    }
  });

  return {
    states: lalrStates,
    transitions: lalrTransitions,
    actionTable,
    gotoTable,
    conflicts,
    lr1StatesCount: lr1States.length,
    lalrStatesCount: lalrStates.length
  };
}
