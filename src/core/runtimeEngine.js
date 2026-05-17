/**
 * Runtime Engine
 * Contains Lexical Scanner, LALR Parsing Simulator, Parse Tree Builder,
 * Symbol Table generator, Semantic checking, and dynamic 3-Address Code Emitter.
 */

import { EOF, EPSILON } from './grammarEngine';

// ====================================================================
// 1. DYNAMIC LEXER
// ====================================================================
export function runLexer(code, terminals = []) {
  // Strip standard C-style comments
  let sanitized = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  
  // Helper to check if grammar contains special token types
  const hasIdToken = terminals.includes('id');
  const hasNumToken = terminals.includes('num');

  // Sort keywords and multi-char operators to match longest first
  const keywords = terminals.filter(t => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t) && t !== 'id' && t !== 'num');
  const operators = terminals.filter(t => !/^[a-zA-Z0-9_]+$/.test(t) && t !== EOF);

  // Generic patterns
  const patterns = [
    // Whitespace (ignored, but delimits)
    { type: 'whitespace', regex: /^\s+/ },
    // Decimal/Integer constants
    { type: 'num', regex: /^[0-9]+(\.[0-9]+)?\b/ },
    // Specific custom keywords from grammar
    ...keywords.map(kw => ({ type: kw, regex: new RegExp(`^${kw}\\b`) })),
    // Universal Identifiers
    { type: 'id', regex: /^[a-zA-Z_][a-zA-Z0-9_]*\b/ },
    // Sorted special operators (longest match first to catch "==" before "=")
    ...operators.sort((a, b) => b.length - a.length).map(op => {
      // Escape special regex chars
      const escaped = op.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      return { type: op, regex: new RegExp(`^${escaped}`) };
    }),
    // Fallback basic single characters
    { type: 'char', regex: /^./ }
  ];

  const tokens = [];
  let cursor = 0;
  let line = 1;

  while (cursor < sanitized.length) {
    const window = sanitized.substring(cursor);
    let matched = false;

    for (const pattern of patterns) {
      const match = window.match(pattern.regex);
      if (match) {
        const lexeme = match[0];
        
        if (pattern.type === 'whitespace') {
          // Track line numbers
          line += (lexeme.match(/\n/g) || []).length;
        } else {
          // Determine proper category according to the grammar's vocabulary
          let resolvedType = pattern.type;
          
          if (pattern.type === 'id') {
            // If the grammar defines this EXACT string as a terminal keyword, treat as keyword
            if (terminals.includes(lexeme)) resolvedType = lexeme;
            // Otherwise map to 'id' only if grammar expects 'id'
            else if (hasIdToken) resolvedType = 'id';
          } else if (pattern.type === 'num') {
            if (hasNumToken) resolvedType = 'num';
          }

          tokens.push({
            lexeme,
            type: resolvedType,
            line,
            startIdx: cursor,
            endIdx: cursor + lexeme.length
          });
        }

        cursor += lexeme.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Deadlock protection
      cursor++;
    }
  }

  // Append End Of File Marker
  tokens.push({ lexeme: '$', type: EOF, line, startIdx: cursor, endIdx: cursor });
  return tokens;
}

// ====================================================================
// 2. LALR PARSER SIMULATOR & PARSE TREE GENERATOR
// ====================================================================
export function runParseSimulator(tokens, actionTable, gotoTable, productions) {
  const steps = [];
  const stack = [0];
  const nodeStack = []; // Store tree nodes for aggregation
  let pointer = 0;
  let nodeCounter = 0;

  const createNode = (name, type, children = [], lexeme = '') => ({
    id: `node_${nodeCounter++}`,
    name,
    type, // 'nonTerminal' | 'terminal' | 'epsilon'
    children,
    lexeme
  });

  let accept = false;
  let error = null;

  // Perform limit of 1000 steps to protect CPU
  while (pointer < tokens.length && steps.length < 1000) {
    const currentState = stack[stack.length - 1];
    const currentToken = tokens[pointer];
    const tokenType = currentToken.type;

    // Format current stack and input for display
    const stackStr = `[${stack.join(', ')}]`;
    const remainingInput = tokens.slice(pointer).map(t => t.lexeme).join(' ');

    const action = actionTable[currentState] ? actionTable[currentState][tokenType] : undefined;

    // Log this configuration
    const currentStep = {
      step: steps.length + 1,
      stack: [...stack],
      stackStr,
      input: remainingInput,
      nextToken: currentToken,
      actionStr: action || 'Error',
      nodeStackSnapshot: [...nodeStack]
    };
    steps.push(currentStep);

    if (!action) {
      // Build expected tokens error explanation
      const expected = Object.keys(actionTable[currentState] || {});
      error = `Syntax Error: Unexpected '${currentToken.lexeme}' on line ${currentToken.line}. Expected: ${expected.join(', ') || 'None'}`;
      break;
    }

    if (action === 'acc') {
      accept = true;
      break;
    }

    if (action.startsWith('S')) {
      // -------------------- SHIFT --------------------
      const nextState = parseInt(action.substring(1), 10);
      stack.push(nextState);
      
      // Push terminal node to stack
      nodeStack.push(createNode(tokenType, 'terminal', [], currentToken.lexeme));
      
      pointer++;
    } else if (action.startsWith('R')) {
      // -------------------- REDUCE --------------------
      const prodIdx = parseInt(action.substring(1), 10);
      const prod = productions[prodIdx]; // original production
      
      const isEpsilon = prod.rhs.length === 1 && prod.rhs[0] === EPSILON;
      const popCount = isEpsilon ? 0 : prod.rhs.length;

      const poppedChildren = [];
      for (let i = 0; i < popCount; i++) {
        stack.pop();
        poppedChildren.unshift(nodeStack.pop());
      }

      if (isEpsilon) {
        poppedChildren.push(createNode(EPSILON, 'epsilon'));
      }

      // Create Non-Terminal Parent node linking children
      const newParent = createNode(prod.lhs, 'nonTerminal', poppedChildren);
      nodeStack.push(newParent);

      // Consult GOTO table
      const topState = stack[stack.length - 1];
      const jumpState = gotoTable[topState] ? gotoTable[topState][prod.lhs] : undefined;

      if (jumpState === undefined) {
        error = `Internal Goto Error: No path on Non-Terminal '${prod.lhs}' from state ${topState}`;
        break;
      }
      stack.push(jumpState);
    }
  }

  return {
    steps,
    accept,
    error,
    parseTreeRoot: accept ? nodeStack[0] : null
  };
}

// ====================================================================
// 3. SYMBOL TABLE & SEMANTICS ENGINE
// ====================================================================
export function analyzeSemantics(parseTreeRoot) {
  const symbolTable = new Map(); // name -> { type, scope, initialized, offset }
  const errors = [];
  let offset = 0;

  if (!parseTreeRoot) return { symbolTable, errors };

  // Deep search function to find declared / used identifiers
  const traverse = (node) => {
    if (!node) return;

    // Look for explicit declaration structures, e.g., "int a;" or "float b;"
    // Often represented in tree by matching children structure: Type node + ID node
    const childNames = node.children.map(c => c.name);
    const childLexemes = node.children.map(c => c.lexeme);

    // Pattern 1: Type keyword followed by ID (Declaration)
    // e.g. "int x" or "float sum"
    const typeKeywords = ['int', 'float', 'double', 'char', 'bool'];
    let typeFound = null;
    let idFound = null;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (typeKeywords.includes(child.lexeme)) {
        typeFound = child.lexeme;
      }
      if (child.name === 'id') {
        idFound = child.lexeme;
      }
    }

    if (typeFound && idFound) {
      if (symbolTable.has(idFound)) {
        errors.push(`Semantic Error: Duplicate declaration of variable '${idFound}'.`);
      } else {
        symbolTable.set(idFound, {
          name: idFound,
          type: typeFound,
          scope: 'global',
          initialized: false,
          offset: offset
        });
        offset += typeFound === 'float' || typeFound === 'double' ? 8 : 4;
      }
    }

    // Pattern 2: Assignment "id = Expression" (Tracks initialization)
    // Look for a node with '=' and 'id' as its first child
    if (childLexemes.includes('=')) {
      const idChild = node.children.find(c => c.name === 'id' || c.lexeme === 'id');
      if (idChild && idChild.lexeme) {
        const varName = idChild.lexeme;
        // Implicit declaration if language supports standard JS-style assignment
        if (!symbolTable.has(varName)) {
          symbolTable.set(varName, {
            name: varName,
            type: 'inferred',
            scope: 'global',
            initialized: true,
            offset: offset
          });
          offset += 4;
        } else {
          symbolTable.get(varName).initialized = true;
        }
      }
    }

    // Check for Undeclared Variables:
    // If a terminal node is 'id', check if it is registered
    if (node.type === 'terminal' && node.name === 'id') {
      const varName = node.lexeme;
      // If it's not registered at all, log undeclared use!
      if (!symbolTable.has(varName)) {
        errors.push(`Semantic Alert: Variable '${varName}' used without explicit declaration!`);
        // Auto-inject to symbol table to prevent spamming errors
        symbolTable.set(varName, {
          name: varName,
          type: 'implicit',
          scope: 'global',
          initialized: true,
          offset: offset
        });
        offset += 4;
      }
    }

    // Recursive search
    node.children.forEach(traverse);
  };

  traverse(parseTreeRoot);

  return {
    symbolTable: Array.from(symbolTable.values()),
    errors
  };
}

// ====================================================================
// 4. INTERMEDIATE CODE GENERATOR (THREE-ADDRESS CODE)
// ====================================================================
export function generateTAC(parseTreeRoot) {
  let tempCounter = 1;
  const instructions = [];

  const newTemp = () => `t${tempCounter++}`;

  if (!parseTreeRoot) return [];

  // Post-Order traversal to evaluate math expressions bottom-up
  const emit = (node) => {
    if (!node || node.type === 'epsilon') return null;

    // 1. Base cases: leaf operands
    if (node.type === 'terminal') {
      return node.lexeme;
    }

    // Handle parenthetical nodes: single non-terminal child, e.g. ( E )
    if (node.children.length === 3 && node.children[0].lexeme === '(' && node.children[2].lexeme === ')') {
      return emit(node.children[1]);
    }

    // 2. Evaluate child results
    const childResults = node.children.map(emit);

    // Look for algebraic operators in children
    const opIdx = node.children.findIndex(c => ['+', '-', '*', '/'].includes(c.lexeme));
    if (opIdx !== -1 && childResults.length >= 3) {
      const left = childResults[opIdx - 1];
      const op = node.children[opIdx].lexeme;
      const right = childResults[opIdx + 1];
      
      if (left !== null && right !== null) {
        const temp = newTemp();
        instructions.push({
          op,
          arg1: left,
          arg2: right,
          result: temp,
          stringRep: `${temp} = ${left} ${op} ${right}`
        });
        return temp;
      }
    }

    // Look for assignment operators
    const assignIdx = node.children.findIndex(c => c.lexeme === '=');
    if (assignIdx !== -1 && childResults.length >= 3) {
      const dest = childResults[assignIdx - 1];
      const src = childResults[assignIdx + 1];
      if (dest && src) {
        instructions.push({
          op: '=',
          arg1: src,
          arg2: null,
          result: dest,
          stringRep: `${dest} = ${src}`
        });
        return dest;
      }
    }

    // Fallback chain passing: if a non-terminal has exactly one meaningful child value, pass it up
    const activeResults = childResults.filter(r => r !== null);
    if (activeResults.length === 1) {
      return activeResults[0];
    }

    return null;
  };

  emit(parseTreeRoot);

  return instructions;
}
