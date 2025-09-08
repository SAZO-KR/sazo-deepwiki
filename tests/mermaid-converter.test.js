/**
 * Mermaid Converter Test Suite
 * Tests for Mermaid v11.3.0 @{} syntax conversion with special character handling
 */

// Import the converter logic from the actual service code
import { 
  mermaidConverter, 
  handleEscapedCharacters,
  checkLabelBracketBalance,
  preprocessChart 
} from '../src/components/Mermaid';

describe('MermaidConverter', () => {
  describe('Basic Shape Conversions', () => {
    test('should convert rectangle nodes correctly', () => {
      const input = 'A[Label Text]';
      const expected = 'A@{ shape: rect, label: "Label Text" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should convert rounded rectangle nodes', () => {
      const input = 'A(Label Text)';
      const expected = 'A@{ shape: rounded, label: "Label Text" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should convert circle nodes', () => {
      const input = 'A((Label Text))';
      const expected = 'A@{ shape: circle, label: "Label Text" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should convert subroutine nodes', () => {
      const input = 'A[[Label Text]]';
      const expected = 'A@{ shape: subroutine, label: "Label Text" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should convert hexagon nodes', () => {
      const input = 'A{{Label Text}}';
      const expected = 'A@{ shape: hex, label: "Label Text" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should convert parallelogram-right nodes', () => {
      const input = 'A[/Label Text/]';
      const expected = 'A@{ shape: lean-r, label: "Label Text" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should convert parallelogram-left nodes', () => {
      const input = 'A[\\Label Text\\]';
      const expected = 'A@{ shape: lean-l, label: "Label Text" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });
  });

  describe('Special Character Handling', () => {
    test('should handle quotes in labels', () => {
      const input = 'A["Hello World"]';
      const expected = 'A@{ shape: rect, label: "\\"Hello World\\"" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should handle nested brackets in labels', () => {
      const input = 'A[Array[0]]';
      const expected = 'A@{ shape: rect, label: "Array[0]" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should handle Docker commands with brackets', () => {
      const input = 'H[CMD ["yarn", "start"]]';
      const expected = 'H@{ shape: rect, label: "CMD [\\"yarn\\", \\"start\\"]" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });
    
    test('should handle function calls in labels - generateMetadata()', () => {
      const input = 'MetadataGen[generateMetadata()]';
      const expected = 'MetadataGen@{ shape: rect, label: "generateMetadata()" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should handle multiple function calls in labels', () => {
      const input = 'A[init() -> process() -> finish()]';
      const expected = 'A@{ shape: rect, label: "init() -> process() -> finish()" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });
    
    test('should handle function calls with parameters in labels', () => {
      const input = 'B[getData(id, options)]';
      const expected = 'B@{ shape: rect, label: "getData(id, options)" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });
  });

  describe('Edge Cases', () => {
    test('should handle nodes on arrow lines', () => {
      const input = 'A[Start] --> B[End]';
      const expected = 'A@{ shape: rect, label: "Start" } --> B@{ shape: rect, label: "End" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should handle edge labels with pipes', () => {
      const input = 'A --> |Label| B';
      const expected = 'A --> |"Label"| B';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should not double-quote already quoted edge labels', () => {
      const input = 'A -->|"Already Quoted"| B';
      const expected = 'A -->|"Already Quoted"| B';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should handle mixed quoted and unquoted edge labels', () => {
      const input = 'A -->|Simple| B -->|"Complex Label"| C';
      const expected = 'A -->|"Simple"| B -->|"Complex Label"| C';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should preserve graph declarations', () => {
      const input = 'graph TD\n  A[Node]';
      const expected = 'graph TD\n  A@{ shape: rect, label: "Node" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });
  });

  describe('Complex Conversions', () => {
    test('should handle multiple nodes in one line', () => {
      const input = 'A[First] --> B(Second) --> C((Third))';
      const expected = 'A@{ shape: rect, label: "First" } --> B@{ shape: rounded, label: "Second" } --> C@{ shape: circle, label: "Third" }';
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should handle multiline diagrams', () => {
      const input = `graph TD
  A[Start] --> B{Decision}
  B --> C[Option 1]
  B --> D[Option 2]`;
      const expected = `graph TD
  A@{ shape: rect, label: "Start" } --> B@{ shape: diam, label: "Decision" }
  B --> C@{ shape: rect, label: "Option 1" }
  B --> D@{ shape: rect, label: "Option 2" }`;
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });
  });

  describe('Escaped Character Handling', () => {
    test('should handle escaped square brackets', () => {
      const input = 'A[\\[text\\]]';
      const processedInput = handleEscapedCharacters(input);
      expect(processedInput).toBe('A["[text]"]');
    });

    test('should handle escaped curly braces', () => {
      const input = 'A\\{text\\}';
      const processedInput = handleEscapedCharacters(input);
      expect(processedInput).toBe('A["{text}"]');
    });
  });

  describe('Bracket Balance Checking', () => {
    test('should correctly identify balanced brackets', () => {
      expect(checkLabelBracketBalance('Simple text')).toBe(true);
      expect(checkLabelBracketBalance('(balanced)')).toBe(true);
      expect(checkLabelBracketBalance('[balanced]')).toBe(true);
      expect(checkLabelBracketBalance('{balanced}')).toBe(true);
    });

    test('should correctly identify unbalanced brackets', () => {
      expect(checkLabelBracketBalance('(unbalanced')).toBe(false);
      expect(checkLabelBracketBalance('unbalanced]')).toBe(false);
      expect(checkLabelBracketBalance('{unbalanced')).toBe(false);
    });

    test('should ignore brackets inside quotes', () => {
      expect(checkLabelBracketBalance('"[inside quotes]"')).toBe(true);
      expect(checkLabelBracketBalance("'[inside quotes]'")).toBe(true);
      expect(checkLabelBracketBalance('CMD ["yarn", "start"]')).toBe(true);
    });

    test('should handle escaped brackets', () => {
      expect(checkLabelBracketBalance('\\[escaped\\]')).toBe(true);
      expect(checkLabelBracketBalance('\\{escaped\\}')).toBe(true);
    });

    test('should handle mixed quotes correctly', () => {
      expect(checkLabelBracketBalance('"He said \'hello\'"')).toBe(true);
      expect(checkLabelBracketBalance("'She said \"goodbye\"'")).toBe(true);
    });
  });

  describe('Preprocessing Integration', () => {
    test('should preprocess Docker command correctly', () => {
      const input = `graph TD
    A[FROM node:18-alpine] --> B(WORKDIR /app)
    B --> C(COPY package.json yarn.lock ./)
    C --> D(RUN yarn install --frozen-lockfile)
    D --> E(COPY . .)
    E --> F(RUN yarn build)
    F --> G(EXPOSE 80)
    G --> H[CMD ["yarn", "start"]]`;
      
      // Should not throw error and should process correctly
      expect(() => preprocessChart(input)).not.toThrow();
      
      const result = preprocessChart(input);
      expect(result).toContain('@{ shape:');
      // The Docker command should be handled properly
      expect(result).toContain('CMD');
    });
    
    test('should handle generateMetadata() function call in full diagram', () => {
      const input = `graph TD
    User[사용자] --> Browser[웹 브라우저]
    Browser --> FE_Layout@{ shape: rect, label: "RootLayout (app/[locale]/layout.tsx)" }
    FE_Layout --> FE_Page[페이지 컴포넌트 (e.g., introduction/page.tsx)]
    FE_Layout --> Providers[Context/Query/Jotai Providers]
    FE_Layout --> MetadataGen[generateMetadata()]
    MetadataGen --> SEO[SEO 최적화]
    FE_Layout --> WebViewEvent[WebViewEventProvider]
    FE_Layout --> AuthContext[AuthContextProvider]
    Providers --> Children[렌더링될 페이지 콘텐츠]
    FE_Page --> Children`;
      
      const result = preprocessChart(input);
      
      // Should convert MetadataGen[generateMetadata()] correctly
      expect(result).toContain('MetadataGen@{ shape: rect, label: "generateMetadata()" }');
      
      // Should NOT convert generateMetadata() as a separate rounded node
      expect(result).not.toContain('generateMetadata@{ shape: rounded');
      
      // Other nodes should be converted correctly
      expect(result).toContain('User@{ shape: rect, label: "사용자" }');
      expect(result).toContain('SEO@{ shape: rect, label: "SEO 최적화" }');
    });

    test('should handle various bracket combinations', () => {
      const testCases = [
        'A[Simple]',
        'B[Array[0]]',
        'C[Object.method()]',
        'D[CMD ["npm", "start"]]',
        'E[Function(param1, param2)]',
        'F[Mix [nested] and (parentheses)]'
      ];

      testCases.forEach(testCase => {
        expect(() => preprocessChart(testCase)).not.toThrow();
      });
    });
    
    test('should not convert already converted nodes with @{ shape: } syntax', () => {
      const input = `flowchart TD
    A@{ shape: rect, label: "BarcodeGenerator Props (value, format 등)" }
    B@{ shape: rect, label: "useRef로 canvas 엘리먼트 참조" }
    C@{ shape: rect, label: "useEffect 훅 실행" }
    D@{ shape: rect, label: "JsBarcode(canvasRef.current).init() 호출" }
    E@{ shape: rect, label: "canvas 엘리먼트에 바코드 렌더링" }

    A -->|"값 및 설정 전달"| C
    B -->|"canvas 참조"| C
    C -->|"초기화/업데이트"| D
    D -->|"바코드 생성"| E`;
      
      const result = preprocessChart(input);
      
      // Should NOT convert JsBarcode(canvasRef.current) to a node
      expect(result).not.toContain('JsBarcode@{ shape:');
      
      // Should keep the original label intact
      expect(result).toContain('D@{ shape: rect, label: "JsBarcode(canvasRef.current).init() 호출" }');
      
      // All original nodes should remain unchanged
      expect(result).toContain('A@{ shape: rect, label: "BarcodeGenerator Props (value, format 등)" }');
      expect(result).toContain('B@{ shape: rect, label: "useRef로 canvas 엘리먼트 참조" }');
      expect(result).toContain('C@{ shape: rect, label: "useEffect 훅 실행" }');
      expect(result).toContain('E@{ shape: rect, label: "canvas 엘리먼트에 바코드 렌더링" }');
    });
  });

  describe('Sequence Diagram Semicolon Escaping', () => {
    test('should leave messages without semicolons as-is', () => {
      const input = `sequenceDiagram
    Client->>Server: Send request`;
      const expected = `sequenceDiagram
    Client->>Server: Send request`;
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should escape semicolons in sequence diagram messages', () => {
      const input = `sequenceDiagram
    CommonUtil->>Client: document.cookie에 "user_id=testuser; expires=..." 설정`;
      const expected = `sequenceDiagram
    CommonUtil->>Client: document.cookie에 "user_id=testuser#59; expires=..." 설정`;
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should handle multiple semicolons', () => {
      const input = `sequenceDiagram
    Client->>Server: Line1; Line2; Line3`;
      const expected = `sequenceDiagram
    Client->>Server: Line1#59; Line2#59; Line3`;
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should handle activation markers with semicolons', () => {
      const input = `sequenceDiagram
    Client->>+Server: Start; process data
    Server-->>-Client: Done; result ready`;
      const expected = `sequenceDiagram
    Client->>+Server: Start#59; process data
    Server-->>-Client: Done#59; result ready`;
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });

    test('should not affect flowchart diagrams', () => {
      const input = `flowchart TD
    A[Node A] --> B[Node B]
    B --> |Edge Label| C[Node C]`;
      const expected = `flowchart TD
    A@{ shape: rect, label: "Node A" } --> B@{ shape: rect, label: "Node B" }
    B --> |"Edge Label"| C@{ shape: rect, label: "Node C" }`;
      expect(mermaidConverter.toNewSyntax(input)).toBe(expected);
    });
  });
});
