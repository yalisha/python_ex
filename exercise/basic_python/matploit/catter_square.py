import matplotlib.pyplot as plt

x_values = [1,2,3,4,5]
y_values = [1,4,6,16,25]

plt.style.use('classic')
fig, ax = plt.subplots()
ax.scatter(x_values,y_values,s=100)

ax.set_title("suqare number", fontsize = 24)
ax.set_xlabel("value",fontsize = 24)
ax.set_ylabel("square",fontsize = 24)

ax.tick_params(axis = "both", which = 'major',labelsize = 14)

plt.show()