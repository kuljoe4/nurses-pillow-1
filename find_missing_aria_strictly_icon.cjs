const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

const checkFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match buttons
  const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const buttonStr = match[0];
    const innerHtml = match[1];

    // remove comments
    const noComments = innerHtml.replace(/\{?\/\*.*?\*\/\}?/g, '');

    // remove tags
    const textContent = noComments.replace(/<[^>]*>/g, '').trim();

    // If textContent is just a known icon name or empty, AND it has no aria-label
    // material symbols are usually lowercase words separated by underscores
    const isIconTextOnly = /^[a-z_]*$/.test(textContent);

    const hasIconClass = buttonStr.includes('material-symbols-outlined');
    const hasAriaLabel = buttonStr.includes('aria-label=') || buttonStr.includes('title=') || buttonStr.includes('aria-labelledby=');

    if (hasIconClass && isIconTextOnly && !hasAriaLabel) {
       console.log(`\nPotential strictly icon-only missing aria-label in: ${filePath}`);
       console.log(buttonStr.substring(0, 150) + "...");
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
