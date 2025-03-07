import matplotlib.pyplot as plt

x_values = range(1,1001)
y_values = [x**2 for x in x_values]

plt.style.use('classic')
fig, ax = plt.subplots()
ax.scatter(x_values,y_values,c=y_values, cmap=plt.cm.Blues, s=10 )

ax.set_title("suqare number", fontsize = 24)
ax.set_xlabel("value",fontsize = 24)
ax.set_ylabel("square",fontsize = 24)

ax.tick_params(axis = "both", which = 'major',labelsize = 14)
ax.axis([0,1100,0,1100000])

plt.savefig('square_plot.png',bbox_inches = 'tight')