import React, { useEffect, useRef, useState } from 'react';
import { useCompilerStore } from '../store/compilerStore';
import { EmptyState } from './GrammarTabs';
import * as d3 from 'd3';
import { Network, Merge, Layers, HelpCircle } from 'lucide-react';

// ====================================================================
// HELPER: GROUP AND PRETTY-PRINT ITEMS
// ====================================================================
function renderPrettyItems(itemsSet, productions) {
  const coreGroups = new Map(); // "prodIdx_dot" -> Set of lookaheads
  
  for (const itemKey of itemsSet) {
    const parts = itemKey.split('_');
    const key = `${parts[0]}_${parts[1]}`;
    if (!coreGroups.has(key)) coreGroups.set(key, new Set());
    coreGroups.get(key).add(parts[2]);
  }

  return Array.from(coreGroups.entries()).map(([coreKey, lookaheads]) => {
    const parts = coreKey.split('_');
    const prod = productions[parseInt(parts[0], 10)];
    const dot = parseInt(parts[1], 10);
    
    const alpha = prod.rhs.slice(0, dot).join(' ');
    const beta = prod.rhs.slice(dot).join(' ');
    
    return (
      <div key={coreKey} className="text-[11px] font-mono py-1 flex items-center justify-between border-b border-slate-900/50 last:border-none gap-4">
        <div>
          <span className="text-sky-300 font-bold">{prod.lhs}</span>
          <span className="text-slate-500 mx-2">→</span>
          <span className="text-slate-300">{alpha}</span>
          <span className="inline-block w-2 h-2 bg-teal-400 rounded-full mx-1 animate-pulse"></span>
          <span className="text-slate-300">{beta}</span>
        </div>
        <div className="text-amber-400 font-bold bg-amber-400/5 px-1.5 rounded border border-amber-500/10">
          {Array.from(lookaheads).join(' / ')}
        </div>
      </div>
    );
  });
}

// ====================================================================
// TABS 4: LR(1) ITEMS EXPLORER
// ====================================================================
export function LRItemsTab() {
  const { parsedGrammar, lalrData } = useCompilerStore();

  if (!parsedGrammar || !lalrData) return <EmptyState />;

  return (
    <div className="flex flex-col gap-5 animate-fade-in h-full">
      <div className="border-b border-slate-800 pb-3 flex items-center gap-3">
        <h3 className="text-lg font-bold text-slate-200">Merged LALR(1) Canonical Collection</h3>
        <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Items List</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto flex-1 pr-2">
        {lalrData.states.map((state, idx) => (
          <div key={idx} className="glass-card flex flex-col hover:border-indigo-500/30 transition-all overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="font-mono text-xs font-bold text-indigo-300">STATE I{idx}</span>
              </div>
              <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 font-mono font-bold uppercase">
                {state.originalIndices.length > 1 ? `Merged x${state.originalIndices.length}` : 'LR1 Prime'}
              </span>
            </div>
            <div className="p-4 bg-slate-950/40 flex-1 flex flex-col gap-1 leading-relaxed select-all">
              {renderPrettyItems(state.items, parsedGrammar.productions)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====================================================================
// TABS 5: D3.JS DFA GRAPH COMPONENT
// ====================================================================
export function DFAGraphTab() {
  const { parsedGrammar, lalrData } = useCompilerStore();
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!lalrData || !svgRef.current) return;

    const width = 800;
    const height = 600;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear existing

    // Define arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#475569');

    // Container for zooming
    const g = svg.append('g');

    // Setup zoom
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    
    svg.call(zoom);

    const nodes = lalrData.states.map((s, i) => ({ id: i, name: `I${i}`, val: s.items.size }));
    const links = lalrData.transitions.map((t, i) => ({
      source: t.from,
      target: t.to,
      label: t.symbol,
      id: i
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Draw Links (Paths)
    const link = g.append('g')
      .selectAll('.link')
      .data(links)
      .enter().append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');

    // Draw labels for links
    const linkLabel = g.append('g')
      .selectAll('.link-label')
      .data(links)
      .enter().append('text')
      .attr('class', 'link-label')
      .attr('fill', '#fbbf24')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('text-anchor', 'middle')
      .text(d => d.label);

    // Draw Nodes (Circles)
    const node = g.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => setSelectedNode(d.id));

    node.append('circle')
      .attr('r', 18)
      .attr('fill', d => d.id === 0 ? '#10b981' : '#4f46e5')
      .attr('stroke', '#1e1b4b')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .attr('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))');

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('cursor', 'pointer')
      .text(d => d.name);

    simulation.on('tick', () => {
      link.attr('d', d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Self-loop rendering
        if (d.source.id === d.target.id) {
          return `M${d.source.x},${d.source.y} C${d.source.x-30},${d.source.y-40} ${d.source.x+30},${d.source.y-40} ${d.source.x},${d.source.y}`;
        }
        
        // Straight or subtle curved links
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
      });

      linkLabel
        .attr('x', d => d.source.id === d.target.id ? d.source.x : (d.source.x + d.target.x) / 2)
        .attr('y', d => d.source.id === d.target.id ? d.source.y - 45 : (d.source.y + d.target.y) / 2 - 5);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Initial fitting
    svg.call(zoom.transform, d3.zoomIdentity.translate(width/6, height/6).scale(0.85));

  }, [lalrData]);

  if (!parsedGrammar || !lalrData) return <EmptyState />;

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full animate-fade-in">
      <div className="flex flex-col gap-3 flex-1 min-h-[400px] glass-card p-4 relative">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Interactive LALR DFA Graph</h4>
          </div>
          <span className="text-[10px] text-slate-500 italic">💡 Drag to arrange • Scroll to Zoom • Click node for info</span>
        </div>
        <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden relative">
          <svg ref={svgRef} width="100%" height="100%" className="block" viewBox="0 0 800 600" />
        </div>
      </div>

      {/* Inspector Panel */}
      <div className="w-full lg:w-[300px] glass-card flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-900/40 border-b border-slate-800 font-bold text-xs text-slate-300 flex items-center gap-2 uppercase">
          <Layers className="w-4 h-4 text-sky-400" /> Inspector: State Information
        </div>
        <div className="p-4 flex-1 overflow-y-auto bg-slate-950/40">
          {selectedNode !== null ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm font-bold text-indigo-400 font-mono">STATE I{selectedNode}</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                  {lalrData.states[selectedNode].items.size} items
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {renderPrettyItems(lalrData.states[selectedNode].items, parsedGrammar.productions)}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/60">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-2">Direct Transitions:</div>
                <div className="flex flex-col gap-1 text-xs font-mono">
                  {lalrData.transitions.filter(t => t.from === selectedNode).map((t, idx) => (
                    <div key={idx} className="flex justify-between p-1.5 bg-slate-900/40 border border-slate-800/40 rounded">
                      <span>On <span className="text-amber-400 font-bold">{t.symbol}</span></span>
                      <span className="text-slate-400">➔ I{t.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 text-xs italic text-center flex-col gap-2">
              <Network className="w-8 h-8 text-slate-800 animate-pulse" />
              Click any state bubble in the graph to inspect its item closures.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TABS 6: LALR MERGE VISUALIZATION
// ====================================================================
export function LALRMergeTab() {
  const { parsedGrammar, lalrData } = useCompilerStore();

  if (!parsedGrammar || !lalrData) return <EmptyState />;

  const mergedStates = lalrData.states.filter(s => s.originalIndices.length > 1);

  return (
    <div className="flex flex-col gap-5 animate-fade-in h-full">
      <div className="border-b border-slate-800 pb-3 flex items-center gap-3">
        <h3 className="text-lg font-bold text-slate-200">State Merge Audit Console</h3>
        <span className="px-2.5 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Canonical Compression</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 bg-indigo-950/10 flex items-center justify-between border-indigo-500/20">
          <div>
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Total LR(1) States</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">{lalrData.lr1StatesCount}</div>
          </div>
          <Layers className="w-7 h-7 text-indigo-500/40" />
        </div>
        <div className="glass-card p-4 bg-teal-950/10 flex items-center justify-between border-teal-500/20">
          <div>
            <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Final LALR(1) States</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">{lalrData.lalrStatesCount}</div>
          </div>
          <Merge className="w-7 h-7 text-teal-500/40" />
        </div>
        <div className="glass-card p-4 bg-pink-950/10 flex items-center justify-between border-pink-500/20">
          <div>
            <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Core State Savings</div>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {Math.round((1 - lalrData.lalrStatesCount / lalrData.lr1StatesCount) * 100)}%
            </div>
          </div>
          <HelpCircle className="w-7 h-7 text-pink-500/40" />
        </div>
      </div>

      <div className="glass-card flex-1 flex flex-col overflow-hidden p-5">
        <div className="text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
          <Merge className="w-4 h-4 text-indigo-400" /> Merge Log Transcript
        </div>
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
          {mergedStates.length > 0 ? (
            mergedStates.map((state, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold flex items-center gap-2 text-slate-300 font-mono">
                    Merge Set {idx+1}: 
                    <span className="text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded">
                      {state.originalIndices.map(i => `I${i}`).join(' ⊕ ')}
                    </span>
                    ➔ 
                    <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Final LALR State
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 border-t border-slate-900/80 pt-2">
                  Shared LR(0) Core CoreKey:
                  <div className="font-mono text-[9px] bg-slate-900 p-2 rounded text-slate-400 break-all leading-relaxed mt-1">
                    {state.coreKey.split('|').join(', ')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 font-medium text-xs py-10 text-center italic">
              No states required merging. The canonical LR(1) set is already minimal (typical for very simple grammars).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
