import csv
from datetime import datetime
import matplotlib.pyplot as plt
filename = 'data/death_valley_2021_simple.csv'
with open(filename) as f:
    reader = csv.reader(f)
    header_row = next(reader)

    for index, column_header in enumerate(header_row):
        print(index,column_header)
    dates, highs, lows =[],[],[]
    for row in reader:
        current_date = datetime.strptime(row[2],'%Y-%m-%d')
        try :
          high = int(row[3])
          low = int(row[4])
        except ValueError:
          print(f"Missing date for {current_date}")
        else:
          dates.append(current_date)
          highs.append(high)
          lows.append(low)

plt.style.use('classic')
fig , ax = plt.subplots()
ax.plot(dates, highs , c='red', alpha= 0.5)
ax.plot(dates,lows,c='blue',alpha = 0.5)
ax.fill_between(dates,highs,lows,facecolor='blue',alpha =0.1)

ax.set_title("2021 june Tmax", fontsize = 24)
ax.set_xlabel('',fontsize = 16)
ax.set_ylabel("temperature(F)",fontsize = 16)
fig.autofmt_xdate()
ax.tick_params(axis = 'both', which = 'major', labelsize = 16)

plt.show()