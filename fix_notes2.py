import re

with open('src/components/StudentNotes.tsx', 'r') as f:
    text = f.read()

# Fix 1: subjects type
text = text.replace(
    "return (educationalData[grade as keyof typeof educationalData] as string[]) || [];",
    "return educationalData[grade as keyof typeof educationalData] || [];"
)

# Fix 2: jsPDF orientation
text = text.replace(
    "jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }",
    "jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }"
)

# Fix 3: ReaderModeModal props
text = text.replace(
    "<ReaderModeModal isOpen={isReaderOpen} content={result} title={topic || 'Study Notes'} isDarkMode={isDarkMode} onClose={() => setIsReaderOpen(false)} />",
    "<ReaderModeModal isOpen={isReaderOpen} content={result} title={topic || 'Study Notes'} onClose={() => setIsReaderOpen(false)} />"
)

# Fix 4: PrintPreviewModal props options
text = text.replace(
    "options={{ includeMemo: false, includeRubric: false }}",
    "options={{}}"
)

with open('src/components/StudentNotes.tsx', 'w') as f:
    f.write(text)

