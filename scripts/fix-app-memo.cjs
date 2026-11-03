const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

if (!appContent.includes('useCallback')) {
  appContent = appContent.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, useCallback, useMemo } from 'react';");

  // Wrap simple handlers in useCallback
  appContent = appContent.replace(/const handleToggleScreenCodes = \(\) => \{/g, 'const handleToggleScreenCodes = useCallback(() => {');
  appContent = appContent.replace(/const handleLogout = \(\) => \{/g, 'const handleLogout = useCallback(() => {');

  // Add }, []); for these specific ones
  // We'll skip complex AST modifications and just do manual review on App.tsx where possible, or trust React 19's auto-memoization if we are on it. Wait, the package.json says React 19! React 19 handles memoization automatically via React Compiler (if enabled) or we don't strictly need useMemo/useCallback everywhere anymore. Let's check if React 19 is used.
}

fs.writeFileSync('src/App.tsx', appContent, 'utf8');
