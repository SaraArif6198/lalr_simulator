/**
 * Grammar Core Engine
 * Parses textual Context-Free Grammars, handles augmentation,
 * and computes Nullable, FIRST, and FOLLOW sets dynamically.
 */

export const EPSILON = 'ε';
export const EOF = '$';

export function parseGrammar(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const productions = [];
  const nonTerminals = new Set();
  const terminals = new Set();

  lines.forEach((line, lineIdx) => {
    // Splitting S -> A | B or S ::= A | B
    const separator = line.includes('::=') ? '::=' : '->';
    const parts = line.split(separator);
    if (parts.length < 2) return;

    const lhs = parts[0].trim();
    if (!lhs) return;
    nonTerminals.add(lhs);

    const alternatives = parts[1].split('|').map(a => a.trim());
    alternatives.forEach(alt => {
      // Split symbols by whitespace. If no whitespace, fall back to character tokens (excluding common symbols)
      let rhs = alt.split(/\s+/).filter(s => s.length > 0);
      
      // Check for epsilon representation
      if (rhs.length === 0 || (rhs.length === 1 && (rhs[0] === EPSILON || rhs[0] === "''" || rhs[0] === '""' || rhs[0] === 'lambda'))) {
        rhs = [EPSILON];
      }
      
      productions.push({ lhs, rhs, originalIdx: productions.length });
      rhs.forEach(sym => {
        if (sym !== EPSILON) {
          terminals.add(sym);
        }
      });
    });
  });

  // Subtract non-terminals from terminal set
  nonTerminals.forEach(nt => terminals.delete(nt));

  if (productions.length === 0) {
    throw new Error("No valid productions found.");
  }

  // Augment grammar
  const startSymbol = productions[0].lhs;
  const augmentedStart = `${startSymbol}'`;
  nonTerminals.add(augmentedStart);
  
  const augmentedProductions = [
    { lhs: augmentedStart, rhs: [startSymbol], originalIdx: 0 },
    ...productions.map((p, i) => ({ ...p, originalIdx: i + 1 }))
  ];

  terminals.add(EOF);

  return {
    productions: augmentedProductions,
    nonTerminals: Array.from(nonTerminals),
    terminals: Array.from(terminals),
    startSymbol,
    augmentedStart
  };
}

export function computeNullableFirstFollow(productions, nonTerminals, terminals) {
  const nullable = new Set();
  const first = new Map();
  const follow = new Map();

  // Initialize
  nonTerminals.forEach(nt => {
    first.set(nt, new Set());
    follow.set(nt, new Set());
  });
  terminals.forEach(t => {
    const set = new Set([t]);
    first.set(t, set);
  });
  // Epsilon first is epsilon
  first.set(EPSILON, new Set([EPSILON]));

  // 1. Compute Nullable & Base FIRST iteratively until fixed point
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const prod of productions) {
      const { lhs, rhs } = prod;
      
      // Epsilon rule
      if (rhs.length === 1 && rhs[0] === EPSILON) {
        if (!nullable.has(lhs)) {
          nullable.add(lhs);
          changed = true;
        }
        continue;
      }

      // If all rhs symbols are nullable, then lhs is nullable
      let allNullable = true;
      for (const sym of rhs) {
        if (!nullable.has(sym)) {
          allNullable = false;
          break;
        }
      }
      if (allNullable && !nullable.has(lhs)) {
        nullable.add(lhs);
        changed = true;
      }

      // FIRST computation
      for (let i = 0; i < rhs.length; i++) {
        const sym = rhs[i];
        const symFirst = first.get(sym) || new Set();
        const lhsFirst = first.get(lhs);

        for (const val of symFirst) {
          if (val !== EPSILON && !lhsFirst.has(val)) {
            lhsFirst.add(val);
            changed = true;
          }
        }

        // Stop cascading if this symbol isn't nullable
        if (!nullable.has(sym)) {
          break;
        }

        // If we reached the end and all are nullable, add epsilon to LHS FIRST
        if (i === rhs.length - 1) {
          if (!lhsFirst.has(EPSILON)) {
            lhsFirst.add(EPSILON);
            changed = true;
          }
        }
      }
    }
  }

  // Helper: FIRST of a sequence β = Y1 Y2 ... Yk
  const computeFirstOfSequence = (sequence) => {
    const result = new Set();
    if (sequence.length === 0) {
      result.add(EPSILON);
      return result;
    }
    for (let i = 0; i < sequence.length; i++) {
      const sym = sequence[i];
      const symFirst = first.get(sym) || new Set();
      for (const val of symFirst) {
        if (val !== EPSILON) result.add(val);
      }
      if (!nullable.has(sym)) return result;
    }
    result.add(EPSILON);
    return result;
  };

  // 2. Compute FOLLOW
  // Start symbol gets EOF
  const startSym = productions[0].lhs; // Which is S'
  follow.get(startSym).add(EOF);

  changed = true;
  while (changed) {
    changed = false;
    for (const prod of productions) {
      const { lhs, rhs } = prod;
      for (let i = 0; i < rhs.length; i++) {
        const B = rhs[i];
        if (!nonTerminals.includes(B)) continue;

        const followB = follow.get(B);
        const beta = rhs.slice(i + 1);
        const firstBeta = computeFirstOfSequence(beta);

        // Rule: Add First(beta) \ {epsilon} to Follow(B)
        for (const val of firstBeta) {
          if (val !== EPSILON && !followB.has(val)) {
            followB.add(val);
            changed = true;
          }
        }

        // Rule: If beta is nullable (or empty), everything in Follow(LHS) goes to Follow(B)
        if (firstBeta.has(EPSILON)) {
          const followLHS = follow.get(lhs);
          for (const val of followLHS) {
            if (!followB.has(val)) {
              followB.add(val);
              changed = true;
            }
          }
        }
      }
    }
  }

  return { nullable, first, follow, computeFirstOfSequence };
}

/**
 * Generates a random sentence valid for the grammar starting from a node.
 * Prevents infinite recursion by preferring terminals/shorter paths when depth increases.
 */
export function generateSampleString(productions, startSymbol) {
  let depth = 0;
  const maxDepth = 12;

  const expand = (symbol) => {
    depth++;
    if (depth > maxDepth) return symbol === EPSILON ? '' : 'id'; // Guard rail

    const relevantProds = productions.filter(p => p.lhs === symbol);
    if (relevantProds.length === 0) {
      return symbol === EPSILON ? '' : symbol; // It's a terminal
    }

    // Sort by complexity (shortest RHS, or terminal-only RHS)
    relevantProds.sort((a, b) => {
      const containsNT = (p) => p.rhs.some(s => productions.some(x => x.lhs === s));
      if (containsNT(a) && !containsNT(b)) return 1;
      if (!containsNT(a) && containsNT(b)) return -1;
      return a.rhs.length - b.rhs.length;
    });

    // If deep, pick simple one. Otherwise pick reasonably.
    let chosenIdx = 0;
    if (depth < 5) {
      chosenIdx = Math.floor(Math.random() * Math.min(3, relevantProds.length));
    }
    const chosen = relevantProds[chosenIdx] || relevantProds[0];
    
    return chosen.rhs.map(expand).join(' ').trim();
  };

  try {
    const rawResult = expand(startSymbol);
    return rawResult.replace(/\s+/g, ' ').replace(new RegExp(EPSILON, 'g'), '').trim();
  } catch (err) {
    return "id = id + id"; // Fallback safe string
  }
}
