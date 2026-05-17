# 🚀 LALR(1) Dynamic Compiler Simulator
### *An interactive visual engineering sandbox for dynamically compiling and visualizing Context-Free Grammars.*

This project is a highly sophisticated, modular web application that dynamically evaluates ANY user-supplied Context-Free Grammar (CFG), executes canonical LR(1) state constructions, performs LALR state-core merging, constructs parsing matrices, and runs a step-by-step stack simulator to generate real Parse Trees, Symbol Tables, and Intermediate Code (TAC).

---

## 🏗️ Dynamic Core Architecture
The mathematical pipeline resides entirely in pure, modular ES6 Javascript with no hardcoding:

1. **`grammarEngine.js`**: Parses user CFG strings, automatically derives Nullable sets, and recursively calculates **FIRST and FOLLOW** sets to fixed-points. Uses derivation backtracking to automatically create sample strings on-click.
2. **`lalrEngine.js`**: Employs deep LR(1) closures to build canonical itemsets `[A ➔ α • β, a]`. Groups sets by shared LR(0) cores to dynamically merge them into **LALR(1) States**. Detects and alerts users of **Shift-Reduce / Reduce-Reduce conflicts**.
3. **`runtimeEngine.js`**: Dynamically configures a Regex Lexer from grammar terminals, runs a visual step-by-step LALR stack machine simulation, models concrete **Parse Tree** hierarchies, populates static context symbol heaps, and evaluates syntax-directed translations to emit **Three-Address Code**.

---

## 💻 Technology Stack
* **Core Framework:** React 18 + Vite (Zero-lag Hot Reload)
* **Styles:** Tailwind CSS (Glassmorphic Dark IDE Vibe)
* **Algorithms:** Custom pure JS Closures & Table Synthesizers
* **Graph Renderers:** **D3.js** (Draggable, zoomable SVG DFA state network & Hierarchical Parse Trees)
* **Motion System:** Framer Motion (Smooth, non-disruptive UI state changes)
* **Store:** Zustand (Reactive central state binder)
* **Editor Components:** @uiw/react-codemirror (Live recompiling editors)

---

## 📂 Project Folder Matrix
```
/src
  ├── /core
  │   ├── grammarEngine.js    # Rules Parsing, FIRST/FOLLOW, Epsilon logic
  │   ├── lalrEngine.js       # Canonical item states, LALR Merges, ACTION-matrix
  │   ├── runtimeEngine.js    # Dynamic Lexer, Stack Tracing, Trees, TAC Emitter
  │   └── presets.js          # Educational Grammar presets library
  ├── /store
  │   └── compilerStore.js    # Central Zustand reactive compiler pipeline
  ├── /components
  │   ├── Editors.jsx         # CodeMirror panels & preset speed dials
  │   ├── GrammarTabs.jsx     # FIRST/FOLLOW, Rule renders, Parsers Grid
  │   ├── DfaTabs.jsx         # SVG D3.js Interactive DFA and state item charts
  │   └── RuntimeTabs.jsx     # SVG Parse Trees, Scrubber Traces, Symbol grid, TAC
  ├── App.jsx                 # Main visual IDE grid and navigation
  └── index.css               # Custom Glassmorphism and tailwind bases
```

---

## 🛠️ Local Developer Execution
The server is currently running actively in your workspace background.

To inspect the application in your browser, navigate to:
### 👉 **`http://localhost:5173`**

#### Manual Setup Commands (If rebuilding from scratch):
1. Enter project directory: `cd lalr_simulator`
2. Install node modules: `npm install`
3. Launch Local server: `npm run dev`
4. Open `http://localhost:5173` in any modern web browser.

---

## 🧪 System Capabilities Checklist
* [x] **Fully Dynamic:** Type ANY valid CFG; all states and graphs rebuild live on keydown.
* [x] **Guided Teacher Legend:** Auto-explains mapping configurations for `id` and `num`.
* [x] **Visual Trace Scrubber:** Interactive Next/Prev/Auto-Play buttons to view Stack frames.
* [x] **Advanced Semantics:** Tracks implicit vs. explicit scope mappings and registers static static offsets in HEX.
* [x] **High Fidelity DFA:** Draggable bubbles with SVG self-loops for clean visual tracking.
