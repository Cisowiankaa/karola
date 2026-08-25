from pathlib import Path

root = Path('bdsm-app')
index = root / 'index.html'
module = root / 'month-calendar-module.js'
text = index.read_text(encoding='utf-8')
source = module.read_text(encoding='utf-8')
start = '<!-- MONTH_CALENDAR_INLINE_START -->'
end = '<!-- MONTH_CALENDAR_INLINE_END -->'
if start in text and end in text:
    a = text.index(start)
    b = text.index(end, a) + len(end)
    text = text[:a] + text[b:]
block = f"{start}\n<script>\n{source}\n</script>\n{end}\n"
text = text.replace('</body>', block + '</body>', 1)
index.write_text(text, encoding='utf-8')
print('Injected month calendar')
