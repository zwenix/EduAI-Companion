import re

with open('src/components/TeacherPlanner.tsx', 'r') as f:
    text = f.read()

text = text.replace(
    "interface TeacherPlannerProps {\n  isDarkMode: boolean;\n  onBack: () => void;\n}",
    "interface TeacherPlannerProps {\n  isDarkMode: boolean;\n  onBack: () => void;\n  userRole?: string | null;\n}"
)

text = text.replace(
    "export const TeacherPlanner: React.FC<TeacherPlannerProps> = ({ isDarkMode, onBack }) => {",
    "export const TeacherPlanner: React.FC<TeacherPlannerProps> = ({ isDarkMode, onBack, userRole }) => {"
)

text = text.replace(
    "Teacher's Planner & Diary",
    "{userRole === 'student' ? 'My Calendar & Planner' : \"Teacher's Planner & Diary\"}"
)
text = text.replace(
    "Teacher's Diary & Reflection Notes",
    "{userRole === 'student' ? 'My Daily Journal & Notes' : \"Teacher's Diary & Reflection Notes\"}"
)

with open('src/components/TeacherPlanner.tsx', 'w') as f:
    f.write(text)

