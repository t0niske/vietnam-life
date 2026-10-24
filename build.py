# Builds index.html: inlines style.css + demo.js + app.js and maps every file in img/ to window.VL_IMG.
# Images stay as separate files (img/...) so the page loads fast on GitHub Pages.
import json, os
here = os.path.dirname(os.path.abspath(__file__))
read = lambda f: open(os.path.join(here, f), encoding='utf-8').read()
imgs = {os.path.splitext(f)[0]: 'img/' + f for f in sorted(os.listdir(os.path.join(here, 'img')))}
# public client config: the anon key only works within the database's row level security rules
cloud = {
    'url': 'https://rdaupsnobthvisqgwpuy.supabase.co',
    'key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkYXVwc25vYnRodmlzcWd3cHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjA1NDEsImV4cCI6MjEwODQzNjU0MX0.tu0OT5LLVaai7YjE7k2C48Klyyaz0zNHtYDkITOQClk',
    'bot': 'vietnam_helpbot',
}
html = f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vietnam Life</title>
<meta name="description" content="Vietnam Life — планер жизни во Вьетнаме: расходы, жильё, коммуналка, питание, цели, поездки и заметки.">
<link rel="icon" type="image/png" href="img/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Inter:wght@400;500;600;700&display=swap&subset=cyrillic,vietnamese">
<link rel="preload" as="image" href="img/hero.jpg">
<style>{read('style.css')}</style>
</head>
<body>
<div id="root"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script>window.VL_IMG={json.dumps(imgs)};window.VL_SUPABASE={json.dumps(cloud)};</script>
<script>{read('demo.js')}</script>
<script>{read('app.js')}</script>
</body>
</html>
'''
open(os.path.join(here, 'index.html'), 'w', encoding='utf-8', newline='\n').write(html)
print(len(html), 'bytes,', len(imgs), 'images')
