const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('App.tsx') && !fullPath.includes('main.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Look for export const ComponentName: React.FC...
      // and wrap it in React.memo if not already memoized
      if (content.includes('export const ') && content.includes(': React.FC') && !content.includes('React.memo(')) {
        const match = content.match(/export const ([A-Za-z0-9_]+): React\.FC<[A-Za-z0-9_]+> = \(/);
        if (match) {
          const componentName = match[1];
          // We will use regex to find the end of the component (not trivial) or simply update the export.
          // Since doing AST parsing in bash regex is brittle, let's just use useMemo for variables where applicable instead
          // For now we will just use a simpler check, or skip complex AST transformation.
        }
      }
    }
  }
}

// processDir(path.join(__dirname, 'src/components'));
