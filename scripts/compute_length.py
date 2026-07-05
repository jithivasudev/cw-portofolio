import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
js_path = ROOT / "js" / "signature-path.js"
text = js_path.read_text(encoding="utf-8")
match = re.search(r'SIGNATURE_PATH = "([^"]+)"', text)
path_d = match.group(1)
nums = [float(x) for x in re.sub(r"[ML]", "", path_d).split()]
length = sum(
    math.hypot(nums[i] - nums[i - 2], nums[i + 1] - nums[i - 1])
    for i in range(2, len(nums), 2)
)
length = math.ceil(length)
print(length)

if "SIGNATURE_LENGTH" not in text:
    js_path.write_text(
        text.rstrip() + f"\nconst SIGNATURE_LENGTH = {length};\n",
        encoding="utf-8",
    )
    print(f"Updated {js_path}")
