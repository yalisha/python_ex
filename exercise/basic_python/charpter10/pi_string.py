filename = 'pi_didits.txt'
with open('text_files/pi_digits.txt') as file_object:
    lines = file_object.readlines()

pi_string=''
for line in lines:
    pi_string += line.strip()
print(pi_string)
print(len(pi_string))