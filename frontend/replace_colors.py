import os

files = [
    'c:/Users/lenovo/Downloads/DALIL/DALIL/frontend/components/ChatInterface.tsx',
    'c:/Users/lenovo/Downloads/DALIL/DALIL/frontend/components/Dashboard.tsx',
    'c:/Users/lenovo/Downloads/DALIL/DALIL/frontend/components/Header.tsx',
    'c:/Users/lenovo/Downloads/DALIL/DALIL/frontend/components/InteractiveBackground.tsx',
    'c:/Users/lenovo/Downloads/DALIL/DALIL/frontend/components/AudioPlayer.tsx',
    'c:/Users/lenovo/Downloads/DALIL/DALIL/frontend/App.tsx',
]

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace('orange', 'slate')
    content = content.replace('#ea580c', '#475569') # slate-600
    content = content.replace('#f97316', '#64748b') # slate-500 
    content = content.replace('#fb923c', '#94a3b8') # slate-400
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print('Colors replaced!')
