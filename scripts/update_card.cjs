const fs = require('fs');
let content = fs.readFileSync('src/components/SearchListingCard.tsx', 'utf-8');

// 1. Remove states
content = content.replace(/const \[isHovered, setIsHovered\] = useState\(false\);\n/, '');
content = content.replace(/const \[isMobileExpanded, setIsMobileExpanded\] = useState\(false\);\n/, '');
content = content.replace(/\/\/ Determine if secondary details drawer should be shown\n\s*const isExpanded = isHovered \|\| isMobileExpanded;\n/, '');
content = content.replace(/const shouldReduceMotion = useReducedMotion\(\);\n/, '');
content = content.replace(/import \{ motion, AnimatePresence, useReducedMotion \} from 'framer-motion';/g, "import { motion } from 'framer-motion';");

// 2. Adjust handlers
content = content.replace(
  /onMouseEnter=\{\(\) => setIsHovered\(true\)\}/,
  'onMouseEnter={() => { if (onSelectOnMap) onSelectOnMap(listing.id); }}'
);
content = content.replace(
  /onMouseLeave=\{\(\) => setIsHovered\(false\)\}/,
  ''
);
content = content.replace(
  /onFocus=\{\(\) => setIsHovered\(true\)\}/,
  'onFocus={() => { if (onSelectOnMap) onSelectOnMap(listing.id); }}'
);
content = content.replace(
  /onBlur=\{\(e\) => \{\s*\/\/ Only blur if focus left the card entirely\s*if \(\!e\.currentTarget\.contains\(e\.relatedTarget as Node\)\) \{\s*setIsHovered\(false\);\s*\}\s*\}\}/,
  ''
);
content = content.replace(
  /onClick=\{\(\) => \{\s*if \(onSelectOnMap\) onSelectOnMap\(listing\.id\);\s*\}\}/,
  'onClick={() => onViewDetails(listing)}'
);

// 3. Remove isExpanded classes
content = content.replace(
  /\: isExpanded\s*\?\s*'border-\[#0A6FA8\]\/60 shadow-\[0_8px_24px_rgba\(11,37,89,0\.12\)\] dark:shadow-\[0_8px_24px_rgba\(0,0,0,0\.5\)\] -translate-y-0\.5'\s*/,
  ''
);

content = content.replace(
  /\{\/\* Subtle Hover Cue Tag \(disappears on hover\/expand to give room\) \*\/\}[\s\S]*?\{\!isExpanded && \([\s\S]*?<\/div>\s*\)\}/,
  ''
);

// 4. Remove section 3 and 4 entirely
const regexSections = /\{\/\* 3\. MOBILE TOGGLE TRIGGER[\s\S]*?\{\/\* 5\. RESTING ACTION BAR/;
content = content.replace(regexSections, '{/* 3. RESTING ACTION BAR');

// 5. Unconditionally show the resting action bar
content = content.replace(
  /\{\!isExpanded && \(\s*(<div className="hidden sm:flex pt-2\.5 border-t border-\[rgba\(11,37,89,0\.06\)\] dark:border-\[#233550\] items-center justify-between gap-2">[\s\S]*?<\/div>)\s*\)\}/,
  '$1'
);

content = content.replace(/className="hidden sm:flex pt-2\.5 border-t/, 'className="flex pt-2.5 border-t');

fs.writeFileSync('src/components/SearchListingCard.tsx', content);
console.log("Updated SearchListingCard.tsx");
