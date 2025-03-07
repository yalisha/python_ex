import json
filename = 'username.json'
try:
    with open(filename) as f:
        usename= json.load(f)
except FileNotFoundError:
    usename = input("what's your name?")
    with open(filename,'w') as f:
        json.dump(usename,f)
        print(f"We'll remeber you when you coma back,{usename}")
else:
    print(f"Welcome back,{usename}!")