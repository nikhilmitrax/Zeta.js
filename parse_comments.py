import re, os
out = []
for rt, d, fs in os.walk('src'):
  for f in fs:
    if f.endswith('.ts'):
      path = os.path.join(rt, f)
      with open(path, 'r') as fh: text = fh.read()
      lines = text.split('\n')
      for i, l in enumerate(lines):
        if '//' in l:
          out.append(f"{path}:{i+1}:{l.strip()}")
      for m in re.finditer(r'/\*.*?\*/', text, flags=re.DOTALL):
        out.append(f"{path}:MULTI:{m.group(0).replace('\n', ' ')[:100]}...")
with open('/tmp/all_comments.txt', 'w') as f:
  f.write('\n'.join(out))
