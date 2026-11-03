const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // Make sure hover states have focus equivalents for keyboard nav (if hover:bg- exists but no focus:bg- or focus-visible:)
      content = content.replace(/hover:bg-([a-zA-Z0-9-\[\]#]+)(?!.*focus)/g, 'hover:bg-$1 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-$1');
      content = content.replace(/hover:text-([a-zA-Z0-9-\[\]#]+)(?!.*focus)/g, 'hover:text-$1 focus-visible:text-$1');

      // Make sure all buttons have type attribute to prevent implicit submission, though this might be tricky to regex safely.
      // We will skip this to avoid breaking `<button type="submit">`.

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
