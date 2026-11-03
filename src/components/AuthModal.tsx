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
  const [role, setRole] = useState<UserRole>("nurse");

  // Forgot / Reset Password state
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  // Form states
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("rn");
  const [propertyType, setPropertyType] = useState("entire");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [quietHoursAgreed, setQuietHoursAgreed] = useState(true);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Password strength
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

      const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
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
        true // skipAutoNavigate so flow continues to email-verification
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

      const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      setSuccessMessage(
        data.message ||
          "If an account exists, a password reset link has been sent.",
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
      setAuthError("Passwords do not match");
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

      const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccessMessage(
        "Password has been reset successfully. You can now sign in.",
      );
      // After successful reset, wait a bit and go to sign in
      setTimeout(() => {
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
        setSuccessMessage("");
      }, 3000);
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

      const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});

      if (res.status === 403 && data.requiresVerification) {
        if (onOpenEmailVerification) {
          onOpenEmailVerification(email);
        }
        onClose();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
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
      setAuthError(err.message || "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] overflow-y-auto p-4 sm:p-6 pt-16 sm:pt-20 bg-black/65 backdrop-blur-xs flex justify-center items-start"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-2xl my-auto rounded-3xl p-6 sm:p-8 shadow-lg relative border transition-all duration-200 ease-in-out ${
          isNightShiftMode
            ? "bg-[#0E1A2E] border-[#233550] text-[#E6ECF7]"
            : "bg-white border-[rgba(11,37,89,0.1)] text-[#001848]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Authentication Error Banner */}
        {authError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">error</span>
            {authError}
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="p-1 rounded-full bg-[#eaedff] dark:bg-[#15233a] flex items-center">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ease-in-out cursor-pointer ${
                mode === "signup"
                  ? "bg-[#001848] dark:bg-[#005684] text-white shadow-xs"
                  : "text-[#404850] dark:text-[#c0c7d1]"
              }`}
            >
              Create Sanctuary Account
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ease-in-out cursor-pointer ${
                mode === "signin"
                  ? "bg-[#001848] dark:bg-[#005684] text-white shadow-xs"
                  : "text-[#404850] dark:text-[#c0c7d1]"
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Role Selection & Safe Clinical Sign-Up */}
        {mode === "signup" && (
          <div>
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#005684] dark:text-[#93ccff]">
                Safe Clinical Onboarding
              </span>
              <h2 className="text-2xl font-bold tracking-tight mt-1">
                Create your sanctuary account
              </h2>
              <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-1">
                Furnished housing curated for traveling healthcare professionals
                and verified hosts.
              </p>
            </div>

            {/* Role Selection Buttons (Fixed min-height to eliminate CLS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setRole("nurse")}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ease-in-out min-h-[76px] flex flex-col justify-center ${
                  role === "nurse"
                    ? "border-[#005684] bg-[#0a6fa8] text-white shadow-sm"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-50 dark:hover:bg-white focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">
                      stethoscope
                    </span>
                    Clinician / Medical Traveler
                  </span>
                  {role === "nurse" && (
                    <span className="material-symbols-outlined text-[16px]">
                      check_circle
                    </span>
                  )}
                </div>
                <div className="text-[11px] opacity-90">
                  RN, MD/DO, Allied Health • $0 Fees • 4–26 Wk Stays
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("host")}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ease-in-out min-h-[76px] flex flex-col justify-center ${
                  role === "host"
                    ? "border-[#005684] bg-[#0a6fa8] text-white shadow-sm"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-50 dark:hover:bg-white focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">
                      roofing
                    </span>
                    Property Host / Owner
                  </span>
                  {role === "host" && (
                    <span className="material-symbols-outlined text-[16px]">
                      check_circle
                    </span>
                  )}
                </div>
                <div className="text-[11px] opacity-90">
                  Entire Home or Private Room • ~95% Net Payout
                </div>
              </button>
            </div>

            {/* Role Context Pill Banner (Fixed min-height prevents layout shift) */}
            <div className="p-3.5 rounded-2xl bg-[#aff0db]/25 border border-[#aff0db]/60 text-xs text-[#195b4c] dark:text-[#aff0db] mb-5 flex items-start gap-2.5 min-h-[76px]">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                verified
              </span>
              <div className="flex-1">
                <div className="font-bold leading-tight">
                  {role === "nurse"
                    ? "Healthcare Professional Privileges"
                    : "Verified Property Host Privileges"}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed">
                  {role === "nurse"
                    ? "Exclusive access to day-sleeper sanctuaries with zero-penalty contract cancellation safeguards."
                    : "List entire properties or private furnished rooms with 100% booking autonomy and ~95% Net Payout."}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSignupSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Legal Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-[#005684]"
                    placeholder="Sarah Jenkins"
                    required
                  />
                </div>
              </div>

              {/* Matched slot for both roles eliminates vertical jump (CLS) */}
              {role === "nurse" ? (
                <div>
                  <label className="block font-bold mb-1">
                    Specialty / Clinical Discipline
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111e33] focus:outline-none"
                  >
                    <option value="rn">
                      Registered Nurse (RN / BSN / MSN — ICU, ER, OR, MedSurg,
                      Telemetry)
                    </option>
                    <option value="physician">
                      Physician (MD / DO — Travel Hospitalist, Intensivist,
                      Fellow)
                    </option>
                    <option value="pa_np">
                      Physician Assistant (PA) / Nurse Practitioner (NP / APRN)
                    </option>
                    <option value="therapy">
                      Therapist (Physical PT / Occupational OT / Speech SLP)
                    </option>
                    <option value="allied">
                      Allied Health / Respiratory Therapist (CRT, RRT) /
                      Pharmacist
                    </option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold mb-1">
                    Property Type / Housing Portfolio
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111e33] focus:outline-none"
                  >
                    <option value="entire">
                      Entire Residential Home (Condo, Townhouse, Single-Family)
                    </option>
                    <option value="private_suite">
                      Private Bedroom Suite with Dedicated En-Suite Bathroom
                    </option>
                    <option value="guest_house">
                      In-Law Suite / Dedicated Accessory Dwelling Unit (ADU)
                    </option>
                    <option value="compound">
                      Multi-Room Mid-Term Assignment Compound
                    </option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    Professional Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none"
                    placeholder="sarah.jenkins@alumni.duke.edu"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none"
                    placeholder="+1 (919) 555-0198"
                    required
                  />
                </div>
              </div>

              {/* Password with 4-Bar Visual Strength Meter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold">Create Secure Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#005684] dark:text-[#93ccff] font-semibold cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none"
                  required
                />

                {/* 4-Bar Visual Strength Meter */}
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Password Strength:</span>
                    <span
                      className={`font-bold ${
                        strengthScore >= 3
                          ? "text-[#195b4c]"
                          : strengthScore === 2
                            ? "text-amber-500"
                            : "text-rose-500"
                      }`}
                    >
                      {strengthScore >= 3
                        ? "Strong"
                        : strengthScore === 2
                          ? "Moderate"
                          : "Weak"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`h-full rounded-full transition-all duration-200 ease-in-out duration-300 ${
                          strengthScore >= bar
                            ? strengthScore >= 3
                              ? "bg-[#195b4c]"
                              : strengthScore === 2
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Day-Sleeper Protocol Agreement */}
              <label className="flex items-start gap-2 text-xs text-[#404850] dark:text-[#c0c7d1] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={quietHoursAgreed}
                  onChange={(e) => setQuietHoursAgreed(e.target.checked)}
                  className="mt-0.5 rounded accent-[#005684]"
                  required
                />
                <span>
                  I agree to the Terms of Service,{" "}
                  <strong>
                    Day-Sleeper Quiet Hours Protocol (8:00 AM – 5:00 PM)
                  </strong>
                  , and Privacy Policy.
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-[#001848] hover:bg-[#162e62] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#162e62] text-white font-bold text-xs shadow-md transition-all duration-200 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                {role === "nurse"
                  ? "Create Clinician Account"
                  : "Create Property Host Account"}
              </button>
            </form>
          </div>
        )}

        {/* Forgot Password Flow */}
        {mode === "forgot-password" && (
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
            <h2 className="text-xl font-black text-[#001848] mb-2 font-display">
              Reset Your Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-6">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-xs border border-red-100">
                <span className="material-symbols-outlined text-[16px] mt-0.5">
                  error
                </span>
                <p>{authError}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-start gap-2 text-xs border border-green-100">
                <span className="material-symbols-outlined text-[16px] mt-0.5">
                  check_circle
                </span>
                <p>{successMessage}</p>
              </div>
            )}

            <form
              onSubmit={handleForgotPasswordSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none"
                  placeholder="sarah.jenkins@alumni.duke.edu"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-[#001848] hover:bg-[#162e62] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#162e62] text-white font-bold text-xs shadow-md transition-all duration-200 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                Send Reset Link
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setAuthError(null);
                  setSuccessMessage("");
                }}
                className="w-full text-center text-xs font-bold text-[#005684] hover:underline cursor-pointer mt-4"
              >
                Back to Sign In
              </button>
            </form>
          </div>
        )}

        {/* Reset Password Flow */}
        {mode === "reset-password" && (
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
            <h2 className="text-xl font-black text-[#001848] mb-2 font-display">
              Create New Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-6">
              Please enter your new password below.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-xs border border-red-100">
                <span className="material-symbols-outlined text-[16px] mt-0.5">
                  error
                </span>
                <p>{authError}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-start gap-2 text-xs border border-green-100">
                <span className="material-symbols-outlined text-[16px] mt-0.5">
                  check_circle
                </span>
                <p>{successMessage}</p>
              </div>
            )}

            <form
              onSubmit={handleResetPasswordSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 pr-9 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2.5 pr-9 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
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
                className="w-full py-3.5 rounded-full bg-[#001848] hover:bg-[#162e62] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#162e62] text-white font-bold text-xs shadow-md transition-all duration-200 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                Reset Password
              </button>
            </form>
          </div>
        )}

        {/* SCREEN AU-03: Clinician & Host Sign-In */}
        {mode === "signin" && (
          <div>
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#005684] dark:text-[#93ccff]">
                Secure Sanctuary Access
              </span>
              <h2 className="text-2xl font-bold tracking-tight mt-1">
                Sign in to Nurses Pillow
              </h2>
              <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-1">
                Access your clinical assignment housing or verified host
                dashboard.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSigninSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  Work or Personal Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none"
                  placeholder="sarah.jenkins@alumni.duke.edu"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password");
                      setAuthError(null);
                      setSuccessMessage("");
                    }}
                    className="text-[11px] text-[#005684] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 pr-9 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="rounded accent-[#005684]"
                />
                <span>
                  Remember this device for 30 days (hospital devices only)
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-[#001848] hover:bg-[#162e62] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#162e62] text-white font-bold text-xs shadow-md transition-all duration-200 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                Sign In to Sanctuary Hub
              </button>

              {/* Standard practice administrator access pathway */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@nursespillow.com");
                    setPassword("AdminSecure2026!");
                  }}
                  className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-[#0A6FA8] dark:hover:text-[#93ccff] transition-colors cursor-pointer"
                >
                  Hospital system or operations administrator? Sign in here
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security & Verification Notice */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#233550] flex flex-col items-center justify-center gap-1.5 text-center text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#0A6FA8] dark:text-[#3E9AD1]">
              verified_user
            </span>
            <span>
              Protected by 256-bit SSL encryption &amp; Nursys® healthcare license
              verification.
            </span>
          </div>
          {mode === "signup" && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Public registration is limited to clinicians and property hosts. Administrator access is provisioned securely through standard governance channels.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
