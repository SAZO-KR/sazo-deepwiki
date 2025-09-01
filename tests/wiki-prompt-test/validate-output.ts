#!/usr/bin/env node

/**
 * Validation script for generated wiki output
 * Checks if the generated wiki follows all the prompt requirements
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    hasSummaryBlock: boolean;
    sourceFileCount: number;
    hasMermaidDiagrams: boolean;
    usesNewSyntax: boolean;
    hasProperCitations: boolean;
    hasTitle: boolean;
  };
}

function validateWikiContent(content: string): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
    stats: {
      hasSummaryBlock: false,
      sourceFileCount: 0,
      hasMermaidDiagrams: false,
      usesNewSyntax: false,
      hasProperCitations: false,
      hasTitle: false
    }
  };

  // Check 1: Starts with <details> block
  if (!content.trim().startsWith('<details>')) {
    result.errors.push('❌ Wiki must start with <details> block');
    result.passed = false;
  } else {
    result.stats.hasSummaryBlock = true;
  }

  // Check 2: Count source files in details block
  const detailsMatch = content.match(/<details>[\s\S]*?<\/details>/);
  if (detailsMatch) {
    const sourceFiles = detailsMatch[0].match(/- \[.*?\]\(.*?\)/g) || [];
    result.stats.sourceFileCount = sourceFiles.length;
    
    if (sourceFiles.length < 5) {
      result.errors.push(`❌ Must cite at least 5 source files (found ${sourceFiles.length})`);
      result.passed = false;
    }
  }

  // Check 3: Has H1 title after details block
  const afterDetails = content.split('</details>')[1];
  if (afterDetails && afterDetails.trim().match(/^# .+/m)) {
    result.stats.hasTitle = true;
  } else {
    result.errors.push('❌ Missing H1 title after details block');
    result.passed = false;
  }

  // Check 4: Contains Mermaid diagrams
  const mermaidBlocks = content.match(/```mermaid[\s\S]*?```/g) || [];
  result.stats.hasMermaidDiagrams = mermaidBlocks.length > 0;
  
  if (!result.stats.hasMermaidDiagrams) {
    result.warnings.push('⚠️ No Mermaid diagrams found');
  }

  // Check 5: Uses new @{} syntax in Mermaid
  if (mermaidBlocks.length > 0) {
    const hasNewSyntax = mermaidBlocks.some(block => block.includes('@{'));
    result.stats.usesNewSyntax = hasNewSyntax;
    
    // Check for old syntax
    const hasOldSyntax = mermaidBlocks.some(block => {
      // Look for old patterns like A[Label] or A(Label)
      return /\w+\[(?!@\{).*?\]/.test(block) || /\w+\((?!@\{).*?\)/.test(block);
    });
    
    if (!hasNewSyntax) {
      result.errors.push('❌ Mermaid diagrams must use @{} syntax');
      result.passed = false;
    }
    
    if (hasOldSyntax) {
      result.warnings.push('⚠️ Old bracket syntax detected in Mermaid diagrams');
    }
  }

  // Check 6: Has proper source citations with line numbers
  // Look for both formats: 
  // 1. Source: [file:L10](url#L10) 
  // 2. Direct citations like [src/file.ts:L10-L20](url#L10-L20)
  const sourcePattern = /Source[s]?:\s*\[.*?:L?\d+.*?\]\(.*?\)/g;
  const directPattern = /\[[\w\/\.\-]+:L\d+(-L\d+)?\]\([^)]+#L\d+(-\d+)?\)/g;
  
  const sourceCitations = content.match(sourcePattern) || [];
  const directCitations = content.match(directPattern) || [];
  const citations = [...sourceCitations, ...directCitations];
  
  result.stats.hasProperCitations = citations.length > 0;
  
  if (!result.stats.hasProperCitations) {
    result.errors.push('❌ Missing proper source citations with line numbers');
    result.passed = false;
  }

  // Check 7: No graph LR (should be graph TD)
  if (/graph\s+LR|flowchart\s+LR/.test(content)) {
    result.errors.push('❌ Found horizontal diagram (graph/flowchart LR) - must use TD');
    result.passed = false;
  }

  return result;
}

function printResults(result: ValidationResult) {
  console.log('\n📊 Wiki Validation Results');
  console.log('==========================\n');

  // Print stats
  console.log('📈 Statistics:');
  console.log(`  • Summary block: ${result.stats.hasSummaryBlock ? '✅' : '❌'}`);
  console.log(`  • Source files cited: ${result.stats.sourceFileCount}`);
  console.log(`  • Has Mermaid diagrams: ${result.stats.hasMermaidDiagrams ? '✅' : '❌'}`);
  console.log(`  • Uses @{} syntax: ${result.stats.usesNewSyntax ? '✅' : '❌'}`);
  console.log(`  • Has proper citations: ${result.stats.hasProperCitations ? '✅' : '❌'}`);
  console.log(`  • Has H1 title: ${result.stats.hasTitle ? '✅' : '❌'}`);

  // Print errors
  if (result.errors.length > 0) {
    console.log('\n🚨 Errors:');
    result.errors.forEach(error => console.log(`  ${error}`));
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  ${warning}`));
  }

  // Final verdict
  console.log('\n📋 Final Result:');
  if (result.passed) {
    console.log('  ✅ PASSED - Wiki follows all requirements!');
  } else {
    console.log('  ❌ FAILED - Wiki has validation errors');
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const filename = args[0] || 'output/generated-wiki.md';
  const filepath = path.join(__dirname, filename);

  if (!fs.existsSync(filepath)) {
    console.error(`❌ File not found: ${filepath}`);
    console.log('Usage: npm run validate [filename]');
    console.log('Default: output/generated-wiki.md');
    process.exit(1);
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  console.log(`🔍 Validating: ${filename}`);
  
  const result = validateWikiContent(content);
  printResults(result);
  
  // Exit with error code if validation failed
  process.exit(result.passed ? 0 : 1);
}

main();
