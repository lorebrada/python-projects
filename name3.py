name = 'Alice'
password = 'wonderland'
age = 20
if name == 'Alice':
    print('Hello Alice!')
    if password == 'wonderland':
        print('access granted')
    else:
        print('accesss denied')

if name == 'Mary':
    print('Hi mary')
elif age < 30 and name != 'Mary':
    print('you are not Mary, kiddo')
else:
    print('Hello stranger!')