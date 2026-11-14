import os
import re

web_dir = r"C:\coding\digital foot crm\DCRM\apps\web"
targets = set()
pattern = re.compile(r"""(?:href=["']|router\.push\(["'`])(/(?:internal|portal)[^"'`$?\s]*)""")

for root, _, files in os.walk(web_dir):
    for f in files:
        if f.endswith(".tsx") or f.endswith(".ts"):
            with open(os.path.join(root, f), "r", encoding="utf-8") as fp:
                for line in fp:
                    for m in pattern.findall(line):
                        targets.add(m)

for t in sorted(targets):
    print(t)
