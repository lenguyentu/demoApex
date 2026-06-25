import re
import os

path = r'd:\apex_internal\demoApex\src\features\manager\pages\JobFocusPage.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

translations = {
    'Bạn chưa có job focus this week': "You don't have job focus this week",
    'Có cập nhật this week': 'Updates this week',
    'Week này': 'This week',
    'Week ago': 'Last week',
    'Week sau': 'Next week',
}

for k, v in translations.items():
    content = content.replace(k, v)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
