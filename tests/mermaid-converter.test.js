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

  describe('Sequence Diagram Activation Normalization', () => {
    test('should leave valid activate/deactivate pairs unchanged', () => {
      const input = `sequenceDiagram
    Client->>+Server: Start process
    Server-->>-Client: Process complete`;
      const expected = `sequenceDiagram
    Client->>+Server: Start process#59; process complete
    Server-->>-Client: Process complete`;
      // Note: semicolons are still escaped as part of existing functionality
      const result = mermaidConverter.toNewSyntax(input);
      expect(result).toContain('Client->>+Server: Start process');
      expect(result).toContain('Server-->>-Client: Process complete');
    });

    test('should remove deactivation when no prior activation exists', () => {
      const input = `sequenceDiagram
    Client->>Server: Send request
    Server-->>-Client: Response without activation`;
      const result = mermaidConverter.toNewSyntax(input);
      expect(result).toContain('Server-->>Client: Response without activation');
      expect(result).not.toContain('Server-->>-Client:');
    });

    test('should remove activation when no matching deactivation exists', () => {
      const input = `sequenceDiagram
    Client->>+Server: Start process
    Server->>Client: Response without deactivation`;
      const result = mermaidConverter.toNewSyntax(input);
      expect(result).toContain('Client->>Server: Start process');
      expect(result).not.toContain('Client->>+Server:');
    });

    test('should handle complex scenario from user example', () => {
      const input = `sequenceDiagram
  participant Component as 컴포넌트
  participant UseQueryHook as useReadManyBanner 훅
  participant ReactQueryCache as React Query 캐시
  participant ApiClient as Api 클라이언트
  participant ApiServer as API 서버

  Component->>+UseQueryHook: 데이터 조회 요청
  UseQueryHook->>ReactQueryCache: 쿼리 키 ("banner")로 캐시 확인
  alt 캐시에 데이터 존재
    ReactQueryCache-->>-UseQueryHook: 캐시된 데이터 반환
  else 캐시에 데이터 없음 또는 만료
    UseQueryHook->>ApiClient: api.readManyBanner() 호출
    ApiClient->>+ApiServer: GET /api/v1/admin/banner 요청
    ApiServer-->>-ApiClient: 배너 목록 응답
    ApiClient-->>UseQueryHook: 응답 데이터 반환
    UseQueryHook->>ReactQueryCache: 데이터 캐싱
    ReactQueryCache-->>-UseQueryHook: 캐시된 데이터 반환
  end
  UseQueryHook-->>-Component: 조회된 데이터 반환`;

      const result = mermaidConverter.toNewSyntax(input);
      
      // Valid pairs should remain
      expect(result).toContain('Component->>+UseQueryHook:');
      expect(result).toContain('ApiClient->>+ApiServer:');
      expect(result).toContain('ApiServer-->>-ApiClient:');
      expect(result).toContain('UseQueryHook-->>-Component:');
      
      // Invalid deactivations should be removed (ReactQueryCache was never activated)
      expect(result).toContain('ReactQueryCache-->>UseQueryHook:'); // - removed
      expect(result).not.toContain('ReactQueryCache-->>-UseQueryHook:');
    });

    test('should handle nested activations correctly', () => {
      const input = `sequenceDiagram
    A->>+B: Start B
    B->>+C: Start C
    C-->>-B: C done
    B-->>-A: B done`;
      const result = mermaidConverter.toNewSyntax(input);
      
      // All activations/deactivations should remain as they are properly paired
      expect(result).toContain('A->>+B:');
      expect(result).toContain('B->>+C:');
      expect(result).toContain('C-->>-B:');
      expect(result).toContain('B-->>-A:');
    });

    test('should handle multiple participants with mixed valid/invalid activations', () => {
      const input = `sequenceDiagram
    A->>+B: Start B
    A->>+C: Start C  
    B-->>-A: B responds
    C-->>A: C responds without deactivation
    D-->>-A: D deactivates A without activation`;
      
      const result = mermaidConverter.toNewSyntax(input);
      
      // Valid B activation/deactivation should remain
      expect(result).toContain('A->>+B:');
      expect(result).toContain('B-->>-A:');
      
      // Invalid C activation should be removed (no deactivation)
      expect(result).toContain('A->>C:');
      expect(result).not.toContain('A->>+C:');
      
      // Invalid D deactivation should be removed (no activation)
      expect(result).toContain('D-->>A:');
      expect(result).not.toContain('D-->>-A:');
    });

    test('should handle double deactivation', () => {
      const input = `sequenceDiagram
    A->>+B: Start B
    B-->>-A: First deactivation
    B-->>-A: Second deactivation (invalid)`;
      
      const result = mermaidConverter.toNewSyntax(input);
      
      expect(result).toContain('A->>+B:');
      expect(result).toContain('B-->>-A: First deactivation');
      expect(result).toContain('B-->>A: Second deactivation (invalid)');
      expect(result).not.toMatch(/B-->>-A:.*Second deactivation/);
    });

    test('should preserve other sequence diagram elements', () => {
      const input = `sequenceDiagram
    participant A as Alice
    participant B as Bob
    
    Note over A,B: This is a note
    A->>+B: Hello
    Note right of B: Bob thinks
    B-->>-A: Hi there
    
    alt condition
      A->>B: Option 1
    else
      A->>B: Option 2
    end`;
      
      const result = mermaidConverter.toNewSyntax(input);
      
      // Should preserve notes, alt blocks, participant declarations
      expect(result).toContain('participant A as Alice');
      expect(result).toContain('participant B as Bob');
      expect(result).toContain('Note over A,B:');
      expect(result).toContain('Note right of B:');
      expect(result).toContain('alt condition');
      expect(result).toContain('else');
      expect(result).toContain('end');
      
      // Should handle valid activation/deactivation
      expect(result).toContain('A->>+B:');
      expect(result).toContain('B-->>-A:');
    });
  });
});
