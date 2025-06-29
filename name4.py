name = 'Carol'
age = 87
if name == 'Alice':
    print('Hello Alice, how are you?')
elif name == 'Bob':
    print('Hello Bob, how is your family?')
elif age < 12:
    print('Hello, you are not alice or Bob, kiddo')
elif age > 2000:
    print('Hello, you are not Alice or Bob, Oldie')
elif age > 100:
    print('You are not Alice or Bob, Grannie')
elif age >= 12 and age <=100:
    print('Hello, you are not Alice or Bob, but you are a grown up')


name = 'Carol'
age = 3000
if name == 'Alice':
    print('Hi, ALice, how are you?')
elif name == 'Bob':
    print('Hi, Bob, how is your family?')
elif age < 12:
    print('Hi, you are not Alice or Bob, kiddo.')
else:
    print('Hi, you are neither Alice nor Bob, but you are an oldie.')
