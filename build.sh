#!/usr/bin/env bash
# Build the VCL tutorial by injecting RxNorm data into the HTML template.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"

python3 -c "
import json
with open('$DIR/rxnorm-subset.json') as f:
    data = f.read().strip()
with open('$DIR/vcl-tutorial-template.html') as f:
    html = f.read()
html = html.replace('\"__RXNORM_DATA_PLACEHOLDER__\"', data, 1)
with open('$DIR/vcl-tutorial.html', 'w') as f:
    f.write(html)
print(f'Built: vcl-tutorial.html ({len(html):,} bytes)')
"
