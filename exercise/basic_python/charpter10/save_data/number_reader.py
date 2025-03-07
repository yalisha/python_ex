import json
filename= 'numers.json'
with open(filename) as f:
    numbers=json.load(f)
print(numbers)