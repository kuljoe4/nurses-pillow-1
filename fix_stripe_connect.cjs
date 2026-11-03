const fs = require('fs');
let code = fs.readFileSync('src/components/HostPortalView.tsx', 'utf8');

// Ensure the code hasn't changed drastically
if (!code.includes('Stripe Connect Embedded components')) {
    console.log('Skipping patch, looks different.');
} else {
    console.log('Patching HostPortalView');
}

// Remove old mock state if we aren't using it
