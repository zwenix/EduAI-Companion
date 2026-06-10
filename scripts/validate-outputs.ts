#!/usr/bin/env node
/**
 * EduAI Companion - Output Validation Script
 * Run: npm run validate
 */

import * as fs from 'fs';
import * as path from 'path';
import PromptQualityValidator from '../src/lib/prompt-validator';

interface TestContext {
  contentType: string;
  grade: string;
  subject: string;
  topic: string;
  outputFile: string;
}

/**
 * Validate all generated outputs in the outputs directory
 */
function validateAllOutputs() {
  const outputsDir = path.join(__dirname, '../outputs');
  const testContexts: TestContext[] = [
    {
      contentType: 'worksheet',
      grade: '2',
      subject: 'Mathematics',
      topic: 'Addition with Springboks',
      outputFile: 'grade2-maths-addition.html'
    },
    {
      contentType: 'poster',
      grade: '5',
      subject: 'Natural Sciences',
      topic: 'The Water Cycle',
      outputFile: 'grade5-science-watercycle.html'
    },
    {
      contentType: 'study-guide',
      grade: '8',
      subject: 'History',
      topic: 'Democracy & Citizenship',
      outputFile: 'grade8-history-democracy.html'
    },
    {
      contentType: 'test',
      grade: '11',
      subject: 'Physical Sciences',
      topic: 'Newton\'s Laws',
      outputFile: 'grade11-physics-newton.html'
    }
  ];
  
  console.log('🔍 EduAI Output Validation');
  console.log('='.repeat(60));
  console.log('');
  
  let totalScore = 0;
  let passedTests = 0;
  
  testContexts.forEach((context, index) => {
    const filePath = path.join(outputsDir, context.outputFile);
    
    console.log(`📄 Test ${index + 1}: ${context.outputFile}`);
    console.log('-'.repeat(60));
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found');
      console.log('');
      return;
    }
    
    const html = fs.readFileSync(filePath, 'utf-8');
    const validation = PromptQualityValidator.validateOutput(html, context);
    const report = PromptQualityValidator.generateReport(validation, context);
    
    console.log(report);
    console.log('');
    
    totalScore += validation.score;
    if (validation.isValid) passedTests++;
  });
  
  // Summary
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testContexts.length}`);
  console.log(`Passed: ${passedTests}/${testContexts.length}`);
  console.log(`Average Score: ${(totalScore / testContexts.length).toFixed(1)}/100`);
  console.log('');
  
  if (passedTests === testContexts.length) {
    console.log('🎉 All tests passed! Your outputs are production-ready.');
  } else {
    console.log('⚠️  Some tests need attention. Review the issues above.');
  }
}

// Run validation
validateAllOutputs();