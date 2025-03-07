class car:
    def __init__(self, make, model, year):
        self.make=make
        self.model=model
        self.year=year
        self.odometer_reading=0
    def get_descripting_name(self):
        long_name=f"{self.year}{self.make}{self.model}"
        return long_name.title()
    def read_odometer(self):
        print(f"This car has{self.odometer_reading} miles on it")
    def update_odometer(self, mileage):
        if mileage>=self.odometer_reading:
            self.odometer_reading=mileage
        else:
            print("you cannot roll back an odometer")
    def increment_odometer(self,miles):
        self.odometer_reading += miles
class Battery:
    def __init__(self, battery_size=75):
        self.battery_size=battery_size
    def describe_berrery(self):
        print(f"This car has a {self.battery_size}-kwh battery")
class ElectricCar(car):
    def __init__(self, make, model, year):
        super().__init__(make,model,year)
        self.battery=Battery()


my_tesla= ElectricCar('tesla',"model s", 2019)
print(my_tesla.get_descripting_name())
my_tesla.battery.describe_battery()