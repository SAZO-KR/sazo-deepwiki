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
  });
});
