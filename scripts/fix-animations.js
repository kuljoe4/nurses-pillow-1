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
      if (content.includes('animate-ping') || content.includes('animate-pulse')) {
        content = content.replace(/animate-ping/g, '');
        content = content.replace(/animate-pulse/g, '');
        // Cleanup double spaces created by removing classes
        content = content.replace(/  +/g, ' ');
        content = content.replace(/ \)/g, ')');
        content = content.replace(/ \}/g, '}');
        content = content.replace(/ "/g, '"');
        content = content.replace(/" /g, '"');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
