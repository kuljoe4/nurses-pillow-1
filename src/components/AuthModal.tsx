import React, { useState, useEffect } from "react";
import { UserRole } from "../types";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "signin" | "signup" | "forgot-password" | "reset-password";
  initialResetToken?: string;
  onClose: () => void;
  isNightShiftMode: boolean;
  onAuthenticated: (
    role: UserRole,
    name: string,
    email?: string,
    id?: string,
    isNurseVerified?: boolean,
    isHostVerified?: boolean,
    isIdVerified?: boolean,
    skipAutoNavigate?: boolean
  ) => void | Promise<void>;
  onOpenEmailVerification?: (email?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = "signup",
  initialResetToken = "",
  onClose,
  isNightShiftMode,
  onAuthenticated,
  onOpenEmailVerification,
}) => {
  useBodyScrollLock(isOpen);

  const [mode, setMode] = useState<
    "signin" | "signup" | "forgot-password" | "reset-password"
  >(initialMode);
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>("nurse");

  // Forgot / Reset Password state
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form states - clean initial states, never prefilled
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("rn");
  const [propertyType, setPropertyType] = useState("entire");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [quietHoursAgreed, setQuietHoursAgreed] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSignupStep(1);
      setAuthError(null);
      setSuccessMessage("");
    }
  }, [isOpen, initialMode]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Password strength calculation
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = calculateStrength(password);

  if (!isOpen) return null;

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quietHoursAgreed || isLoading) return;
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, role }),
      });

      const data = res.headers.get("content-type")?.includes("application/json")
        ? await res.json()
        : {};

      if (!res.ok) {
        throw new Error(data.error || "Registration failed. Please check your details.");
      }

      if (data.token) {
        localStorage.setItem("np_auth_token", data.token);
      }

      await onAuthenticated(
        data.user.role as UserRole,
        data.user.full_name,
        data.user.email,
        data.user.id,
        data.user.is_nurse_verified,
        data.user.is_host_verified,
        data.user.identity_verified,
        true // continue to email verification
      );

      if (onOpenEmailVerification) {
        onOpenEmailVerification(data.user.email);
      }
      onClose();
    } catch (err: any) {
      setAuthError(err.message || "An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setAuthError(null);
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = res.headers.get("content-type")?.includes("application/json")
        ? await res.json()
        : {};
      if (!res.ok) {
        throw new Error(data.error || "Unable to send reset link.");
      }

      setSuccessMessage(
        data.message || "If an account exists, a password reset link has been sent."
      );
    } catch (err: any) {
      setAuthError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword: password }),
      });

      const data = res.headers.get("content-type")?.includes("application/json")
        ? await res.json()
        : {};
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccessMessage("Password reset successfully. You can now sign in.");
      setTimeout(() => {
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
        setSuccessMessage("");
      }, 2500);
    } catch (err: any) {
      setAuthError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSigninSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = res.headers.get("content-type")?.includes("application/json")
        ? await res.json()
        : {};

      if (res.status === 403 && data.requiresVerification) {
        if (onOpenEmailVerification) {
          onOpenEmailVerification(email);
        }
        onClose();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password.");
      }

      if (data.token) {
        localStorage.setItem("np_auth_token", data.token);
      }

      await onAuthenticated(
        data.user.role as UserRole,
        data.user.full_name,
        data.user.email,
        data.user.id,
        data.user.is_nurse_verified,
        data.user.is_host_verified,
        data.user.identity_verified
      );
      onClose();
    } catch (err: any) {
      setAuthError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] overflow-y-auto p-4 sm:p-6 pt-12 sm:pt-16 bg-[#0B2559]/70 backdrop-blur-xs flex justify-center items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-xl my-auto rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(11,37,89,0.18)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] relative border transition-all duration-200 ease-in-out ${
          isNightShiftMode
            ? "bg-[#0E1A2E] border-[#233550] text-[#E6ECF7]"
            : "bg-white border-[rgba(11,37,89,0.08)] text-[#0B2559]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] focus-visible:outline-none cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Error Banner */}
        {authError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-[#F4E2DC] text-[#A8452E] text-xs font-semibold flex items-center gap-2 border border-[#A8452E]/20"
          >
            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
            <span>{authError}</span>
          </div>
        )}

        {/* Top Tab Mode Switcher (only for signup & signin) */}
        {(mode === "signup" || mode === "signin") && (
          <div className="flex items-center justify-center mb-6">
            <div className="p-1 rounded-full bg-[#EFF6FB] dark:bg-[#15233a] flex items-center border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setSignupStep(1);
                  setAuthError(null);
                }}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  mode === "signup"
                    ? "bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-[#0B2559] dark:hover:text-white"
                }`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setAuthError(null);
                }}
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  mode === "signin"
                    ? "bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-[#0B2559] dark:hover:text-white"
                }`}
              >
                Sign in
              </button>
            </div>
          </div>
        )}

        {/* SCREEN AU-01: SIGN UP — STEP 1: ROLE SELECTION */}
        {mode === "signup" && signupStep === 1 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                How will you use Nurses Pillow?
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-md mx-auto">
                Select your role to start with housing designed around hospital assignments.
              </p>
            </div>

            {/* Two Clean Role Cards - Absolutely NO inputs on this screen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole("nurse")}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                  role === "nurse"
                    ? "border-[#0A6FA8] bg-[#EFF6FB] dark:bg-[#0A6FA8]/15 ring-2 ring-[#0A6FA8] text-[#0B2559] dark:text-white shadow-sm"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[#111e33] text-gray-700 dark:text-gray-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0A6FA8]/10 text-[#0A6FA8] dark:text-[#3E9AD1] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">
                        stethoscope
                      </span>
                    </div>
                    {role === "nurse" && (
                      <span className="material-symbols-outlined text-[20px] text-[#0A6FA8] dark:text-[#3E9AD1]">
                        check_circle
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#0B2559] dark:text-white">
                    Traveling clinician
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    Furnished homes near your hospital with protected day-sleeper quiet hours.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[rgba(11,37,89,0.06)] dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  $0 booking fees · 4–26 week stays
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("host")}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                  role === "host"
                    ? "border-[#0A6FA8] bg-[#EFF6FB] dark:bg-[#0A6FA8]/15 ring-2 ring-[#0A6FA8] text-[#0B2559] dark:text-white shadow-sm"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[#111e33] text-gray-700 dark:text-gray-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0A6FA8]/10 text-[#0A6FA8] dark:text-[#3E9AD1] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">
                        roofing
                      </span>
                    </div>
                    {role === "host" && (
                      <span className="material-symbols-outlined text-[20px] text-[#0A6FA8] dark:text-[#3E9AD1]">
                        check_circle
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#0B2559] dark:text-white">
                    Property host
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    Host verified healthcare professionals with flexible mid-term stays.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[rgba(11,37,89,0.06)] dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  Verified guests · 100% booking control
                </div>
              </button>
            </div>

            {/* Step 1 Action Button */}
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setSignupStep(2);
              }}
              className="w-full py-3 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#0A6FA8] focus-visible:outline-none"
            >
              <span>
                {role === "nurse"
                  ? "Continue as clinician"
                  : "Continue as host"}
              </span>
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setAuthError(null);
                }}
                className="text-xs text-gray-600 dark:text-gray-300 hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] transition-colors cursor-pointer"
              >
                Already have an account? <span className="font-semibold underline">Sign in</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN AU-02: SIGN UP — STEP 2: ACCOUNT DETAILS */}
        {mode === "signup" && signupStep === 2 && (
          <div>
            {/* Back Button to change role */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  setSignupStep(1);
                  setAuthError(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  arrow_back
                </span>
                <span>Change role</span>
              </button>

              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {role === "nurse" ? "Clinician account" : "Host account"}
              </span>
            </div>

            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight">
                {role === "nurse"
                  ? "Create your clinician account"
                  : "Create your host account"}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                {role === "nurse"
                  ? "Enter your details to view hospital stays and verified quiet housing."
                  : "Enter your details to list your sanctuary for medical travelers."}
              </p>
            </div>

            {/* Step 2 Form */}
            <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="reg-fullName" className="block font-semibold mb-1 text-gray-700 dark:text-gray-200">
                  Full legal name
                </label>
                <input
                  id="reg-fullName"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#EFF6FB]/60 dark:bg-[#15233a] focus:bg-white dark:focus:bg-[#15233a] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] focus:border-transparent transition-colors"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>

              {/* Role-Specific Field */}
              {role === "nurse" ? (
                <div>
                  <label htmlFor="reg-specialty" className="block font-semibold mb-1 text-gray-700 dark:text-gray-200">
                    Clinical discipline
                  </label>
                  <select
                    id="reg-specialty"
                    name="specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111e33] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] transition-colors"
                  >
                    <option value="rn">Registered Nurse (RN)</option>
                    <option value="physician">Physician (MD / DO)</option>
                    <option value="pa_np">Nurse Practitioner (NP) / Physician Assistant (PA)</option>
                    <option value="therapy">Physical, Occupational, or Speech Therapist</option>
                    <option value="allied">Allied Health, Respiratory, or Pharmacist</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="reg-propertyType" className="block font-semibold mb-1 text-gray-700 dark:text-gray-200">
                    Property type
                  </label>
                  <select
                    id="reg-propertyType"
                    name="propertyType"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111e33] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] transition-colors"
                  >
                    <option value="entire">Entire residential home or condo</option>
                    <option value="private_suite">Private suite with dedicated bathroom</option>
                    <option value="guest_house">Guest house / detached ADU</option>
                    <option value="compound">Multi-bedroom furnished property</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-email" className="block font-semibold mb-1 text-gray-700 dark:text-gray-200">
                    Email address
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#EFF6FB]/60 dark:bg-[#15233a] focus:bg-white dark:focus:bg-[#15233a] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] focus:border-transparent transition-colors"
                    placeholder="name@hospital.org"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block font-semibold mb-1 text-gray-700 dark:text-gray-200">
                    Mobile phone
                  </label>
                  <input
                    id="reg-phone"
                    name="tel"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#EFF6FB]/60 dark:bg-[#15233a] focus:bg-white dark:focus:bg-[#15233a] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] focus:border-transparent transition-colors"
                    placeholder="(555) 000-0000"
                    required
                  />
                </div>
              </div>

              {/* Password with 4-Bar Strength Meter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="reg-password" className="font-semibold text-gray-700 dark:text-gray-200">
                    Create password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#0A6FA8] dark:text-[#3E9AD1] font-medium hover:underline cursor-pointer"
                  >
                    {showPassword ? "Hide password" : "Show password"}
                  </button>
                </div>
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#EFF6FB]/60 dark:bg-[#15233a] focus:bg-white dark:focus:bg-[#15233a] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] focus:border-transparent transition-colors"
                  placeholder="At least 8 characters"
                  required
                />

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">Password strength:</span>
                      <span
                        className={`font-semibold ${
                          strengthScore >= 3
                            ? "text-[#2F6E5E]"
                            : strengthScore === 2
                            ? "text-[#B9822E]"
                            : "text-[#A8452E]"
                        }`}
                      >
                        {strengthScore >= 3
                          ? "Strong"
                          : strengthScore === 2
                          ? "Fair"
                          : "Weak"}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`h-full rounded-full transition-all duration-200 ${
                            strengthScore >= bar
                              ? strengthScore >= 3
                                ? "bg-[#2F6E5E]"
                                : strengthScore === 2
                                ? "bg-[#B9822E]"
                                : "bg-[#A8452E]"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Day-Sleeper Protocol Agreement */}
              <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={quietHoursAgreed}
                  onChange={(e) => setQuietHoursAgreed(e.target.checked)}
                  className="mt-0.5 rounded accent-[#0A6FA8]"
                  required
                />
                <span className="leading-relaxed">
                  I agree to the Terms of Service, Privacy Policy, and Day-Sleeper Quiet Hours Protocol (8:00 AM – 5:00 PM).
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading || !quietHoursAgreed}
                className="w-full py-3 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0A6FA8] focus-visible:outline-none"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                <span>
                  {role === "nurse"
                    ? "Create clinician account"
                    : "Create host account"}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* SCREEN AU-03: SIGN IN */}
        {mode === "signin" && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Sign in to manage your clinical stays or property listings.
              </p>
            </div>

            <form onSubmit={handleSigninSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="login-email" className="block font-semibold mb-1 text-gray-700 dark:text-gray-200">
                  Email address
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#EFF6FB]/60 dark:bg-[#15233a] focus:bg-white dark:focus:bg-[#15233a] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] focus:border-transparent transition-colors"
                  placeholder="name@hospital.org"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="font-semibold text-gray-700 dark:text-gray-200">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password");
                      setAuthError(null);
                      setSuccessMessage("");
                    }}
                    className="text-[11px] text-[#0A6FA8] dark:text-[#3E9AD1] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#EFF6FB]/60 dark:bg-[#15233a] focus:bg-white dark:focus:bg-[#15233a] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="rounded accent-[#0A6FA8]"
                />
                <span>Remember this device for 30 days</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0A6FA8] focus-visible:outline-none"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                <span>Sign in</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setSignupStep(1);
                    setAuthError(null);
                  }}
                  className="text-xs text-gray-600 dark:text-gray-300 hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] transition-colors cursor-pointer"
                >
                  New to Nurses Pillow? <span className="font-semibold underline">Create an account</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SCREEN AU-04: FORGOT PASSWORD */}
        {mode === "forgot-password" && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold tracking-tight">
                Reset your password
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-sm mx-auto">
                Enter your account email and we'll send you a link to reset your password.
              </p>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 bg-[#E1EFE9] text-[#2F6E5E] rounded-xl flex items-start gap-2 text-xs border border-[#2F6E5E]/20">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <p>{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="forgot-email" className="block font-semibold mb-1 text-gray-700 dark:text-gray-200">
                  Email address
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#EFF6FB]/60 dark:bg-[#15233a] focus:bg-white dark:focus:bg-[#15233a] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] focus:border-transparent transition-colors"
                  placeholder="name@hospital.org"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0A6FA8] focus-visible:outline-none"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                <span>Send reset link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setAuthError(null);
                  setSuccessMessage("");
                }}
                className="w-full text-center text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] cursor-pointer pt-2"
              >
                Back to sign in
              </button>
            </form>
          </div>
        )}

        {/* SCREEN AU-05: RESET PASSWORD */}
        {mode === "reset-password" && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold tracking-tight">
                Create new password
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Enter your new password below.
              </p>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 bg-[#E1EFE9] text-[#2F6E5E] rounded-xl flex items-start gap-2 text-xs border border-[#2F6E5E]/20">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <p>{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="reset-new-password" className="block font-semibold mb-1 text-gray-700 dark:text-gray-200">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#EFF6FB]/60 dark:bg-[#15233a] focus:bg-white dark:focus:bg-[#15233a] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] focus:border-transparent transition-colors"
                    placeholder="At least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reset-confirm-password" className="block font-semibold mb-1 text-gray-700 dark:text-gray-200">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="reset-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#EFF6FB]/60 dark:bg-[#15233a] focus:bg-white dark:focus:bg-[#15233a] text-xs text-[#0B2559] dark:text-[#E6ECF7] outline-none focus:ring-2 focus:ring-[#0A6FA8] focus:border-transparent transition-colors"
                    placeholder="Re-enter your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0A6FA8] focus-visible:outline-none"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                <span>Reset password</span>
              </button>
            </form>
          </div>
        )}

        {/* Quiet, Clean Trust & Security Notice */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#0A6FA8] dark:text-[#3E9AD1]">
            verified_user
          </span>
          <span>
            256-bit encryption · Clinician credentials verified directly with state licensing boards
          </span>
        </div>
      </div>
    </div>
  );
};
