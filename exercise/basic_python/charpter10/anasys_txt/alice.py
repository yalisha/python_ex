filename = 'alice.txt'

try:
    with open(filename,encoding='utf-8') as f:
        contents = f.read()
except FileNotFoundError:
    print("False")
else:
    words = contents.split()
    num_words = len(words)
    print(f"This file {filename} has about {num_words} words ")