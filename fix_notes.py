import re

with open('src/components/StudentNotes.tsx', 'r') as f:
    text = f.read()

# Fix 1: generateEducationalContent args
text = text.replace(
    "await generateEducationalContent(prompt, 'gemini', 'gemini-3.6-flash')",
    "await generateEducationalContent(format, prompt)"
)

# Fix 2: html2pdf options
# { margin: 10, filename: ..., image: { type: 'jpeg', quality: 0.98 } ... }
# change to 'jpeg'
text = text.replace(
    "image:        { type: 'jpeg', quality: 0.98 },",
    "image:        { type: 'jpeg' as const, quality: 0.98 },"
)

# Fix 3: topics array type
# actually the problem was not topics.map, the error is:
# src/components/StudentNotes.tsx(207,29): error TS2349: This expression is not callable.
# topics is a useMemo that returns string[]
# But wait, subjects is educationalData[...] || []
# Let's see educationalData type
text = text.replace(
    "const subjects = useMemo(() => {",
    "const subjects: string[] = useMemo(() => {"
)
text = text.replace(
    "const topics = useMemo(() => {",
    "const topics: string[] = useMemo(() => {"
)
# wait, educationalData is typed as { [key: string]: string[] } in educational-data.ts, so maybe we need `as string[]`
text = text.replace(
    "return educationalData[grade as keyof typeof educationalData] || [];",
    "return (educationalData[grade as keyof typeof educationalData] as string[]) || [];"
)

# Fix 4: ReaderModeModal props
text = text.replace(
    "<ReaderModeModal htmlContent={result} isDarkMode={isDarkMode} onClose={() => setIsReaderOpen(false)} />",
    "<ReaderModeModal isOpen={isReaderOpen} content={result} title={topic || 'Study Notes'} isDarkMode={isDarkMode} onClose={() => setIsReaderOpen(false)} />"
)

# Fix 5: PrintPreviewModal props
old_print_modal = """<PrintPreviewModal 
            htmlContent={result} 
            isDarkMode={isDarkMode} 
            onClose={() => setShowPrintModal(false)}
            subject={subject}
            grade={grade}
            topic={topic}
          />"""
new_print_modal = """<PrintPreviewModal 
            isOpen={showPrintModal}
            content={result} 
            title={topic || 'Study Notes'}
            isDarkMode={isDarkMode} 
            onClose={() => setShowPrintModal(false)}
            options={{ includeMemo: false, includeRubric: false }}
          />"""
text = text.replace(old_print_modal, new_print_modal)

with open('src/components/StudentNotes.tsx', 'w') as f:
    f.write(text)

