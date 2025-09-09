import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
// We'll use dynamic import for svg-pan-zoom

// Initialize mermaid with defaults - Japanese aesthetic
mermaid.initialize({
  startOnLoad: true,
  theme: 'neutral',
  securityLevel: 'loose',
  suppressErrorRendering: true,
  logLevel: 'error',
  maxTextSize: 100000, // Increase text size limit
  htmlLabels: true,
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 60,
    rankSpacing: 60,
    padding: 20,
  },
  themeCSS: `
    /* Japanese aesthetic styles for all diagrams */
    .node rect, .node circle, .node ellipse, .node polygon, .node path {
      fill: #f8f4e6;
      stroke: #d7c4bb;
      stroke-width: 1px;
    }
    .edgePath .path {
      stroke: #9b7cb9;
      stroke-width: 1.5px;
    }
    .edgeLabel {
      background-color: transparent;
      color: #333333;
      p {
        background-color: transparent !important;
      }
    }
    .label {
      color: #333333;
    }
    .cluster rect {
      fill: #f8f4e6;
      stroke: #d7c4bb;
      stroke-width: 1px;
    }

    /* Sequence diagram specific styles */
    .actor {
      fill: #f8f4e6;
      stroke: #d7c4bb;
      stroke-width: 1px;
    }
    text.actor {
      fill: #333333;
      stroke: none;
    }
    .messageText {
      fill: #333333;
      stroke: none;
    }
    .messageLine0, .messageLine1 {
      stroke: #9b7cb9;
    }
    .noteText {
      fill: #333333;
    }

    /* Dark mode overrides - will be applied with data-theme="dark" */
    [data-theme="dark"] .node rect,
    [data-theme="dark"] .node circle,
    [data-theme="dark"] .node ellipse,
    [data-theme="dark"] .node polygon,
    [data-theme="dark"] .node path {
      fill: #222222;
      stroke: #5d4037;
    }
    [data-theme="dark"] .edgePath .path {
      stroke: #9370db;
    }
    [data-theme="dark"] .edgeLabel {
      background-color: transparent;
      color: #f0f0f0;
    }
    [data-theme="dark"] .label {
      color: #f0f0f0;
    }
    [data-theme="dark"] .cluster rect {
      fill: #222222;
      stroke: #5d4037;
    }
    [data-theme="dark"] .flowchart-link {
      stroke: #9370db;
    }

    /* Dark mode sequence diagram overrides */
    [data-theme="dark"] .actor {
      fill: #222222;
      stroke: #5d4037;
    }
    [data-theme="dark"] text.actor {
      fill: #f0f0f0;
      stroke: none;
    }
    [data-theme="dark"] .messageText {
      fill: #f0f0f0;
      stroke: none;
      font-weight: 500;
    }
    [data-theme="dark"] .messageLine0, [data-theme="dark"] .messageLine1 {
      stroke: #9370db;
      stroke-width: 1.5px;
    }
    [data-theme="dark"] .noteText {
      fill: #f0f0f0;
    }
    /* Additional styles for sequence diagram text */
    [data-theme="dark"] #sequenceNumber {
      fill: #f0f0f0;
    }
    [data-theme="dark"] text.sequenceText {
      fill: #f0f0f0;
      font-weight: 500;
    }
    [data-theme="dark"] text.loopText, [data-theme="dark"] text.loopText tspan {
      fill: #f0f0f0;
    }
    /* Add a subtle background to message text for better readability */
    [data-theme="dark"] .messageText, [data-theme="dark"] text.sequenceText {
      paint-order: stroke;
      stroke: #1a1a1a;
      stroke-width: 2px;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Force text elements to be properly colored */
    text[text-anchor][dominant-baseline],
    text[text-anchor][alignment-baseline],
    .nodeLabel,
    .edgeLabel,
    .label,
    text {
      fill: #777 !important;
    }

    [data-theme="dark"] text[text-anchor][dominant-baseline],
    [data-theme="dark"] text[text-anchor][alignment-baseline],
    [data-theme="dark"] .nodeLabel,
    [data-theme="dark"] .edgeLabel,
    [data-theme="dark"] .label,
    [data-theme="dark"] text {
      fill: #f0f0f0 !important;
    }

    /* Add clickable element styles with subtle transitions */
    .clickable {
      transition: all 0.3s ease;
    }
    .clickable:hover {
      transform: scale(1.03);
      cursor: pointer;
    }
    .clickable:hover > * {
      filter: brightness(0.95);
    }
  `,
  fontFamily: 'var(--font-geist-sans), var(--font-serif-jp), sans-serif',
  fontSize: 12,
});

interface MermaidProps {
  chart: string;
  className?: string;
  zoomingEnabled?: boolean;
}

// Full screen modal component for the diagram
const FullScreenModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Reset zoom when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div
        ref={modalRef}
        className="bg-[var(--card-bg)] rounded-lg shadow-custom max-w-5xl max-h-[90vh] w-full overflow-hidden flex flex-col card-japanese"
      >
        {/* Modal header with controls */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="font-medium text-[var(--foreground)] font-serif">Display Chart</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="text-[var(--foreground)] hover:bg-[var(--accent-primary)]/10 p-2 rounded-md border border-[var(--border-color)] transition-colors"
                aria-label="Zoom out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <span className="text-sm text-[var(--muted)]">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="text-[var(--foreground)] hover:bg-[var(--accent-primary)]/10 p-2 rounded-md border border-[var(--border-color)] transition-colors"
                aria-label="Zoom in"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <button
                onClick={() => setZoom(1)}
                className="text-[var(--foreground)] hover:bg-[var(--accent-primary)]/10 p-2 rounded-md border border-[var(--border-color)] transition-colors"
                aria-label="Reset zoom"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                </svg>
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--foreground)] hover:bg-[var(--accent-primary)]/10 p-2 rounded-md border border-[var(--border-color)] transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Modal content with zoom */}
        <div className="overflow-auto p-6 flex-1 flex items-center justify-center bg-[var(--background)]/50">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease-out'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// MermaidConverter class for handling Mermaid v11.3.0 @{} syntax conversion
class MermaidConverter {
  // Detect the type of Mermaid diagram
  public detectDiagramType(mermaidCode: string): string {
    const firstLine = mermaidCode.trim().split('\n')[0].toLowerCase();
    
    if (firstLine.includes('sequencediagram')) return 'sequence';
    if (firstLine.includes('flowchart')) return 'flowchart';
    if (firstLine.includes('graph')) return 'graph';
    if (firstLine.includes('classDiagram')) return 'class';
    if (firstLine.includes('stateDiagram')) return 'state';
    if (firstLine.includes('erDiagram')) return 'er';
    if (firstLine.includes('gantt')) return 'gantt';
    if (firstLine.includes('pie')) return 'pie';
    if (firstLine.includes('gitGraph')) return 'git';
    
    return 'unknown';
  }

  // Normalize sequence diagram activations to ensure proper pairing
  private normalizeSequenceActivations(lines: string[]): string[] {
    const result: string[] = [...lines];
    const activationStacks = new Map<string, number[]>();
    
    // 정규식 패턴 - activate/deactivate 감지
    const activatePattern = /^(\s*)([\w\s]+?)\s*(--?>>|\->>)\+\s*([\w\s]+?)\s*:\s*(.+)$/;
    const deactivatePattern = /^(\s*)([\w\s]+?)\s*(--?>>|\->>)\-\s*([\w\s]+?)\s*:\s*(.+)$/;
    
    // 첫 번째 패스: activation/deactivation 처리
    for (let i = 0; i < result.length; i++) {
      const line = result[i];
      
      // activation 확인
      const activateMatch = line.match(activatePattern);
      if (activateMatch) {
        const target = activateMatch[4].trim();
        if (!activationStacks.has(target)) {
          activationStacks.set(target, []);
        }
        activationStacks.get(target)!.push(i);
        continue;
      }
      
      // deactivation 확인
      const deactivateMatch = line.match(deactivatePattern);
      if (deactivateMatch) {
        const from = deactivateMatch[2].trim(); // deactivation에서는 from이 deactivate됨
        if (activationStacks.has(from) && activationStacks.get(from)!.length > 0) {
          // 올바른 쌍 - 스택에서 제거
          activationStacks.get(from)!.pop();
        } else {
          // 잘못된 deactivation - '-' 기호 제거
          const [, indent, fromPart, arrow, to, message] = deactivateMatch;
          result[i] = `${indent}${fromPart}${arrow}${to}: ${message}`;
        }
        continue;
      }
    }
    
    // 두 번째 패스: 쌍이 없는 activation들 제거
    activationStacks.forEach((stack) => {
      stack.forEach(lineIndex => {
        const line = result[lineIndex];
        const match = line.match(activatePattern);
        if (match) {
          const [, indent, from, arrow, to, message] = match;
          result[lineIndex] = `${indent}${from}${arrow}${to}: ${message}`;
        }
      });
    });
    
    return result;
  }

  // Process sequence diagram according to official Mermaid syntax
  private processSequenceDiagram(lines: string[]): string[] {
    // 먼저 activation/deactivation 정규화
    const normalizedLines = this.normalizeSequenceActivations(lines);
    
    // 그 다음 기존 처리 (세미콜론 이스케이프)
    const result: string[] = [];
    for (const line of normalizedLines) {
      const messagePattern = /^(\s*)([\w\s]+)(->>\+?|-->>\-?|->>|-->>|-x|->|-->)([\w\s]+):\s*(.+)$/;
      const match = line.match(messagePattern);
      
      if (match) {
        const [, indent, from, arrow, to, message] = match;
        // According to Mermaid docs, semicolons must be escaped as #59;
        // because they can be used as line breaks in the markup
        const escapedMessage = message.replace(/;/g, '#59;');
        result.push(`${indent}${from}${arrow}${to}: ${escapedMessage}`);
      } else {
        // Keep other lines as-is (sequenceDiagram declaration, participant declarations, notes, etc.)
        result.push(line);
      }
    }
    
    return result;
  }

  // Process flowchart/graph diagram according to official Mermaid syntax
  private processFlowchartDiagram(lines: string[]): string[] {
    const result: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Keep empty lines as-is
      if (trimmedLine === '') {
        result.push(line);
        continue;
      }
      
      let processedLine = line;
      
      // Skip lines that already have the new @{ shape: ... } syntax
      // This prevents double conversion of already converted nodes
      if (processedLine.includes('@{ shape:')) {
        result.push(processedLine);
        continue;
      }
      
      // Handle edge labels with pipes
      processedLine = processedLine.replace(/\|([^|]+)\|/g, (match, label) => {
        const trimmedLabel = label.trim();
        // Check if label is already quoted
        if (trimmedLabel.startsWith('"') && trimmedLabel.endsWith('"')) {
          return match;
        }
        // Add quotes and escape internal quotes
        return `|"${this.escapeQuotes(trimmedLabel)}"|`;
      });
      
      // Process node definitions
      processedLine = this.processNodeDefinitions(processedLine);
      
      result.push(processedLine);
    }
    
    // Validate the converted flowchart
    const convertedChart = result.join('\n');
    if (!this.validateFlowchartLabels(convertedChart)) {
      console.warn("⚠️ Flowchart validation failed, some labels may have unbalanced brackets");
      // Note: We still return the converted chart, but with a warning
      // The caller (preprocessChart) can decide whether to use it or fallback
    }
    
    return result;
  }
  
  // Validate flowchart labels for proper bracket balance
  private validateFlowchartLabels(chart: string): boolean {
    // Extract all labels from @{ shape: ..., label: "..." } syntax
    const labelMatches = chart.match(/label: "((?:[^"\\]|\\.)*)"/g);
    
    if (!labelMatches) {
      return true; // No labels to validate
    }
    
    for (const match of labelMatches) {
      const label = match.substring(8, match.length - 1); // Extract label content
      
      // Skip validation for nested @{ shape: syntax (shouldn't happen but just in case)
      if (label.includes('@{ shape:')) {
        continue;
      }
      
      // Check bracket balance in the label
      if (!checkLabelBracketBalance(label)) {
        console.warn("⚠️ Unbalanced brackets in label:", label);
        return false;
      }
    }
    
    return true;
  }

  // Process other diagram types (placeholder for future implementations)
  private processOtherDiagram(lines: string[]): string[] {
    // For now, return as-is
    // In the future, we can add specific processing for class, state, ER, etc.
    return lines;
  }

  // Main conversion method
  public toNewSyntax(mermaidCode: string): string {
    const lines = mermaidCode.split('\n');
    const diagramType = this.detectDiagramType(mermaidCode);
    
    let processedLines: string[];
    
    switch (diagramType) {
      case 'sequence':
        processedLines = this.processSequenceDiagram(lines);
        break;
      case 'flowchart':
      case 'graph':
      case 'unknown':  // Treat unknown as flowchart/graph for backward compatibility
      default:
        processedLines = this.processFlowchartDiagram(lines);
        break;
    }
    
    return processedLines.join('\n');
  }

  // Helper method to escape quotes
  private escapeQuotes(text: string): string {
    return text.replace(/"/g, '\\"');
  }

  // Process rectangle shape [text]
  private processRectangleShape(line: string, nodeDefinitions: Map<string, string>): string {
    // More sophisticated regex to handle nested brackets and special characters
    const regex = /(\w+)\[([^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*)\]/g;
    
    return line.replace(regex, (match, nodeId, label) => {
      let cleanLabel = label.trim();
      
      // Handle escaped quotes and special characters in labels
      if (cleanLabel.includes('"')) {
        // Escape quotes for the @{} syntax
        cleanLabel = cleanLabel.replace(/"/g, '\\"');
      }
      
      nodeDefinitions.set(nodeId, `@{ shape: rect, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process diamond shape {text}
  private processDiamondShape(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\{([^}]+)\}/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: diam, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process circle shape ((text))
  private processCircleShape(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\(\(([^)]+)\)\)/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: circle, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process asymmetric shape >text]
  private processAsymmetricShape(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)>([^\]]+)\]/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: odd, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

    // Process hexagon shape {{text}}
  private processHexagonShape(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\{\{([^}]+)\}\}/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: hex, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process parallelogram-right [/text/]
  private processParallelogramRight(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\[\/([^\/]+)\/\]/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: lean-r, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process parallelogram-left [\text\]
  private processParallelogramLeft(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\[\\([^\\]+)\\\]/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: lean-l, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process trapezoid [/text\]
  private processTrapezoid(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\[\/([^\\]+)\\\]/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: trap-t, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process trapezoid alt [\text/]
  private processTrapezoidAlt(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\[\\([^/]+)\/\]/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: trap-b, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process double circle (((text)))
  private processDoubleCircle(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\(\(\(([^)]+)\)\)\)/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: doublecircle, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process subroutine [[text]]
  private processSubroutineShape(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\[\[([^\]]+)\]\]/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: subroutine, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process cylinder [(text)]
  private processCylinderShape(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\[\(([^)]+)\)\]/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: cyl, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process stadium ([text])
  private processStadiumShape(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\(\[([^\]]+)\]\)/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: stadium, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Process rounded shape (text)
  private processRoundedShape(line: string, nodeDefinitions: Map<string, string>): string {
    return line.replace(/(\w+)\(([^)]+)\)/g, (match, nodeId, label) => {
      const cleanLabel = label.trim();
      nodeDefinitions.set(nodeId, `@{ shape: rounded, label: "${cleanLabel}" }`);
      return `${nodeId}_MARKER_`;
    });
  }

  // Replace markers with actual conversions
  private replaceMarkersWithConversions(line: string, nodeDefinitions: Map<string, string>): string {
    let result = line;
    nodeDefinitions.forEach((conversion, nodeId) => {
      result = result.replace(new RegExp(`${nodeId}_MARKER_`, 'g'), `${nodeId}${conversion}`);
    });
    return result;
  }

  // Process node definitions (existing methods remain the same)
  private processNodeDefinitions(line: string): string {
    const nodeDefinitions: Map<string, string> = new Map();
    
    // Process different shape types - ORDER MATTERS!
    // More specific patterns must come before general patterns
    let processedLine = line;
    
    // Process double/triple patterns first
    processedLine = this.processDoubleCircle(processedLine, nodeDefinitions);
    processedLine = this.processSubroutineShape(processedLine, nodeDefinitions);
    processedLine = this.processHexagonShape(processedLine, nodeDefinitions);
    
    // Process special bracket patterns
    processedLine = this.processParallelogramRight(processedLine, nodeDefinitions);
    processedLine = this.processParallelogramLeft(processedLine, nodeDefinitions);
    processedLine = this.processTrapezoid(processedLine, nodeDefinitions);
    processedLine = this.processTrapezoidAlt(processedLine, nodeDefinitions);
    processedLine = this.processCylinderShape(processedLine, nodeDefinitions);
    processedLine = this.processStadiumShape(processedLine, nodeDefinitions);
    
    // Process single patterns last
    processedLine = this.processCircleShape(processedLine, nodeDefinitions);
    processedLine = this.processRectangleShape(processedLine, nodeDefinitions);
    processedLine = this.processDiamondShape(processedLine, nodeDefinitions);
    processedLine = this.processAsymmetricShape(processedLine, nodeDefinitions);
    processedLine = this.processRoundedShape(processedLine, nodeDefinitions);
    
    // Replace all markers with actual conversions
    return this.replaceMarkersWithConversions(processedLine, nodeDefinitions);
  }
}

// Instantiate the converter
export const mermaidConverter = new MermaidConverter();

// Helper function to handle escaped characters in Mermaid syntax
export const handleEscapedCharacters = (chart: string): string => {
  const lines = chart.split('\n');
  const result: string[] = [];
  
  for (const line of lines) {
    // Skip empty lines and graph declarations
    if (line.trim() === '' || line.trim().startsWith('graph') || line.trim().startsWith('flowchart')) {
      result.push(line);
      continue;
    }
    
    let processedLine = line;
    
    // Handle escaped square brackets: A[\[text\]] -> A["[text]"]
    processedLine = processedLine.replace(/(\w+)\[\\\[(.+?)\\\]\]/g, (match, nodeId, content) => {
      return `${nodeId}["[${content}]"]`;
    });
    
    // Handle escaped curly braces: A\{text\} -> A["{text}"]
    processedLine = processedLine.replace(/(\w+)\\\{(.+?)\\\}/g, (match, nodeId, content) => {
      return `${nodeId}["{${content}}"]`;
    });
    
    // Handle other escaped brackets in text (not node definitions)
    processedLine = processedLine.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
    processedLine = processedLine.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
    
    result.push(processedLine);
  }
  
  return result.join('\n');
};

// Helper function to check bracket balance in labels, considering context
export const checkLabelBracketBalance = (label: string): boolean => {
  let openCount = 0;
  let closeCount = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;
  
  for (let i = 0; i < label.length; i++) {
    const char = label[i];
    
    // Handle escape sequences
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    // Handle quotes
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    
    // Only count brackets that are not inside quotes
    if (!inSingleQuote && !inDoubleQuote) {
      if (char === '(' || char === '[' || char === '{') {
        openCount++;
      } else if (char === ')' || char === ']' || char === '}') {
        closeCount++;
      }
    }
  }
  
  return openCount === closeCount;
};

// Preprocessing function using the MermaidConverter with fallback

export const preprocessChart = (chart: string): string => {
  console.log("✅Original Mermaid diagram:", chart);
  try {
    // 1. Handle escaped characters (common for all diagram types)
    let processedChart = chart;
    if (chart.includes('\\[') || chart.includes('\\]') || chart.includes('\\{') || chart.includes('\\}')) {
      processedChart = handleEscapedCharacters(chart);
    }
    
    // 2. Convert to new syntax based on diagram type
    // The converter handles type detection internally and applies validation where needed
    const convertedChart = mermaidConverter.toNewSyntax(processedChart);
    
    console.log("🔄Converted Mermaid diagram:", convertedChart);
    return convertedChart;
  } catch (error) {
    console.error("❌ Mermaid 변환 실패:", error);
    return chart;
  }
};

// Removed old helper functions - now using MermaidConverter class

const Mermaid: React.FC<MermaidProps> = ({ chart, className = '', zoomingEnabled = false }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);
  const isDarkModeRef = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Initialize pan-zoom functionality when SVG is rendered
  useEffect(() => {
    if (svg && zoomingEnabled && containerRef.current) {
      const initializePanZoom = async () => {
        const svgElement = containerRef.current?.querySelector("svg");
        if (svgElement) {
          // Remove any max-width constraints
          svgElement.style.maxWidth = "none";
          svgElement.style.width = "100%";
          svgElement.style.height = "100%";

          try {
            // Dynamically import svg-pan-zoom only when needed in the browser
            const svgPanZoom = (await import("svg-pan-zoom")).default;

            svgPanZoom(svgElement, {
              zoomEnabled: true,
              controlIconsEnabled: true,
              fit: true,
              center: true,
              minZoom: 0.1,
              maxZoom: 10,
              zoomScaleSensitivity: 0.3,
            });
          } catch (error) {
            console.error("Failed to load svg-pan-zoom:", error);
          }
        }
      };

      // Wait for the SVG to be rendered
      setTimeout(() => {
        void initializePanZoom();
      }, 100);
    }
  }, [svg, zoomingEnabled]);

  useEffect(() => {
    if (!chart) return;

    let isMounted = true;

    const renderChart = async () => {
      if (!isMounted) return;

      try {
        setError(null);
        setSvg('');

        // Preprocess the chart to handle special characters that cause parsing issues
        const preprocessedChart = preprocessChart(chart);
        const { svg: renderedSvg } = await mermaid.render(idRef.current, preprocessedChart);

        if (!isMounted) return;

        let processedSvg = renderedSvg;
        if (isDarkModeRef.current) {
          processedSvg = processedSvg.replace('<svg ', '<svg data-theme="dark" ');
        }

        setSvg(processedSvg);

        // Call mermaid.contentLoaded to ensure proper initialization
        setTimeout(() => {
          mermaid.contentLoaded();
        }, 50);
      } catch (err) {
        console.error('Mermaid rendering error:', err);

        const errorMessage = err instanceof Error ? err.message : String(err);

        if (isMounted) {
          setError(`Failed to render diagram: ${errorMessage}`);

          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `
              <div class="text-red-500 dark:text-red-400 text-xs mb-1">Syntax error in diagram</div>
              <pre class="text-xs overflow-auto p-2 bg-gray-100 dark:bg-gray-800 rounded">${chart}</pre>
            `;
          }
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleDiagramClick = () => {
    if (!error && svg) {
      setIsFullscreen(true);
    }
  };

  if (error) {
    return (
      <div className={`border border-[var(--highlight)]/30 rounded-md p-4 bg-[var(--highlight)]/5 ${className}`}>
        <div className="flex items-center mb-3">
          <div className="text-[var(--highlight)] text-xs font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            図表レンダリングエラー
          </div>
        </div>
        <div ref={mermaidRef} className="text-xs overflow-auto"></div>
        <div className="mt-3 text-xs text-[var(--muted)] font-serif">
          図表に構文エラーがあり、レンダリングできません。
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`flex justify-center items-center p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[var(--accent-primary)]/70 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[var(--accent-primary)]/70 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-[var(--accent-primary)]/70 rounded-full animate-pulse delay-150"></div>
          <span className="text-[var(--muted)] text-xs ml-2 font-serif">図表を描画中...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`w-full max-w-full ${zoomingEnabled ? "h-[600px] p-4" : ""}`}
      >
        <div
          className={`relative group ${zoomingEnabled ? "h-full rounded-lg border-2 border-black" : ""}`}
        >
          <div
            className={`flex justify-center overflow-auto text-center my-2 cursor-pointer hover:shadow-md transition-shadow duration-200 rounded-md ${className} ${zoomingEnabled ? "h-full" : ""}`}
            dangerouslySetInnerHTML={{ __html: svg }}
            onClick={zoomingEnabled ? undefined : handleDiagramClick}
            title={zoomingEnabled ? undefined : "Click to view fullscreen"}
          />

          {!zoomingEnabled && (
            <div className="absolute top-2 right-2 bg-gray-700/70 dark:bg-gray-900/70 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 text-xs shadow-md pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              <span>Click to zoom</span>
            </div>
          )}
        </div>
      </div>

      {!zoomingEnabled && (
        <FullScreenModal
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
        >
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </FullScreenModal>
      )}
    </>
  );
};



export default Mermaid;