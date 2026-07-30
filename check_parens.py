import re

with open('src/components/StudentNotes.tsx', 'r') as f:
    text = f.read()

def check(text):
    stack = []
    lines = text.split('\n')
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char in "({[":
                stack.append((char, i+1, j+1))
            elif char in ")}]":
                if not stack:
                    print(f"Extra closing {char} at line {i+1} col {j+1}")
                    return
                last, li, lj = stack.pop()
                expected = {'(': ')', '{': '}', '[': ']'}[last]
                if char != expected:
                    print(f"Mismatch at line {i+1} col {j+1}: expected {expected} but got {char}. Opened at {li}:{lj}")
                    return
    if stack:
        print("Unclosed brackets:")
        for char, li, lj in stack:
            print(f"  {char} at line {li} col {j+1}")

check(text)
