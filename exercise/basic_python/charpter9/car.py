"""one class for car"""
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