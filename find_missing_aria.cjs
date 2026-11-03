const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

const checkFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Look for any button containing an icon
  // Relax the regex to find things like:
  // <button ...>
  //   ...
  //   <span className="material-symbols-outlined">...</span>
  //   ...
  // </button>
  const buttonRegex = /<button[^>]*>[\s\S]*?<\/button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const buttonStr = match[0];
    if (buttonStr.includes('material-symbols-outlined')) {
      // It's an icon button, see if it has text inside
      // A simplistic way is to strip tags and see what's left
      const textContent = buttonStr.replace(/<[^>]+>/g, '').trim();

      // If the text inside is just the icon name (or empty), and there's no aria-label
      // Icon names are usually alphabetic and no spaces, e.g. "close", "chevron_left"
      // Or if there's no visible text other than the material symbol name

      const hasAriaLabel = buttonStr.includes('aria-label=') || buttonStr.includes('title=');

      if (!hasAriaLabel) {
         console.log(`\nPotential missing aria-label in: ${filePath}`);
         console.log(buttonStr.substring(0, 150) + "...");
      }
    }
  }
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkSync(filePath);
    } else if (file.endsWith('.tsx')) {
      checkFile(filePath);
    }
  }
};

walkSync(componentsDir);
