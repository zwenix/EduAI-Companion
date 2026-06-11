# CAPS Lesson Plan Generation System - User Guide

## Overview

This system generates **comprehensive, CAPS-compliant lesson plans** for South African FET Phase (Grades 10-12) teachers. It addresses the issue of generating worksheets instead of proper lesson plans.

## Key Features

✅ **CAPS-Aligned**: Based on Annual Teaching Plans (ATPs) and WCED guidelines
✅ **Comprehensive**: Includes all required sections for effective teaching
✅ **Subject-Specific**: Tailored requirements for different subjects
✅ **Differentiated**: Strategies for diverse learners
✅ **Practical**: Classroom-ready with time allocations
✅ **Assessment-Integrated**: Formative and summative strategies

## How to Use

### Basic Usage

```typescript
import LessonPlanService from './services/lessonPlanService';

const lessonPlan = await LessonPlanService.generateLessonPlan({
  subject: 'Mathematics',
  grade: '10',
  term: 1,
  week: 3,
  topic: 'Algebraic Expressions',
  duration: '2 hours',
  classSize: 35,
  specificRequirements: 'Include technology integration'
});
```

### Using Example Templates

```typescript
// Get a pre-generated example
const template = LessonPlanService.getExampleTemplate('Agricultural Management Practices');
```

## Lesson Plan Structure

Every generated lesson plan includes:

1. **Header Information**
   - Subject, Grade, Term, Week, Topic
   - Duration and date

2. **Learning Objectives**
   - 3-5 specific, measurable outcomes
   - Bloom's taxonomy verbs

3. **Prior Knowledge/Introduction**
   - What learners should already know
   - Activation strategies
   - Links to previous learning

4. **Resources Needed**
   - Teacher resources (textbooks, visual aids, tech)
   - Learner materials (books, stationery)

5. **Concepts and Skills (Content)**
   - Key concepts with definitions
   - Detailed teaching content
   - South African examples
   - Skills development

6. **Lesson Procedure**
   - Phase 1: Introduction (10-15 min)
   - Phase 2: Teaching/Input (20-30 min)
   - Phase 3: Guided Practice (15-20 min)
   - Phase 4: Independent Practice (10-15 min)
   - Phase 5: Closure (5-10 min)

7. **Assessment Strategies**
   - Formative (during lesson)
   - Summative (end of lesson)
   - Marking guidelines

8. **Differentiation**
   - Struggling learners
   - Advanced learners
   - Learners with barriers

9. **Cross-Curricular Links**
   - Connections to other subjects

10. **Values/Life Skills**
    - Social-emotional learning
    - Citizenship education

11. **Homework/Extension**
    - Aligned tasks
    - Research projects

12. **Teacher Reflection Space**
    - What worked well
    - Areas for improvement

## Difference: Lesson Plan vs Worksheet

### Lesson Plan (What this generates):
- **For**: Teachers
- **Purpose**: Teaching guide
- **Includes**: Objectives, procedures, assessment, resources
- **Format**: Comprehensive document with instructional strategies

### Worksheet (Different tool):
- **For**: Students
- **Purpose**: Practice activities
- **Includes**: Questions, exercises, tasks
- **Format**: Student-facing activity sheet

## CAPS Compliance

All lesson plans comply with:
- ✓ CAPS curriculum requirements
- ✓ Annual Teaching Plans (ATPs)
- ✓ WCED ePortal standards
- ✓ Time allocations per subject
- ✓ Assessment policies
- ✓ Inclusive education principles

## Subject-Specific Features

### Mathematics
- Mental math activities
- Worked examples
- Problem-solving strategies
- Calculator policy

### Sciences
- Practical investigations
- Safety requirements
- Scientific method
- Data analysis

### Languages
- Four skills integration
- Text analysis
- Vocabulary development
- Grammar in context

### Agricultural Management Practices
- Production factors
- Farm planning
- Sustainability concepts
- South African context

## Quality Assurance

Each lesson plan is validated for:
- Clear, measurable objectives
- Logical content sequencing
- Appropriate time management
- Variety of teaching methods
- Assessment integration
- Inclusive practices
- South African context

## Troubleshooting

**Issue**: Getting worksheets instead of lesson plans
**Solution**: Use the LessonPlanService which has built-in prompts that explicitly distinguish between the two

**Issue**: Lesson plans too generic
**Solution**: Add specificRequirements parameter with your context

**Issue**: Missing CAPS alignment
**Solution**: All generated plans include CAPS alignment checklist

## Best Practices

1. **Be Specific**: Provide detailed topic information
2. **Include Context**: Class size, resources available
3. **Review & Adapt**: Customize for your specific learners
4. **Use Reflection**: Complete reflection space after teaching
5. **Share**: Collaborate with colleagues

## Examples

See `src/lib/example-lesson-plans.ts` for complete, ready-to-use examples.

## Support

For CAPS curriculum questions, contact:
- Your district Subject Advisor
- WCED ePortal: https://wcedeportal.co.za/
- Subject Senior Curriculum Planner

## References

1. WCED ePortal Lessons: https://wcedeportal.co.za/lessons/
2. CAPS Documents: https://www.education.gov.za/Curriculum/CurriculumAssessmentPolicyStatements(CAPS).aspx
3. Annual Teaching Plans (ATPs)
4. South African curriculum standards

---

**Remember**: A great lesson plan is a roadmap, not a script. Adapt it to your teaching style and learners' needs!
