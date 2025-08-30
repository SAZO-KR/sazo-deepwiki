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
          <div className="font-medium text-[var(--foreground)] font-serif">図表表示</div>
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
export class MermaidConverter {
  private nodePatterns: Array<{ regex: RegExp | null; shape: string }>;

  constructor() {
    // Define patterns in order of specificity (most specific first)
    this.nodePatterns = [
      // Triple parenthesis must come before double
      { regex: /(\w+)\(\(\((.+?)\)\)\)/g, shape: 'dbl-circ' },
      // Double brackets/braces must come before single
      { regex: /(\w+)\[\[(.+?)\]\]/g, shape: 'subroutine' },
      { regex: /(\w+)\{\{(.+?)\}\}/g, shape: 'hex' },
      // Combined shapes
      { regex: /(\w+)\(\[(.+?)\]\)/g, shape: 'stadium' },
      { regex: /(\w+)\[\((.+?)\)\]/g, shape: 'cylinder' },
      { regex: /(\w+)\(\((.+?)\)\)/g, shape: 'circle' },
      // Parallelogram variations (order matters!)
      { regex: /(\w+)\[\/(.+?)\/\]/g, shape: 'lean-r' },
      { regex: /(\w+)\[\\(.+?)\\\]/g, shape: 'lean-l' },
      { regex: /(\w+)\[\/(.+?)\\\]/g, shape: 'trap-b' },
      { regex: /(\w+)\[\\(.+?)\/\]/g, shape: 'trap-t' },
      // Basic shapes - use special handling for rectangles to support nested brackets
      { regex: null, shape: 'rect' }, // Will be handled specially
      { regex: /(\w+)\((.+?)\)/g, shape: 'rounded' },
      { regex: /(\w+)>(.+?)\]/g, shape: 'odd' },
      { regex: /(\w+)\{(.+?)\}/g, shape: 'diam' }
    ];
  }

  private escapeQuotes(text: string): string {
    return text.replace(/"/g, '\\"');
  }

  // Helper function to find matching bracket considering nested brackets
  private findMatchingBracket(text: string, startPos: number): number {
    let depth = 0;
    for (let i = startPos; i < text.length; i++) {
      if (text[i] === '[') depth++;
      if (text[i] === ']') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  // Helper function to find matching parenthesis considering nested structures
  private findMatchingParenthesis(text: string, startPos: number, openChar: string, closeChar: string): number {
    let depth = 0;
    let inBraces = 0;
    let inBrackets = 0;
    
    for (let i = startPos; i < text.length; i++) {
      // Track nested structures
      if (text[i] === '{') inBraces++;
      if (text[i] === '}') inBraces--;
      if (text[i] === '[') inBrackets++;
      if (text[i] === ']') inBrackets--;
      
      // Only count our target parenthesis when not inside other structures
      if (text[i] === openChar) {
        depth++;
      } else if (text[i] === closeChar) {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
    return -1;
  }

  // Process node definitions in a line
  private processNodeDefinitions(line: string): string {
    let processedLine = line;
    
    // Process all node definitions in the line
    for (const {regex, shape} of this.nodePatterns) {
      if (shape === 'rect') {
        // Special handling for rectangles to support nested brackets
        let rectMatch;
        // Look for node IDs followed by [ but make sure it's a node definition
        // by checking for arrow operators or line start
        const rectRegex = /(^|\s|-->|->|---|--|==|==>|\.->|\.\.>)(\w+)\[/g;
        while ((rectMatch = rectRegex.exec(processedLine)) !== null) {
          const prefix = rectMatch[1];
          const nodeId = rectMatch[2];
          const startBracket = rectMatch.index! + prefix.length + nodeId.length;
          const endBracket = this.findMatchingBracket(processedLine, startBracket);
          
          if (endBracket !== -1) {
            const label = processedLine.substring(startBracket + 1, endBracket);
            const replacement = `${prefix}${nodeId}@{ shape: rect, label: "${this.escapeQuotes(label.trim())}" }`;
            processedLine = processedLine.substring(0, rectMatch.index) + 
                           replacement + 
                           processedLine.substring(endBracket + 1);
            // Reset regex after modification
            rectRegex.lastIndex = rectMatch.index + replacement.length;
          } else {
            break;
          }
        }
      } else if (shape === 'rounded' && regex) {
        // Special handling for rounded parentheses with nested content
        let roundMatch;
        const roundRegex = /(\w+)\(/g;
        while ((roundMatch = roundRegex.exec(processedLine)) !== null) {
          const nodeId = roundMatch[1];
          const startParen = roundMatch.index! + nodeId.length;
          const endParen = this.findMatchingParenthesis(processedLine, startParen, '(', ')');
          
          if (endParen !== -1) {
            const label = processedLine.substring(startParen + 1, endParen);
            const replacement = `${nodeId}@{ shape: rounded, label: "${this.escapeQuotes(label.trim())}" }`;
            const before = processedLine.substring(0, roundMatch.index);
            const after = processedLine.substring(endParen + 1);
            processedLine = before + replacement + after;
            // Reset regex after modification
            roundRegex.lastIndex = before.length + replacement.length;
          }
        }
      } else if (regex) {
        processedLine = processedLine.replace(regex, (match, nodeId, label) => {
          return `${nodeId}@{ shape: ${shape}, label: "${this.escapeQuotes(label.trim())}" }`;
        });
      }
    }
    
    return processedLine;
  }

  // Convert old syntax to new @{} syntax
  toNewSyntax(mermaidCode: string): string {
    const lines = mermaidCode.split('\n');
    const result: string[] = [];

    for (const line of lines) {
      // Skip empty lines and graph declarations
      if (line.trim() === '' || line.trim().startsWith('graph') || line.trim().startsWith('flowchart')) {
        result.push(line);
        continue;
      }

      let processedLine = line;
      
      // First, handle edge labels with pipes
      processedLine = processedLine.replace(/\|([^|]+)\|/g, (match, label) => {
        return `|"${this.escapeQuotes(label.trim())}"|`;
      });
      
      // Then process all node definitions (including those on arrow lines)
      processedLine = this.processNodeDefinitions(processedLine);
      
      result.push(processedLine);
    }

    return result.join('\n');
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
  try {
    // First handle escaped characters
    let processedChart = chart;
    if (chart.includes('\\[') || chart.includes('\\]') || chart.includes('\\{') || chart.includes('\\}')) {
      processedChart = handleEscapedCharacters(chart);
    }
    
    // Then convert to new @{} syntax for better handling of special characters
    const convertedChart = mermaidConverter.toNewSyntax(processedChart);
    
    // Validate the conversion - check for basic syntax errors
    if (convertedChart.includes('@{ shape:')) {
      // Check for unclosed quotes or brackets in labels
      // Updated regex to handle escaped quotes within labels
      const labelMatches = convertedChart.match(/label: "((?:[^"\\]|\\.)*)"/g);
      if (labelMatches) {
        for (const match of labelMatches) {
          const label = match.substring(8, match.length - 1); // Extract label content
          // Skip validation for already escaped labels (containing @{ shape:)
          if (label.includes('@{ shape:')) {
            continue;
          }
          // Use context-aware bracket balance check
          if (!checkLabelBracketBalance(label)) {
            console.warn("⚠️ Unbalanced brackets in label, using escaped version:", label);
            return processedChart;
          }
        }
      }
    }
    
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