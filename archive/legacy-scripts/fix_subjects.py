import re

with open('src/components/StudentNotes.tsx', 'r') as f:
    text = f.read()

old_subjects = """  const subjects: string[] = useMemo(() => {
    return (educationalData[grade as keyof typeof educationalData] as unknown as string[]) || [];
  }, [grade]);"""

new_subjects = """  const subjects: string[] = useMemo(() => {
    const gradeData = educationalData[grade as keyof typeof educationalData];
    return gradeData ? Object.keys(gradeData) : [];
  }, [grade]);"""

old_topics = """  const topics: string[] = useMemo(() => {
    if (!subject || subject === 'Other') return [];
    return [
      'Term 1 Overview',
      'Term 2 Overview',
      'Term 3 Overview',
      'Term 4 Overview',
      'Core Principles',
      'Exam Preparation'
    ];
  }, [subject]);"""

new_topics = """  const topics: string[] = useMemo(() => {
    if (!subject || subject === 'Other') return [];
    const gradeData = educationalData[grade as keyof typeof educationalData];
    if (gradeData && (gradeData as any)[subject]) {
      return (gradeData as any)[subject];
    }
    return [
      'Term 1 Overview',
      'Term 2 Overview',
      'Term 3 Overview',
      'Term 4 Overview',
      'Core Principles',
      'Exam Preparation'
    ];
  }, [grade, subject]);"""

text = text.replace(old_subjects, new_subjects)
text = text.replace(old_topics, new_topics)

with open('src/components/StudentNotes.tsx', 'w') as f:
    f.write(text)

