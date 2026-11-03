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

      // Make borders thinner and softer
      content = content.replace(/border-2/g, 'border');

      // Reduce shadow harshness
      content = content.replace(/shadow-xl/g, 'shadow-md');
      content = content.replace(/shadow-2xl/g, 'shadow-lg');

      // Refine transitions
      content = content.replace(/transition-all/g, 'transition-all duration-200 ease-in-out');
      // Fix potential duplicate classes
      content = content.replace(/transition-all duration-200 ease-in-out duration-200 ease-in-out/g, 'transition-all duration-200 ease-in-out');

      // Make ring widths thinner and softer
      content = content.replace(/ring-4/g, 'ring-2');
      content = content.replace(/ring-offset-2/g, 'ring-offset-1');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
