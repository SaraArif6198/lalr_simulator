export const GRAMMAR_PRESETS = [
  // LECTURE EXAMPLES
  {
    category: "Lecture Examples",
    id: "lec-classic",
    name: "Classic LALR(1) (Slide 15)",
    desc: "Proves LALR(1) state-merging logic works perfectly.",
    grammar: "S -> A A\nA -> a A | b",
    sampleCode: "a a b b"
  },
  {
    category: "Lecture Examples",
    id: "lec-canonical",
    name: "Canonical LALR (Slide 22)",
    desc: "Proves state space reduction in Table Driven Parsing.",
    grammar: "S -> C C\nC -> c C | d",
    sampleCode: "c c d d"
  },
  {
    category: "Lecture Examples",
    id: "lec-var-decl",
    name: "Variable Decl (Slide 10)",
    desc: "Real programming typed declarations.",
    grammar: "D -> T L ;\nT -> int | float | char\nL -> L , id | id",
    sampleCode: "int id , id ;"
  },
  {
    category: "Lecture Examples",
    id: "lec-math",
    name: "Math Precedence (Slide 41)",
    desc: "Testing Operator Hierarchy.",
    grammar: "E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id",
    sampleCode: "id + id * id"
  },
  {
    category: "Lecture Examples",
    id: "lec-parens",
    name: "Balanced Parens (Slide 34)",
    desc: "Testing deep recursive shift/reduce loops.",
    grammar: "S -> ( S ) | id",
    sampleCode: "( ( id ) )"
  },

  // ADVANCED EXAMPLES
  {
    category: "Advanced Examples",
    id: "adv-while",
    name: "While Control Flow",
    desc: "While loop with comparative boolean conditions.",
    grammar: "S -> while ( C ) { B }\nC -> id < num | id > num | id == num\nB -> id = id + num ;",
    sampleCode: "while ( count < 10 ) {\n  count = count + 1 ;\n}"
  },
  {
    category: "Advanced Examples",
    id: "adv-if-else",
    name: "If-Else Branching",
    desc: "Classic if-else statement parsing.",
    grammar: "S -> if ( C ) { B } else { B }\nC -> id == num | id != num\nB -> id = num ; | id = id + num ;",
    sampleCode: "if ( x == 5 ) {\n  y = 10 ;\n} else {\n  y = 0 ;\n}"
  },
  {
    category: "Advanced Examples",
    id: "adv-for",
    name: "For Loop Setup",
    desc: "Classic C-style for loop.",
    grammar: "S -> for ( A ; C ; I ) { B }\nA -> int id = num\nC -> id < num | id > num\nI -> id ++\nB -> id = id * num ;",
    sampleCode: "for ( int i = 0 ; i < 10 ; i ++ ) {\n  total = total * 2 ;\n}"
  },
  {
    category: "Advanced Examples",
    id: "adv-arith",
    name: "Complex BEDMAS Arithmetic",
    desc: "Full mathematical precedence parser with subtraction and division.",
    grammar: "E -> E + T | E - T | T\nT -> T * F | T / F | F\nF -> ( E ) | id | num",
    sampleCode: "score + 5 * ( health - 10 ) / 2"
  },

  // AZADI++ EXAMPLES
  {
    category: "Azadi++ Examples",
    id: "az-print",
    name: "Azadi++: Print (bolo)",
    desc: "Simple bolo (print) statement.",
    grammar: "PROG -> shuru STATEMENTS khatam\nSTATEMENTS -> STATEMENTS STATEMENT | STATEMENT\nSTATEMENT -> bolo id ;",
    sampleCode: "shuru bolo result ; khatam"
  },
  {
    category: "Azadi++ Examples",
    id: "az-assign",
    name: "Azadi++: Assignment (rakho)",
    desc: "rakho (let/var) assignment.",
    grammar: "PROG -> shuru STATEMENTS khatam\nSTATEMENTS -> STATEMENTS STATEMENT | STATEMENT\nSTATEMENT -> rakho id = num ; | bolo id ;",
    sampleCode: "shuru rakho score = 100 ; bolo score ; khatam"
  },
  {
    category: "Azadi++ Examples",
    id: "az-math",
    name: "Azadi++: Expression",
    desc: "Math inside Azadi++ variables.",
    grammar: "PROG -> shuru STATEMENTS khatam\nSTATEMENTS -> STATEMENTS STATEMENT | STATEMENT\nSTATEMENT -> rakho id = E ;\nE -> E + T | T\nT -> id | num",
    sampleCode: "shuru rakho total = base + 50 ; khatam"
  },
  {
    category: "Azadi++ Examples",
    id: "az-if",
    name: "Azadi++: Condition (agar)",
    desc: "agar (if) block logic.",
    grammar: "PROG -> shuru STATEMENTS khatam\nSTATEMENTS -> STATEMENTS STATEMENT | STATEMENT\nSTATEMENT -> agar ( C ) { B }\nC -> id > num | id < num\nB -> bolo id ;",
    sampleCode: "shuru agar ( age > 18 ) { bolo pass ; } khatam"
  }
];
