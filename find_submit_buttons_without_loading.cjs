const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

const checkFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match forms or just check submit buttons and their disabled states
  // Simplistic approach: look for `type="submit"` and see if it lacks `disabled={isSubmitting}` (or similar) or loading state text inside

  const buttonRegex = /<button[^>]*type="submit"[^>]*>([\s\S]*?)<\/button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const buttonStr = match[0];
    const innerHtml = match[1];

    // Check if it's disabled during some loading state
    const hasDisabled = buttonStr.includes('disabled={');
    // Check if it has a spinner or loading text
    const hasLoadingText = innerHtml.includes('...') || innerHtml.includes('spinner') || innerHtml.includes('progress_activity');

    if (!hasDisabled || !hasLoadingText) {
       // console.log(`\nPotential submit button without loading state in: ${filePath}`);
       // console.log(buttonStr.substring(0, 150) + "...");
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
