import json
numbers= [2,3,4,7,11,13]
filename= 'numers.json'
with open(filename,'w') as f:
    json.dump(numbers,f)