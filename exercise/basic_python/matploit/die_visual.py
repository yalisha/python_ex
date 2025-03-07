from die import Die
from plotly.graph_objs import Bar,Layout
from plotly import offline

die = Die()
die_2 = Die(10)

results = []
for roll_num in range(50000):
    result = die.roll() + die_2.roll()
    results.append(result)

frequencies = []
for value in range(1,die.num_sides+1):
    frequency = results.count(value)
    frequencies.append(frequency)
print(frequencies)

x_value = list(range(1,max_result+1))
data = [Bar(x=x_value,y=frequencies)]

x_axis_config = {'title':'result'}
y_axis_config = {'title':'freguency'}

my_layout = Layout(title= 'result of D6 & D10'
                   , xaxis=x_axis_config,yaxis=y_axis_config)
offline.plot({'data':data,'layout':my_layout},filename = 'd6_d10.html')


