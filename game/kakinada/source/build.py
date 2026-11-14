# Rebuilds ../index.html by embedding data.json into game-template.html
t=open('game-template.html',encoding='utf8').read()
d=open('data.json',encoding='utf8').read().replace('</','<\\/')
open('../index.html','w',encoding='utf8').write(t.replace('/*DATA*/',d))
print('index.html rebuilt')
