class Dog:
    def __init__(self, name, age):
        self.name=name
        self.age=age

    def sit(self):
        print(f"{self.name} is now sitting")

    def roll_over(self):
        print(f"{self.name} rolled over!")

my_dog=Dog('whit',6)
my_dog.sit()