const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the setVerificationStep setter to enforce step completion rules if in production
const targetLine = "const [verificationStep, setVerificationStep] =";
const replaceBlock = `
  const [verificationStepState, setVerificationStepState] = useState<VerificationStepId>(1);
  const verificationStep = verificationStepState;

  const setVerificationStep = useCallback((step: VerificationStepId | ((prev: VerificationStepId) => VerificationStepId)) => {
    setVerificationStepState((prev) => {
      const nextStep = typeof step === 'function' ? step(prev) : step;
      const isProduction = import.meta.env.PROD;

      // Allow moving backwards freely
      if (nextStep <= prev) return nextStep;

      // Enforce step completion in production before moving forward
      if (isProduction) {
        if (nextStep > 1 && !verificationData.isIdVerified) return 1;
        if (nextStep > 2 && !(verificationData.phoneVerified && verificationData.isContactVerified)) return 2;
        if (nextStep > 3 && verificationData.licenseStatus !== 'verified' && verificationData.licenseStatus !== 'pending_review') return 3;
      }
      return nextStep;
    });
  }, [verificationData]);
`;

let newContent = content.replace(
  /const \[verificationStep, setVerificationStep\] =\s+useState<VerificationStepId>\(3\);/,
  replaceBlock.trim()
);

fs.writeFileSync('src/App.tsx', newContent, 'utf8');
