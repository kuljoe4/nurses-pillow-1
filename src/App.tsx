import React, { useState, useEffect, Suspense, useCallback, useRef } from "react";
import {
  NavigationTab,
  VerificationStepId,
  VerificationFormData,
  HousingListing,
  Hospital,
  BookingRequest,
  UserRole,
} from "./types";
import {
  INITIAL_VERIFICATION_DATA,
  BLANK_VERIFICATION_DATA,
} from "./data/mockData";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ClinicalLicenseStep } from "./components/ClinicalLicenseStep";
import { IdentityStep } from "./components/IdentityStep";
import { ContactStep } from "./components/ContactStep";
import { FindHousingView } from "./components/FindHousingView";
import { stripeConnect } from "./services/stripeConnect";
import { db } from "./services/database";
import { StagingAuthGateModal } from "./components/StagingAuthGateModal";
import { Milestone2ScopeGate } from "./components/Milestone2ScopeGate";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { ScrollProgressIndicator } from "./components/ScrollProgressIndicator";
import type { AdminSheetsPreset } from "./components/GoogleSheetsSyncModal";
import { Stethoscope, Building2, ShieldAlert, ShieldCheck } from "lucide-react";
import { HostPublicProfileView } from "./components/HostPublicProfileView";
import { Toast } from "./components/ui/Toast";
import { SearchListingsSkeleton } from "./components/skeletons/SearchListingsSkeleton";
import { NurseDashboardSkeleton } from "./components/skeletons/NurseDashboardSkeleton";

// Code-split secondary views & heavy feature modules to eliminate initial bundle bloat
const SearchListingsView = React.lazy(() =>
  import("./components/SearchListingsView").then((m) => ({
    default: m.SearchListingsView,
  })),
);
const HowItWorksView = React.lazy(() =>
  import("./components/HowItWorksView").then((m) => ({
    default: m.HowItWorksView,
  })),
);
const ForHostsView = React.lazy(() =>
  import("./components/ForHostsView").then((m) => ({
    default: m.ForHostsView,
  })),
);
const VerifiedHospitalsView = React.lazy(() =>
  import("./components/VerifiedHospitalsView").then((m) => ({
    default: m.VerifiedHospitalsView,
  })),
);
const NurseDashboardView = React.lazy(() =>
  import("./components/NurseDashboardView").then((m) => ({
    default: m.NurseDashboardView,
  })),
);
const HostPortalView = React.lazy(() =>
  import("./components/HostPortalView").then((m) => ({
    default: m.HostPortalView,
  })),
);
const AdminPortalView = React.lazy(() =>
  import("./components/AdminPortalView").then((m) => ({
    default: m.AdminPortalView,
  })),
);
const PostmarkEmailVerificationView = React.lazy(() =>
  import("./components/PostmarkEmailVerificationView").then((m) => ({
    default: m.PostmarkEmailVerificationView,
  })),
);
const TwilioPhoneOtpView = React.lazy(() =>
  import("./components/TwilioPhoneOtpView").then((m) => ({
    default: m.TwilioPhoneOtpView,
  })),
);
const Phase1InventoryView = React.lazy(() =>
  import("./components/Phase1InventoryView").then((m) => ({
    default: m.Phase1InventoryView,
  })),
);
const LegalPoliciesView = React.lazy(() =>
  import("./components/LegalPoliciesView").then((m) => ({
    default: m.LegalPoliciesView,
  })),
);
const SystemStatusView = React.lazy(() =>
  import("./components/SystemStatusView").then((m) => ({
    default: m.SystemStatusView,
  })),
);
const MobileParityView = React.lazy(() =>
  import("./components/MobileParityView").then((m) => ({
    default: m.MobileParityView,
  })),
);
const MessagesView = React.lazy(() =>
  import("./components/MessagesView").then((m) => ({
    default: m.MessagesView,
  })),
);
const ExtendStayModal = React.lazy(() =>
  import("./components/ExtendStayModal").then((m) => ({
    default: m.ExtendStayModal,
  })),
);
const ReviewModal = React.lazy(() =>
  import("./components/ReviewModal").then((m) => ({
    default: m.ReviewModal,
  })),
);

// Modals lazy-loaded on demand (prevents heavy modules like Firebase from loading during initial page render)
const GoogleSheetsSyncModal = React.lazy(() =>
  import("./components/GoogleSheetsSyncModal").then((m) => ({
    default: m.GoogleSheetsSyncModal,
  })),
);
const ItemizedCheckoutModal = React.lazy(() =>
  import("./components/ItemizedCheckoutModal").then((m) => ({
    default: m.ItemizedCheckoutModal,
  })),
);
const ListingDetailModal = React.lazy(() =>
  import("./components/ListingDetailModal").then((m) => ({
    default: m.ListingDetailModal,
  })),
);
const VerificationSuccessModal = React.lazy(() =>
  import("./components/VerificationSuccessModal").then((m) => ({
    default: m.VerificationSuccessModal,
  })),
);
const NurseSupportModal = React.lazy(() =>
  import("./components/NurseSupportModal").then((m) => ({
    default: m.NurseSupportModal,
  })),
);
const SavedListingsModal = React.lazy(() =>
  import("./components/SavedListingsModal").then((m) => ({
    default: m.SavedListingsModal,
  })),
);
const AuthModal = React.lazy(() =>
  import("./components/AuthModal").then((m) => ({ default: m.AuthModal })),
);
const LogoutConfirmationModal = React.lazy(() =>
  import("./components/LogoutConfirmationModal").then((m) => ({
    default: m.LogoutConfirmationModal,
  })),
);
const BookingDetailModal = React.lazy(() =>
  import("./components/BookingDetailModal").then((m) => ({
    default: m.BookingDetailModal,
  })),
);

const ViewLoadingFallback: React.FC<{ currentTab?: string; isNightShiftMode?: boolean }> = ({ currentTab, isNightShiftMode }) => {
  if (currentTab === "search-listings") {
    return <SearchListingsSkeleton isNightShiftMode={isNightShiftMode} />;
  }
  if (currentTab === "nurse-dashboard") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 w-full">
        <NurseDashboardSkeleton isNightShiftMode={isNightShiftMode} />
      </div>
    );
  }
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-[#0A6FA8]/20 border-t-[#0A6FA8] animate-spin" />
        <span className="text-xs text-[#0B2559]/60 dark:text-[#E6ECF7]/60 font-medium">
          Loading clinical workspace...
        </span>
      </div>
    </div>
  );
};

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 bg-black/65 backdrop-blur-xs flex justify-center items-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border border-[#0A6FA8]/20 border-t-[#0A6FA8] animate-spin" />
      <span className="text-xs text-white/80 font-medium">Loading...</span>
    </div>
  </div>
);

export default function App() {
  // Staging Preview Authentication Gate (lawrence / np-preview-2026 or developer / np-dev-2026)
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [appData, setAppData] = useState<{ hospitals: Hospital[]; listings: HousingListing[] }>(
    {
      hospitals: [],
      listings: [],
    },
  );
  const [activeStates, setActiveStates] = useState<string[]>([]);

  const [isStagingAuthenticated, setIsStagingAuthenticated] = useState<boolean>(
    () => {
      return sessionStorage.getItem("np_staging_auth_lawrence") === "true";
    },
  );

  const [stagingUser, setStagingUser] = useState<"client" | "developer">(() => {
    return (
      (sessionStorage.getItem("np_staging_user") as "client" | "developer") ||
      "client"
    );
  });

  // User Authentication & Role State
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    role: UserRole;
    name: string;
    email?: string;
    isNurseVerified?: boolean;
    isHostVerified?: boolean;
    isIdVerified?: boolean;
    verificationStatus?: string;
  }>({ role: "guest", name: "Guest User" });
  const isDeveloper = stagingUser === "developer" || currentUser.role === "developer";

  // Access control feedback banner state
  const [accessNotice, setAccessNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const prevVerificationStatus = useRef<string | undefined>(currentUser.verificationStatus);

  useEffect(() => {
    if (prevVerificationStatus.current === 'pending' && currentUser.verificationStatus === 'verified') {
      setToastMessage("Congratulations! Your clinician credentials have been verified.");
    }
    prevVerificationStatus.current = currentUser.verificationStatus;
  }, [currentUser.verificationStatus]);

  // Navigation & verification step state
  const [currentTab, setCurrentTab] = useState<NavigationTab>("find-housing");
  const [publicHostId, setPublicHostId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/hosts/unique/')) {
      return path.replace('/hosts/unique/', '').trim();
    } else if (path.startsWith('/unique/hosts/')) {
      return path.replace('/unique/hosts/', '').trim();
    } else if (path.startsWith('/hosts/')) {
      return path.replace('/hosts/', '').trim();
    }
    return null;
  });

  const [publicListingId, setPublicListingId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/listings/')) {
      return path.replace('/listings/', '').trim();
    }
    return null;
  });

  const [detailListing, setDetailListing] = useState<HousingListing | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/hosts/unique/')) {
        setPublicHostId(path.replace('/hosts/unique/', '').trim());
        setPublicListingId(null);
        setDetailListing(null);
      } else if (path.startsWith('/unique/hosts/')) {
        setPublicHostId(path.replace('/unique/hosts/', '').trim());
        setPublicListingId(null);
        setDetailListing(null);
      } else if (path.startsWith('/hosts/')) {
        setPublicHostId(path.replace('/hosts/', '').trim());
        setPublicListingId(null);
        setDetailListing(null);
      } else if (path.startsWith('/listings/')) {
        setPublicListingId(path.replace('/listings/', '').trim());
        setPublicHostId(null);
      } else {
        setPublicHostId(null);
        setPublicListingId(null);
        setDetailListing(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (publicListingId && appData.listings.length > 0) {
      const found = appData.listings.find((l) => l.id === publicListingId);
      if (found) {
        setDetailListing(found);
      }
    }
  }, [publicListingId, appData.listings]);

  const [tabHistory, setTabHistory] = useState<NavigationTab[]>([]);
  const [verificationData, setVerificationData] =
    useState<VerificationFormData>(
      import.meta.env.VITE_USE_MOCK_DATA === 'true'
        ? INITIAL_VERIFICATION_DATA
        : BLANK_VERIFICATION_DATA
    );

  const [demandReports, setDemandReports] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('np_auth_token');
    if (!token || ((currentUser?.role as any) !== 'admin' && (currentUser?.role as any) !== 'super_admin')) return;
    fetch('/api/admin/demand-reports', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDemandReports(data);
        }
      })
      .catch(() => {});
  }, [currentUser?.role]);

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


  // Proactive Role-Based Access Navigation Guard
  const handleNavigateTab = useCallback(
    (tab: NavigationTab) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // 1. Technical specs & dev simulators: redirect to public marketplace
      if (tab === "phase1-inventory" || tab === "mobile-preview") {
        setTabHistory((prev) => [...prev, currentTab]);
        setCurrentTab("find-housing");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (tab === currentTab) return;

      // Block unauthenticated users from verification flow and dashboards in production
      const isProduction = import.meta.env.PROD;
      if (isProduction && currentUser.role === "guest" && (tab === "verification" || tab === "email-verification" || tab === "phone-verification" || tab === "nurse-dashboard" || tab === "host-dashboard" || tab === "admin-portal")) {
        setAuthModalMode("signin");
        setIsAuthModalOpen(true);
        return;
      }

      // Enforce role-based access for dashboards: allow authenticated dual access for both nurse & host dashboards
      if (tab === "nurse-dashboard" && currentUser.role === "guest") {
        setAuthModalMode("signin");
        setIsAuthModalOpen(true);
        return;
      }
      if (tab === "host-dashboard" && currentUser.role === "guest") {
        setAuthModalMode("signin");
        setIsAuthModalOpen(true);
        return;
      }

      // Role isolation: Standard clinicians without host privileges are guided to Host Onboarding to list their sanctuary
      const hasHostPrivileges =
        currentUser.role === "host" ||
        currentUser.role === "dual" ||
        Boolean(currentUser.isHostVerified) ||
        currentUser.role === "super_admin" ||
        isDeveloper;

      if (tab === "host-dashboard" && !hasHostPrivileges) {
        setAccessNotice({
          title: "Become a Property Host",
          message: "To access the Host Portal, list your first sanctuary below and join our verified host community.",
        });
        setTimeout(() => setAccessNotice(null), 5000);
        setTabHistory((prev) => [...prev, currentTab]);
        setCurrentTab("host-onboarding");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Pure hosts without clinician verification are guided to clinician verification
      const hasClinicianPrivileges =
        currentUser.role === "nurse" ||
        currentUser.role === "dual" ||
        Boolean(currentUser.isNurseVerified) ||
        currentUser.role === "super_admin" ||
        isDeveloper;

      if (tab === "nurse-dashboard" && !hasClinicianPrivileges) {
        setAccessNotice({
          title: "Clinician Profile Required",
          message: "The Clinician Dashboard is designed for traveling nurses and dual hosts. Complete clinician verification to manage rotations.",
        });
        setTimeout(() => setAccessNotice(null), 5000);
        setTabHistory((prev) => [...prev, currentTab]);
        setCurrentTab("verification");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (tab === "admin-portal" && currentUser.role !== "super_admin" && !isDeveloper) return;

      // Allow open navigation across all workspaces and dashboards with interactive preview
      setTabHistory((prev) => [...prev, currentTab]);
      setCurrentTab(tab);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [currentTab, currentUser, isDeveloper],
  );

  const handleGoBack = () => {
    if (currentTab === "verification" && verificationStep > 1) {
      setVerificationStep((prev) => (prev - 1) as VerificationStepId);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (
      currentTab === "email-verification" ||
      currentTab === "phone-verification"
    ) {
      handleNavigateTab("verification");
      setVerificationStep(2);
      return;
    }
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory((prev) => prev.slice(0, -1));
      setCurrentTab(prevTab);
    } else {
      setCurrentTab("find-housing");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper for per-account saved pillows persistence key
  const getSavedPillowsKey = (email?: string, id?: string) => {
    const target = email || id || localStorage.getItem("np_user_email");
    return target ? `np_saved_pillows_${target}` : "np_saved_pillows_guest";
  };

  // Helper for per-account bookings persistence key
  const getBookingsKey = (email?: string, id?: string) => {
    const target = email || id || localStorage.getItem("np_user_email");
    return target ? `np_bookings_${target}` : "np_bookings_guest";
  };

  // Saved listings state (persisted per account, zero mock defaults for real accounts)
  const [savedListingIds, setSavedListingIds] = useState<string[]>(() => {
    try {
      const rememberedEmail = localStorage.getItem("np_user_email");
      const key = rememberedEmail ? `np_saved_pillows_${rememberedEmail}` : "np_saved_pillows_guest";
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {}
    return [];
  });

  // Night shift mode state
  const [isNightShiftMode, setIsNightShiftMode] = useState<boolean>(false);

  // Modals state
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // Google Sheets integration state (Administrative Feature)
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [sheetsPreset, setSheetsPreset] =
    useState<AdminSheetsPreset>("admin-demand");

  const handleOpenGoogleSheets = (
    preset: AdminSheetsPreset = "admin-demand",
  ) => {
    setSheetsPreset(preset);
    setIsSheetsModalOpen(true);
  };

  // Auth modal state (Screens AU-01 & AU-03)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<
    "signin" | "signup" | "forgot-password" | "reset-password"
  >("signup");
  const [resetToken, setResetToken] = useState<string>("");

  // Initiate Logout confirmation dialog
  const handleInitiateLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  // Confirmed Logout handler: clears all active user sessions and resets state to Guest role
  const handleConfirmLogout = async () => {
    console.log("[Logout Flow] 1. Initiating handleConfirmLogout()");
    console.log("[Logout Flow] Initial currentUser:", currentUser);

    // 1. Clear session storage items related to user and developer sessions
    sessionStorage.removeItem("np_staging_user");
    sessionStorage.removeItem("np_user_session");
    sessionStorage.removeItem("np_user_token");
    sessionStorage.removeItem("np_active_role");
    sessionStorage.removeItem("np_active_user");
    localStorage.removeItem("np_remembered_user");
    localStorage.removeItem("np_auth_token");
    localStorage.removeItem("np_user_email");
    console.log("[Logout Flow] 2. Cleared local/session storage");

    // Clear backend auth cookie and await to prevent race conditions on re-render
    try {
      console.log("[Logout Flow] 3. Calling POST /api/auth/logout with credentials: 'include'");
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      console.log("[Logout Flow] 4. Backend responded with status:", response.status);
      const text = await response.text();
      console.log("[Logout Flow] 5. Backend response body:", text);
    } catch (error) {
      console.error("[Logout Flow] [ERROR] Failed to clear backend authentication cookie:", error);
    }

    // 2. Reset currentUser state to Guest and clear active state
    console.log("[Logout Flow] 6. Setting currentUser to Guest");
    setCurrentUser({ role: "guest", name: "Guest User" });
    setBookingRequests([]);
    setSavedListingIds([]);
    setVerificationData(BLANK_VERIFICATION_DATA);

    // 3. Reset developer staging perspective if active
    if (stagingUser === "developer") {
      setStagingUser("client");
      sessionStorage.setItem("np_staging_user", "client");
    }

    // 4. Return to default guest explore tab
    handleNavigateTab("find-housing");

    // 5. Close confirmation dialog
    setIsLogoutDialogOpen(false);
  };

  // Checkout modal state (Screen A4)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutListing, setCheckoutListing] = useState<HousingListing | null>(null);

  // Stay Extension & Review Modals
  const [extendStayBooking, setExtendStayBooking] = useState<BookingRequest | null>(null);
  const [reviewStayBooking, setReviewStayBooking] = useState<BookingRequest | null>(null);

  // Dedicated search params state (Screen A2)
  const [searchParamsState, setSearchParamsState] = useState({
    hospital: "",
    duration: "13",
    radius: 5,
    checkInDate: "",
    checkOutDate: "",
  });

  // Shared booking requests across Portals A & B (persisted per account)
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>(() => {
    try {
      const rememberedEmail = localStorage.getItem("np_user_email");
      if (rememberedEmail) {
        const key = `np_bookings_${rememberedEmail}`;
        const saved = localStorage.getItem(key);
        if (saved !== null) {
          return JSON.parse(saved);
        }
        // Real registered user with no stored bookings starts with 0 bookings
        if (!rememberedEmail.includes("demo") && rememberedEmail !== "sarah.jenkins@ucsf.edu") {
          return [];
        }
      }
    } catch {}
    return [
      {
        id: "req-1",
        listingId: "sf-dogpatch-studio",
        listingTitle: "Modern Dogpatch Studio w/ Blackout & Parking",
        clinicianName: "Sarah Jenkins",
        clinicianTitle: "BSN, RN — PICU",
        clinicianAvatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
        clinicianPhone: "+1 (919) 555-0198",
        hospitalName: "UCSF Medical Center - Mission Bay",
        unitSpecialty: "Pediatric ICU",
        startDate: "Oct 1, 2024",
        endDate: "Dec 31, 2024",
        durationWeeks: 13,
        monthlyRent: 1950,
        cleaningFee: 150,
        securityDeposit: 250,
        petFee: 0,
        travelerFee: 0,
        totalInitialCharge: 2350,
        hostNetPayout: 1852.5,
        status: "pending_host_approval",
        submittedAt: "Today, 2:15 PM",
        deadlineHoursRemaining: 22,
        specialRequests:
          "Night shift schedule: 7 PM – 7 AM. 100% quiet daytime requirement.",
      },
    ];
  });

  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser || currentUser.role === 'guest') {
      setUnreadMessagesCount(0);
      return;
    }
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      if (!token) return;
      const res = await fetch('/api/messages/threads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.threads)) {
          const totalUnread = data.threads.reduce((sum: number, t: any) => sum + (t.unreadCount || 0), 0);
          setUnreadMessagesCount(totalUnread);
        }
      }
    } catch {
      // Quietly handle transient network/cold-start states during interval polling
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const [selectedBookingDetail, setSelectedBookingDetail] = useState<BookingRequest | null>(null);
  const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);

  const handleCancelBooking = useCallback(async (bookingId: string) => {
    // 1. Update UI state optimistically
    setBookingRequests((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "declined" } : b))
    );

    // 2. Persist to localStorage
    try {
      const email = currentUser.email || localStorage.getItem("np_user_email");
      if (email) {
        const key = `np_bookings_${email}`;
        const current = JSON.parse(localStorage.getItem(key) || "[]");
        const updated = current.map((b: any) =>
          b.id === bookingId ? { ...b, status: "declined" } : b
        );
        localStorage.setItem(key, JSON.stringify(updated));
      }
    } catch {}

    // 3. Persist to backend (DB)
    try {
      const token = localStorage.getItem('np_auth_token');
      await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "declined" }),
      });
    } catch (err) {
      console.error("Failed to update booking status in DB:", err);
    }
  }, [currentUser.email]);

  const activeNurseBooking =
    currentUser.role === "nurse"
      ? bookingRequests.find((b) => b.status === "pending_host_approval" || b.status === "approved" || b.status === "active") ||
        bookingRequests[0] ||
        null
      : null;

  // Explicitly fetch and synchronize the current user's profile from the backend
  // to prevent UI from displaying stale, mocked, or placeholder user data.
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("np_auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const url = "/api/auth/me";

      const res = await fetch(url, {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
        if (data.user) {
          const user = data.user;
          setCurrentUser((prev) => {
            const next = {
              id: user.id,
              role: user.role,
              name: user.full_name || user.email,
              email: user.email,
              isNurseVerified: Boolean(user.is_nurse_verified),
              isHostVerified: Boolean(user.is_host_verified),
              isIdVerified: Boolean(user.identity_verified),
              verificationStatus: user.verification_status,
            };
            if (
              prev &&
              prev.id === next.id &&
              prev.role === next.role &&
              prev.name === next.name &&
              prev.email === next.email &&
              prev.isNurseVerified === next.isNurseVerified &&
              prev.isHostVerified === next.isHostVerified &&
              prev.isIdVerified === next.isIdVerified
            ) {
              return prev;
            }
            return next;
          });
          // Synchronize verified database state into verification workflow
          setVerificationData((prev) => {
            const prevWorkEmail = prev?.workEmail || '';
            const prevLegalFirstName = prev?.legalFirstName || '';
            const prevLegalLastName = prev?.legalLastName || '';
            const prevMobilePhone = prev?.mobilePhone || '';
            const prevLicenseStatus = prev?.licenseStatus || 'unverified';

            const workEmail = user.email || prevWorkEmail;
            const legalFirstName = (user.full_name || "").split(" ")[0] || prevLegalFirstName;
            const legalLastName = (user.full_name || "").split(" ").slice(1).join(" ") || prevLegalLastName;
            const isIdVerified = Boolean(user.identity_verified);
            const isContactVerified = Boolean(user.email_verified);
            const phoneVerified = Boolean(user.phone_verified);
            const mobilePhone = user.phone_number || prevMobilePhone;
            const licenseStatus = user.is_nurse_verified 
              ? "verified" 
              : (user.verification_status || prevLicenseStatus);

            if (
                prev &&
                prev.workEmail === workEmail &&
                prev.legalFirstName === legalFirstName &&
                prev.legalLastName === legalLastName &&
                prev.isIdVerified === isIdVerified &&
                prev.isContactVerified === isContactVerified &&
                prev.phoneVerified === phoneVerified &&
                prev.mobilePhone === mobilePhone &&
                prev.licenseStatus === licenseStatus
            ) {
                return prev;
            }
            return {
                ...prev,
                workEmail,
                legalFirstName,
                legalLastName,
                isIdVerified,
                isContactVerified,
                phoneVerified,
                mobilePhone,
                licenseStatus,
            };
          });
          if (user.email) {
            localStorage.setItem("np_user_email", user.email);
          }

          const isDemo = Boolean(user.id?.startsWith("usr_demo") || user.email === "sarah.jenkins@ucsf.edu");

          // Load user's persisted bookings
          const bookingsKey = getBookingsKey(user.email, user.id);
          const savedBookings = localStorage.getItem(bookingsKey);
          if (savedBookings !== null) {
            try {
              const parsedBookings = JSON.parse(savedBookings);
              setBookingRequests((prev) => JSON.stringify(prev) === JSON.stringify(parsedBookings) ? prev : parsedBookings);
            } catch {
              setBookingRequests((prev) => (prev && prev.length === 0) ? prev : []);
            }
          } else if (!isDemo) {
            setBookingRequests((prev) => (prev && prev.length === 0) ? prev : []);
          }

          // Load user's persisted saved pillows from localStorage & backend
          const pillowsKey = getSavedPillowsKey(user.email, user.id);
          const localPillows = localStorage.getItem(pillowsKey);
          if (localPillows !== null) {
            try {
              const parsedPillows = JSON.parse(localPillows);
              setSavedListingIds((prev) => JSON.stringify(prev) === JSON.stringify(parsedPillows) ? prev : parsedPillows);
            } catch {}
          } else if (!isDemo) {
            setSavedListingIds((prev) => (prev && prev.length === 0) ? prev : []);
          }

          // Background sync from backend favorites endpoint
          try {
            const favParams = new URLSearchParams();
            if (user.id) favParams.append("userId", user.id);
            if (user.email) favParams.append("email", user.email);
            const favRes = await fetch(`/api/auth/favorites?${favParams.toString()}`, {
              headers,
              credentials: "include",
            });
            if (favRes.ok) {
              const favData = (favRes.headers.get('content-type')?.includes('application/json') ? await favRes.json() : {});
              if (Array.isArray(favData.listingIds)) {
                setSavedListingIds((prev) => JSON.stringify(prev) === JSON.stringify(favData.listingIds) ? prev : favData.listingIds);
                localStorage.setItem(pillowsKey, JSON.stringify(favData.listingIds));
              }
            }
          } catch (favErr) {
            console.warn("Could not sync backend favorites:", favErr);
          }

          return user;
        }
      }
    } catch (err) {
      console.error("Failed to re-fetch user auth profile:", err);
    }
    return null;
  }, []);

  // Fetch live bookings from PostgreSQL DB
  const fetchLiveBookings = useCallback(
    async (targetUser?: { id?: string; role?: string; email?: string }) => {
      try {
        const token = localStorage.getItem('np_auth_token');
        if (!token) return null;

        const user = targetUser || currentUser;
        if (!user.role || user.role === 'guest') return null;

        const params = new URLSearchParams();
        if (user.id) params.append("userId", user.id);
        if (user.role) params.append("role", user.role);
        if (user.role === "host" && user.id) params.append("hostId", user.id);

        const res = await fetch(`/api/bookings?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const liveBookings = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
          if (Array.isArray(liveBookings) && liveBookings.length > 0) {
            setBookingRequests((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(liveBookings)) return prev;
              
              // Check for status changes
              liveBookings.forEach((newBooking) => {
                const oldBooking = prev.find((b) => b.id === newBooking.id);
                if (oldBooking && oldBooking.status !== newBooking.status && currentUser.role === 'nurse') {
                    setToastMessage(`Booking for ${newBooking.listingTitle} updated to ${newBooking.status}`);
                }
              });
              
              return liveBookings;
            });
            return liveBookings;
          }
        }
      } catch {
        // Quietly handle transient network failures during background polling
      }
      return null;
    },
    [currentUser?.id, currentUser?.role],
  );

  // Seamless Perspective / Role Switcher for single-account dual access
  const handleSwitchRole = useCallback(
    async (role: UserRole) => {
      // 1. If user is authenticated on a real account, preserve their real account identity
      if (currentUser?.email || currentUser?.id) {
        // Prevent unauthorized role escalation
        if (role === 'super_admin' && currentUser.role !== 'super_admin' && currentUser.role !== 'developer') {
          console.error("Unauthorized role escalation attempt");
          return;
        }

        const targetRole = role;
        setCurrentUser((prev) => ({
          ...prev,
          role: targetRole,
        }));
        sessionStorage.setItem("np_active_role", targetRole);

        if (targetRole === "host") {
          handleNavigateTab("host-dashboard");
        } else if (targetRole === "nurse") {
          handleNavigateTab("nurse-dashboard");
        } else if (targetRole === "super_admin") {
          handleNavigateTab("admin-portal");
        } else if (targetRole === "guest") {
          handleNavigateTab("find-housing");
        }
        await fetchLiveBookings({ ...currentUser, role: targetRole });
        return;
      }

      // 2. Demo/Staging sandbox perspective switching when not signed in
      if (role === "host") {
        const hostUser = {
          id: "host-sarah-m",
          role: "host" as UserRole,
          name: "Sarah M",
          email: "host-sarah@example.com",
          isHostVerified: true,
          isNurseVerified: false,
          isIdVerified: true,
        };
        setCurrentUser(hostUser);
        localStorage.setItem("np_user_email", hostUser.email);
        sessionStorage.setItem("np_active_role", "host");
        await fetchLiveBookings(hostUser);
        handleNavigateTab("host-dashboard");
      } else if (role === "nurse") {
        const nurseUser = {
          id: "usr_fc8f118f-e4a2-4622-bd12-8fb004bae4eb",
          role: "nurse" as UserRole,
          name: "Clara Barton, RN",
          email: "clara.barton.rn@travelhealth.org",
          isNurseVerified: false,
          isHostVerified: false,
          isIdVerified: true,
        };
        setCurrentUser(nurseUser);
        localStorage.setItem("np_user_email", nurseUser.email);
        sessionStorage.setItem("np_active_role", "nurse");
        await fetchLiveBookings(nurseUser);
        handleNavigateTab("nurse-dashboard");
      } else if (role === "super_admin") {
        // Prevent unauthorized staging role escalation
        return;
      } else {
        const guestUser = {
          role: "guest" as UserRole,
          name: "Guest User",
        };
        setCurrentUser(guestUser);
        sessionStorage.setItem("np_active_role", "guest");
      }
    },
    [currentUser, fetchLiveBookings],
  );

  const handleUpdateVerification = useCallback((updates: Partial<VerificationFormData>) => {
    setVerificationData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Sync active territories from PostgreSQL database
  const fetchActiveTerritories = useCallback(async () => {
    try {
      const res = await fetch('/api/territories/active');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.activeStates)) {
          setActiveStates(data.activeStates);
        }
      }
    } catch (e) {
      console.warn("Could not fetch active territories:", e);
    }
  }, []);

  // Callback triggered when an admin approves/launches a state in the admin portal
  const handleStateActivated = useCallback(async (stateCode: string, newActiveList?: string[]) => {
    if (newActiveList) {
      setActiveStates(newActiveList);
    } else {
      setActiveStates((prev) => {
        const upper = stateCode.toUpperCase();
        return prev.includes(upper) ? prev : [...prev, upper];
      });
    }

    // Immediately re-fetch live listings from PostgreSQL so newly activated properties show across all search and map views
    try {
      await db.fetchListings();
      setAppData((prev) => ({
        ...prev,
        listings: db.getListings() as unknown as HousingListing[],
      }));
      setToastMessage(`State ${stateCode.toUpperCase()} activated. Live listings synchronized!`);
    } catch (err) {
      console.error("Failed to re-sync listings after state activation:", err);
    }
  }, []);

  // Initialize Database state from PostgreSQL & load current authenticated user profile
  useEffect(() => {
    const initializeDb = async () => {
      try {
        await Promise.all([
          db.fetchHospitals(),
          db.fetchListings(),
          db.fetchAuditLogs(),
          fetchActiveTerritories(),
        ]);
        setAppData({
          hospitals: db.getHospitals() as unknown as Hospital[],
          listings: db.getListings() as unknown as HousingListing[],
        });
        setIsAppLoading(false);
        console.log("PostgreSQL schema synced into in-memory store.");
      } catch (err) {
        console.error("Failed to sync database", err);
        setIsAppLoading(false);
      }
    };
    initializeDb();
  }, [fetchActiveTerritories]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    fetchLiveBookings();
  }, [fetchLiveBookings]);

  // Background sync: Poll for booking status updates every 60 seconds
  useEffect(() => {
    if (!currentUser.id || currentUser.role === 'guest') return;

    let timeoutId: NodeJS.Timeout;
    const poll = async () => {
      try {
        await fetchLiveBookings();
      } catch (err) {
        console.error("Background sync polling failed:", err);
      }
      timeoutId = setTimeout(poll, 60000);
    };

    poll();
    return () => clearTimeout(timeoutId);
  }, [currentUser.id, currentUser.role, fetchLiveBookings]);

  // Handle email verification / confirmation query parameters in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailVerified =
      params.get("email_verified") ||
      params.get("verified") ||
      params.get("confirmed");
    if (emailVerified === "true" || emailVerified === "1") {
      fetchUserProfile().then(() => {
        handleUpdateVerification({ isContactVerified: true });
        handleNavigateTab("phone-verification");
      });
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [fetchUserProfile, handleUpdateVerification, handleNavigateTab]);

  // Handle Password Reset Links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset");
    if (token) {
      setResetToken(token);
      setAuthModalMode("reset-password");
      setIsAuthModalOpen(true);
      // Clean up the URL
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Synchronize document body class for dark/night mode
  useEffect(() => {
    if (isNightShiftMode) {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#08101C";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#faf8ff";
    }
  }, [isNightShiftMode]);

  // ⚡ Bolt Performance Optimization: Wrapped with useCallback to provide a stable reference
  // to child components like SearchListingsView and SearchListingCard that use React.memo,
  // preventing unnecessary re-renders when App.tsx re-renders.
  const handleToggleSaveListing = useCallback((id: string) => {
    setSavedListingIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      const key = getSavedPillowsKey(currentUser?.email, currentUser?.id);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (err) {
        console.error("Failed to persist saved pillows to localStorage:", err);
      }
      return next;
    });

    // Synchronize to backend favorites
    const token = localStorage.getItem("np_auth_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch("/api/auth/favorites/toggle", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        listingId: id,
        userId: currentUser?.id,
        email: currentUser?.email || localStorage.getItem("np_user_email"),
      }),
    }).catch((err) => {
      console.warn("Failed to toggle favorite on server:", err);
    });
  }, [currentUser]);

  const handleSelectHospitalFromDirectory = useCallback(() => {
    handleNavigateTab("find-housing");
  }, [handleNavigateTab]);

  const handleOpenCheckout = useCallback((listing: HousingListing) => {
    setCheckoutListing(listing);
    setIsCheckoutOpen(true);
  }, []);

  const handleConfirmCheckout = useCallback(async (booking: BookingRequest) => {
    // 1. Prevent host from booking own listing
    const listing = appData.listings.find(l => l.id === booking.listingId);
    if (listing && currentUser?.id && listing.hostId === currentUser.id) {
      alert("You cannot book your own listing.");
      return;
    }
    
    // 2. Persist booking and create Stripe payment intent via backend production endpoint
    try {
      const token = localStorage.getItem("np_auth_token");
      const res = await fetch("/api/checkout/create-booking-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          listing_id: booking.listingId,
          start_date: booking.startDate,
          end_date: booking.endDate,
          traveler_name: currentUser?.name || booking.clinicianName || "Travel Clinician",
          traveler_user_id: currentUser?.id,
          room_id: booking.roomId || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.booking && data.paymentIntentId) {
          booking.paymentIntentId = data.paymentIntentId;
        }
      }
    } catch (dbErr) {
      console.warn("Failed to persist booking in PostgreSQL DB:", dbErr);
    }

    setBookingRequests((prev) => {
      const next = [booking, ...prev.filter((b) => b.id !== booking.id)];
      const key = getBookingsKey(currentUser?.email, currentUser?.id);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
    setIsCheckoutOpen(false);
    handleNavigateTab("nurse-dashboard");
  }, [currentUser]);

  const handleApproveBooking = useCallback(async (id: string) => {
    const booking = bookingRequests.find((b) => b.id === id);
    if (!booking) return;

    try {
      // 1. Diagnostic Check: Verify PaymentIntent exists
      if (booking.paymentIntentId) {
        try {
          const statusCheck = await stripeConnect.checkPaymentIntent(booking.paymentIntentId);
          if (statusCheck && statusCheck.status === 'not_found') {
            console.warn('[Booking Approval] PaymentIntent status not found, attempting direct capture fallback');
          }
        } catch (checkErr) {
          console.warn('[Booking Approval] Status check notice:', checkErr);
        }

        // 2. Capture payment (non-custodial direct charge settlement with 5% platform split)
        await stripeConnect.capturePaymentIntent(booking.paymentIntentId);
      }

      // 3. Update DB
      let dbUpdated = false;
      try {
        const res = await fetch(`/api/bookings/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved" }),
        });
        if (res.ok) {
          dbUpdated = true;
        } else {
          // Attempt accept route
          const altRes = await fetch(`/api/bookings/${id}/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (altRes.ok) dbUpdated = true;
        }
      } catch (dbErr) {
        console.warn('[Booking Approval] Server status update note:', dbErr);
      }

      // 4. Update UI state optimistically and reliably
      setBookingRequests((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, status: "approved" as const } : b));
        const key = getBookingsKey(currentUser?.email, currentUser?.id);
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });

      setAccessNotice({
        title: "Booking Accepted",
        message: "Sanctuary booking confirmed! Pre-authorization payment hold captured directly to host account (5% platform fee split applied).",
      });
      setTimeout(() => setAccessNotice(null), 5000);
      
    } catch (error: any) {
      console.error(`Failed to approve booking [ID: ${id}]:`, error);
      let errorMessage = "Failed to accept booking. Please try again or check your connection.";
      if (error.message && error.message.includes("payment")) {
        errorMessage = "Payment capture failed: " + error.message;
      }

      setAccessNotice({
        title: "Booking Error",
        message: errorMessage
      });
      setTimeout(() => setAccessNotice(null), 5000);
    }
  }, [bookingRequests, currentUser]);

  const handleDeclineBooking = useCallback(async (id: string) => {
    const booking = bookingRequests.find((b) => b.id === id);
    if (booking?.paymentIntentId) {
      try {
        await stripeConnect.cancelPaymentIntent(booking.paymentIntentId);
      } catch (error) {
        console.warn("Payment intent cancellation note:", error);
      }
    }

    // Persist status update in live PostgreSQL database
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined" }),
      });
      if (!res.ok) {
        await fetch(`/api/bookings/${id}/decline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (err) {
      console.warn("Failed to update booking status in DB:", err);
    }

    setBookingRequests((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, status: "declined" as const } : b));
      const key = getBookingsKey(currentUser?.email, currentUser?.id);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });

    setAccessNotice({
      title: "Booking Declined",
      message: "Booking request declined. Pre-authorization hold on clinician card was successfully released ($0 traveler fee).",
    });
    setTimeout(() => setAccessNotice(null), 5000);
  }, [currentUser, bookingRequests]);

  const handleAuthenticated = useCallback(
    async (
      role: UserRole,
      name: string,
      email?: string,
      id?: string,
      isNurseVerified?: boolean,
      isHostVerified?: boolean,
      isIdVerified?: boolean,
      skipAutoNavigate?: boolean
    ) => {
      // 1. Optimistic immediate state update to keep UI responsive
      setCurrentUser({
        role,
        name,
        email,
        id,
        isNurseVerified,
        isHostVerified,
        isIdVerified,
      });

      if (email) {
        localStorage.setItem("np_user_email", email);
        setVerificationData((prev) => ({
          ...prev,
          workEmail: email,
          legalFirstName: name.split(" ")[0] || prev.legalFirstName,
          legalLastName: name.split(" ").slice(1).join(" ") || prev.legalLastName,
          isContactVerified: Boolean(isNurseVerified || prev.isContactVerified),
          isIdVerified: Boolean(isIdVerified || prev.isIdVerified),
          licenseStatus: isNurseVerified ? "verified" : prev.licenseStatus,
        }));
      }

      // Clear static mock bookings for newly registered user so dashboard starts clean
      if (id && !id.startsWith("usr_demo")) {
        setBookingRequests([]);
      }

      // 2. Explicitly trigger a re-fetch of the current user's profile from the backend
      // to guarantee no stale, mocked, or placeholder user data persists in the UI
      const freshUser = await fetchUserProfile();

      if (skipAutoNavigate) {
        return;
      }

      const effectiveRole = freshUser?.role || role;
      if (effectiveRole === "host") {
        setCurrentTab("host-dashboard");
      } else if (effectiveRole === "super_admin") {
        setCurrentTab("admin-portal");
      } else if (effectiveRole === "developer") {
        setCurrentUser((prev) => ({
          ...prev,
          role: "super_admin",
          name: "Operations Administrator",
        }));
        handleNavigateTab("admin-portal");
      } else if (effectiveRole === "guest") {
        handleNavigateTab("find-housing");
      } else {
        handleNavigateTab("find-housing");
      }
    },
    [fetchUserProfile, handleNavigateTab]
  );

  if (publicHostId) {
    return (
      <HostPublicProfileView
        hostId={publicHostId}
        isNightShiftMode={isNightShiftMode}
        onClose={() => {
          setPublicHostId(null);
          window.history.pushState({}, document.title, "/");
        }}
        onSelectListing={(listing) => {
          setPublicHostId(null);
          window.history.pushState({}, document.title, "/");
          setDetailListing(listing);
        }}
        savedListingIds={savedListingIds}
        onToggleSave={handleToggleSaveListing}
        selectedHospital={searchParamsState.hospital || 'Duke University Hospital'}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isNightShiftMode
          ? "bg-[#08101C] text-[#E6ECF7]"
          : "bg-[#faf8ff] text-[#001848]"
      }`}
    >
      {/* Staging Auth Modal Gate */}
      <StagingAuthGateModal
        isOpen={!isStagingAuthenticated}
        onAuthenticated={(userType) => {
          setIsStagingAuthenticated(true);
          setStagingUser(userType);
          if (userType === "developer") {
            setCurrentUser({
              role: "super_admin",
              name: "Operations Administrator",
            });
          } else {
            setCurrentUser({ role: "nurse", name: "Sarah Jenkins, RN" });
          }
        }}
        isNightShiftMode={isNightShiftMode}
      />

      {/* Sticky Navigation Header */}
      <Header
        topBanner={
          accessNotice ? (
            <div className="w-full bg-[#F1CF78] text-[#0B2559] px-4 py-2 text-center text-xs font-bold">
              {accessNotice.title}: {accessNotice.message}
            </div>
          ) : currentUser.role === "nurse" && activeNurseBooking ? (
            <div className="bg-[#FBF0D6] dark:bg-[#20190d] border-b border-[#B9822E]/25 text-[#0B2559] dark:text-[#FBF0D6] px-3 sm:px-6 py-2 text-xs transition-colors">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        activeNurseBooking.status === "approved" || activeNurseBooking.status === "active"
                          ? "#2F6E5E"
                          : activeNurseBooking.status === "declined"
                          ? "#A8452E"
                          : "#B9822E",
                    }}
                  />
                  <span className="font-medium truncate">
                    {activeNurseBooking.status === "approved" || activeNurseBooking.status === "active"
                      ? "Confirmed Sanctuary: "
                      : "Pending Request: "}
                    <strong className="font-bold text-[#0B2559] dark:text-white">
                      {activeNurseBooking.listingTitle}
                    </strong>
                  </span>
                  <span className="hidden md:inline text-gray-400 dark:text-gray-500">•</span>
                  <span
                    className="hidden md:inline font-semibold"
                    style={{
                      color:
                        activeNurseBooking.status === "approved" || activeNurseBooking.status === "active"
                          ? "#2F6E5E"
                          : activeNurseBooking.status === "declined"
                          ? "#A8452E"
                          : "#B9822E",
                    }}
                  >
                    Status: {activeNurseBooking.status === "approved" || activeNurseBooking.status === "active" ? "Accepted & Secured" : "Awaiting Host Response"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookingDetail(activeNurseBooking);
                    setIsBookingDetailOpen(true);
                  }}
                  className="shrink-0 px-3 py-1 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                >
                  View request details
                </button>
              </div>
            </div>
          ) : undefined
        }
        currentTab={currentTab}
        currentUser={currentUser}
        onSelectTab={handleNavigateTab}
        savedCount={savedListingIds.length}
        onOpenSaved={() => setIsSavedOpen(true)}
        isNightShiftMode={isNightShiftMode}
        onToggleNightShift={() => setIsNightShiftMode(!isNightShiftMode)}
        onOpenSupport={() => setIsSupportOpen(true)}
        isVerified={verificationData.licenseStatus === "verified"}
        verificationStatus={verificationData.licenseStatus}
        onOpenAuth={(mode = "signup") => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleInitiateLogout}
        activeBooking={activeNurseBooking}
        onSwitchRole={handleSwitchRole}
        isNurseVerified={!!currentUser.isNurseVerified}
        isHostVerified={!!currentUser.isHostVerified}
        onOpenBookingDetail={(b) => {
          setSelectedBookingDetail(b);
          setIsBookingDetailOpen(true);
        }}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Main Content Area - Seamlessly flush against sticky header */}
      <main className="w-full flex-1 flex flex-col">
        {/* Breadcrumb Navigation Trail */}
        <Breadcrumbs
          currentTab={currentTab}
          onSelectTab={handleNavigateTab}
          isNightShiftMode={isNightShiftMode}
          verificationStep={verificationStep}
          onSelectVerificationStep={(step) => {
            setVerificationStep(step);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          searchHospital={
            currentTab === "search-listings"
              ? searchParamsState.hospital
              : undefined
          }
          currentUserRole={currentUser.role}
          showScreenCodes={false}
          onGoBack={handleGoBack}
          canGoBack={tabHistory.length > 0 || currentTab !== "find-housing"}
        />
        <Suspense fallback={<ViewLoadingFallback currentTab={currentTab} isNightShiftMode={isNightShiftMode} />}>
          {/* Clinician Dashboard & Trust Profile: Accessible to authenticated clinicians & dual-role users */}
          {currentTab === "nurse-dashboard" &&
            (currentUser.role !== "guest" ? (
              <NurseDashboardView
                isNightShiftMode={isNightShiftMode}
                isVerified={currentUser.isNurseVerified || verificationData.licenseStatus === "verified"}
                onGoToVerification={() => {
                  handleNavigateTab("verification");
                  setVerificationStep(3);
                }}
                onGoToHousing={() => handleNavigateTab("find-housing")}
                onOpenSupport={() => setIsSupportOpen(true)}
                onGoToHostPortal={() => handleNavigateTab("host-dashboard")}
                onStartHostOnboarding={() => handleNavigateTab("host-onboarding")}
                onOpenExtendStay={(b) => setExtendStayBooking(b)}
                onOpenReview={(b) => setReviewStayBooking(b)}
                onOpenMessages={() => handleNavigateTab("messages")}
                savedListingIds={savedListingIds}
                onToggleSave={handleToggleSaveListing}
                allListings={appData.listings}
                activeBookings={bookingRequests}
                currentUser={currentUser}
                verificationData={verificationData}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#07101e]">
                <div className="max-w-md w-full bg-white dark:bg-[#0B1626] rounded-3xl p-8 border border-[rgba(11,37,89,0.1)] dark:border-[#233550] shadow-md text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-400 mx-auto flex items-center justify-center">
                    <Stethoscope className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      Clinician Workspace
                    </span>
                    <h2 className="text-xl font-bold text-[#001848] dark:text-white">
                      Traveling Clinician Access Required
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Please sign in with your account to view your clinician rotation bookings, verification status, and housing.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode("signin");
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-full bg-[#001848] text-white text-xs font-bold hover:bg-[#162e62] cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigateTab("find-housing")}
                      className="w-full py-2 px-4 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Explore Stays
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* Host Portal & Sanctuary Dashboard: Accessible to authenticated hosts & dual-role users */}
          {(currentTab === "host-dashboard" || currentTab === "host-onboarding") &&
            (currentUser.role !== "guest" ? (
              <HostPortalView
                isNightShiftMode={isNightShiftMode}
                bookingRequests={bookingRequests}
                onApproveBooking={handleApproveBooking}
                onDeclineBooking={handleDeclineBooking}
                onGoToHousing={() => handleNavigateTab("find-housing")}
                onOpenMessages={() => handleNavigateTab("messages")}
                initialTab={currentTab === "host-onboarding" ? "onboarding" : "dashboard"}
                isNurseVerified={currentUser.isNurseVerified || currentUser.role === "nurse" || currentUser.role === "dual" || verificationData.licenseStatus === "verified"}
                verificationStatus={verificationData.licenseStatus}
                onGoToClinicianDashboard={() => handleNavigateTab("nurse-dashboard")}
                onStartClinicianVerification={() => {
                  handleNavigateTab("verification");
                  setVerificationStep(1);
                }}
                currentUser={currentUser}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#07101e]">
                <div className="max-w-md w-full bg-white dark:bg-[#0B1626] rounded-3xl p-8 border border-[rgba(11,37,89,0.1)] dark:border-[#233550] shadow-md text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-700 dark:text-blue-400 mx-auto flex items-center justify-center">
                    <Building2 className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      Property Host Portal
                    </span>
                    <h2 className="text-xl font-bold text-[#001848] dark:text-white">
                      Host Sanctuary Account Required
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Please sign in with your property host account or review our host onboarding standards.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode("signin");
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-full bg-[#005684] text-white text-xs font-bold hover:bg-[#00476d] cursor-pointer"
                    >
                      Sign In as Property Host
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigateTab("find-housing")}
                      className="w-full py-2 px-4 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Explore Stays
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* In-App Direct Messages View: Dedicated tab for Clinicians & Hosts */}
          {currentTab === "messages" && (
            <MessagesView
              isNightShiftMode={isNightShiftMode}
              currentUser={currentUser}
              onOpenSupport={() => setIsSupportOpen(true)}
            />
          )}

          {/* Operations Hub (Admin): Restricted to super_admin */}
          {currentTab === "admin-portal" &&
            (currentUser.role === "super_admin" ? (
              <AdminPortalView
                currentUser={currentUser}
                isNightShiftMode={isNightShiftMode}
                onOpenGoogleSheets={handleOpenGoogleSheets}
                bookingRequests={bookingRequests}
                listings={appData.listings}
                isDeveloper={false}
                onStateActivated={handleStateActivated}
                activeStates={activeStates}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#07101e]">
                <div className="max-w-md w-full bg-white dark:bg-[#0B1626] rounded-3xl p-8 border border-[rgba(11,37,89,0.1)] dark:border-[#233550] shadow-md text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                    <ShieldAlert className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Restricted Operations
                    </span>
                    <h2 className="text-xl font-bold text-[#001848] dark:text-white">
                      Administrator Access Required
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Access to the Operations Hub is restricted to verified administrators via credential authentication.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    {currentUser.role === "guest" && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode("signin");
                          setIsAuthModalOpen(true);
                        }}
                        className="w-full py-2.5 px-4 rounded-full bg-[#001848] dark:bg-[#005684] text-white text-xs font-bold hover:bg-[#162e62] cursor-pointer"
                      >
                        Administrator Sign In
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateTab(
                          currentUser.role === "host"
                            ? "host-dashboard"
                            : currentUser.role === "nurse"
                            ? "nurse-dashboard"
                            : "find-housing",
                        )
                      }
                      className="w-full py-2 px-4 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      Return to My Workspace
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* Portal A: Credentialing Flow View */}
          {currentTab === "verification" && (
            currentUser.role !== "guest" ? (
              currentUser.role === "host" ? (
                <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#07101e]">
                  <div className="max-w-md w-full bg-white dark:bg-[#0B1626] rounded-3xl p-8 border border-[rgba(11,37,89,0.1)] dark:border-[#233550] shadow-md text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-700 dark:text-blue-400 mx-auto flex items-center justify-center">
                      <Building2 className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        Property Host Safety Verification
                      </span>
                      <h2 className="text-xl font-bold text-[#001848] dark:text-white">
                        Host Verification in Sanctuary Portal
                      </h2>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Property host identity and address verification is integrated directly into your Host Sanctuary Dashboard via Stripe Identity &amp; payout setup.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleNavigateTab("host-dashboard")}
                        className="w-full py-2.5 px-4 rounded-full bg-[#005684] text-white text-xs font-bold hover:bg-[#00476d] cursor-pointer"
                      >
                        Go to Host Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigateTab("for-hosts")}
                        className="w-full py-2 px-4 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        View Host Standards
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {verificationStep === 1 && (
                    <IdentityStep
                      data={verificationData}
                      onChange={handleUpdateVerification}
                      onNextStep={() => setVerificationStep(2)}
                      onSelectStep={(step) => setVerificationStep(step)}
                      isNightShiftMode={isNightShiftMode}
                      onOpenAuth={(mode) => {
                        setAuthModalMode(mode || "signup");
                        setIsAuthModalOpen(true);
                      }}
                      isHostVerified={currentUser.isHostVerified}
                      onExit={() => handleNavigateTab(currentUser.role === 'host' ? 'host-dashboard' : 'find-housing')}
                    />
                  )}
                  {verificationStep === 2 && (
                    <ContactStep
                      data={verificationData}
                      onChange={handleUpdateVerification}
                      onNextStep={() => setVerificationStep(3)}
                      onSelectStep={(step) => setVerificationStep(step)}
                      isNightShiftMode={isNightShiftMode}
                      onOpenPostmarkEmail={() =>
                        handleNavigateTab("email-verification")
                      }
                      onOpenTwilioOtp={() => handleNavigateTab("phone-verification")}
                    />
                  )}
                  {verificationStep === 3 && (
                    <ClinicalLicenseStep
                      data={verificationData}
                      onChange={handleUpdateVerification}
                      onNextStep={() => {}}
                      onSelectStep={(step) => setVerificationStep(step)}
                      isNightShiftMode={isNightShiftMode}
                      onOpenSuccessModal={() => setIsSuccessModalOpen(true)}
                    />
                  )}
                </>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#07101e]">
                <div className="max-w-md w-full bg-white dark:bg-[#0B1626] rounded-3xl p-8 border border-[rgba(11,37,89,0.1)] dark:border-[#233550] shadow-md text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-400 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      Clinician Credentialing
                    </span>
                    <h2 className="text-xl font-bold text-[#001848] dark:text-white">
                      Sign In to Verify Clinical License
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Primary source license verification is reserved for registered traveling nurses and healthcare professionals. Sign in or create an account to verify.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode("signin");
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-full bg-[#001848] dark:bg-[#0A6FA8] text-white text-xs font-bold hover:bg-[#162e62] cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode("signup");
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full py-2 px-4 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Create Clinician Account
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Portal A: Home Page with Featured Sanctuary Listings (Screen A1) */}
          {currentTab === "find-housing" && (
            <FindHousingView
              isNightShiftMode={isNightShiftMode}
              savedListingIds={savedListingIds}
              onToggleSave={handleToggleSaveListing}
              isVerified={verificationData.licenseStatus === "verified"}
              onGoToVerification={() => {
                handleNavigateTab("verification");
                setVerificationStep(3);
              }}
              onGoToEmailVerification={() => {
                handleNavigateTab("email-verification");
              }}
              onGoToPhoneVerification={() => {
                handleNavigateTab("phone-verification");
              }}
              onRequestToBookListing={handleOpenCheckout}
              onGoToSearchListings={(params) => {
                if (params) {
                  setSearchParamsState((prev) => ({
                    hospital: params.hospital || prev.hospital,
                    duration: params.duration || prev.duration,
                    radius: params.radius ?? prev.radius,
                    checkInDate: params.checkInDate || prev.checkInDate,
                    checkOutDate: params.checkOutDate || prev.checkOutDate,
                  }));
                }
                handleNavigateTab("search-listings");
                if (params && params.checkInDate && params.checkOutDate) {
                  const url = new URL(window.location.href);
                  url.searchParams.set("checkInDate", params.checkInDate);
                  url.searchParams.set("checkOutDate", params.checkOutDate);
                  window.history.pushState({}, "", url);
                }
              }}
              onGoToHostPortal={() => handleNavigateTab("host-dashboard")}
              userRole={currentUser.role}
              userName={currentUser.name}
              activeStates={activeStates}
            />
          )}

          {/* Portal A: Dedicated Search Listings & Interactive Map (Screen A2) */}
          {currentTab === "search-listings" && (
            <SearchListingsView
              isNightShiftMode={isNightShiftMode}
              savedListingIds={savedListingIds}
              onToggleSave={handleToggleSaveListing}
              isVerified={verificationData.licenseStatus === "verified"}
              onGoToVerification={() => {
                handleNavigateTab("verification");
                setVerificationStep(3);
              }}
              onRequestToBookListing={handleOpenCheckout}
              initialHospital={searchParamsState.hospital}
              initialDuration={searchParamsState.duration}
              initialRadius={searchParamsState.radius}
              initialCheckInDate={searchParamsState.checkInDate}
              initialCheckOutDate={searchParamsState.checkOutDate}
            />
          )}

          {/* Postmark Institutional Email Verification Step View */}
          {currentTab === "email-verification" && (
            <PostmarkEmailVerificationView
              isNightShiftMode={isNightShiftMode}
              initialEmail={verificationData.workEmail}
              onEmailVerified={async () => {
                await fetchUserProfile();
              }}
              onProceedToPhoneVerification={async () => {
                await fetchUserProfile();
                handleUpdateVerification({ isContactVerified: true });
                handleNavigateTab("phone-verification");
              }}
              onProceedToLicenseVerification={async () => {
                await fetchUserProfile();
                handleUpdateVerification({ isContactVerified: true });
                handleNavigateTab("verification");
                setVerificationStep(3);
              }}
              onBackToOverview={() => {
                handleNavigateTab("verification");
                setVerificationStep(2);
              }}
            />
          )}

          {/* Twilio SMS OTP Mobile Verification Step View */}
          {currentTab === "phone-verification" && (
            <TwilioPhoneOtpView
              isNightShiftMode={isNightShiftMode}
              initialPhone={verificationData.mobilePhone}
              onProceedToLicenseVerification={() => {
                handleUpdateVerification({ phoneVerified: true });
                handleNavigateTab("verification");
                setVerificationStep(3);
              }}
              onBackToEmail={() => {
                handleNavigateTab("email-verification");
              }}
            />
          )}

          {/* How It Works View */}
          {currentTab === "how-it-works" && (
            <HowItWorksView
              isNightShiftMode={isNightShiftMode}
              onGoToVerification={() => {
                handleNavigateTab("verification");
                setVerificationStep(3);
              }}
              onGoToHousing={() => handleNavigateTab("find-housing")}
            />
          )}

          {/* For Hosts View */}
          {currentTab === "for-hosts" && (
            <ForHostsView
              isNightShiftMode={isNightShiftMode}
              onGoToHousing={() => handleNavigateTab("find-housing")}
              onGoToHostPortal={() => handleNavigateTab("host-dashboard")}
            />
          )}

          {/* Verified Hospitals Directory View */}
          {currentTab === "verified-hospitals" && (
            <VerifiedHospitalsView
              isNightShiftMode={isNightShiftMode}
              onSelectHospital={handleSelectHospitalFromDirectory}
            />
          )}

          {/* Public & Legal Sanctuaries */}
          {currentTab === "legal-policies" && (
            <LegalPoliciesView
              isNightShiftMode={isNightShiftMode}
              onNavigateHome={() => {
                handleNavigateTab("find-housing");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}

          {/* System Error & Maintenance States */}
          {currentTab === "system-status" && (
            <SystemStatusView
              isNightShiftMode={isNightShiftMode}
              onNavigateHome={() => {
                handleNavigateTab("find-housing");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onOpenSupport={() => setIsSupportOpen(true)}
              isDeveloper={false}
            />
          )}
        </Suspense>

        {/* Subtle, vanishing scroll-progress indicator for long-form views */}
        <ScrollProgressIndicator
          isNightShiftMode={isNightShiftMode}
          currentTab={currentTab}
        />
      </main>

      {/* Global Footer */}
      <Footer
        isNightShiftMode={isNightShiftMode}
        onOpenSupport={() => setIsSupportOpen(true)}
        onSelectTab={handleNavigateTab}
        isDeveloper={isDeveloper}
        activeStates={activeStates}
        currentTab={currentTab}
        userRole={currentUser.role}
      />

      {/* Itemized Checkout Modal (Screen A4) - Lazy loaded only when requested */}
      {isCheckoutOpen && checkoutListing && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ItemizedCheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            listing={checkoutListing}
            isNightShiftMode={isNightShiftMode}
            onBookingSubmitted={handleConfirmCheckout}
            currentUser={currentUser}
            verificationData={verificationData}
            onGoToVerification={() => {
              handleNavigateTab("verification");
              setIsCheckoutOpen(false);
            }}
            onSwitchRole={handleSwitchRole}
            onSetupClinician={() => {
              setCurrentUser(prev => ({
                ...prev,
                role: "nurse" as UserRole,
                isNurseVerified: false,
              }));
              sessionStorage.setItem("np_active_role", "nurse");
              setVerificationStep(1);
              handleNavigateTab("verification");
              setIsCheckoutOpen(false);
            }}
            checkInDate={searchParamsState.checkInDate || '2026-10-01'}
            checkOutDate={searchParamsState.checkOutDate || '2026-12-31'}
          />
        </Suspense>
      )}

      {/* Safe Clinical Onboarding & Sign-In Modal (Screens AU-01 & AU-03) */}
      {isAuthModalOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <AuthModal
            isOpen={isAuthModalOpen}
            initialMode={authModalMode}
            initialResetToken={resetToken}
            onClose={() => setIsAuthModalOpen(false)}
            isNightShiftMode={isNightShiftMode}
            onAuthenticated={handleAuthenticated}
            onOpenEmailVerification={(email) => {
              if (email) {
                localStorage.setItem("np_user_email", email);
                setVerificationData((prev) => ({ ...prev, workEmail: email }));
              }
              handleNavigateTab("email-verification");
            }}
          />
        </Suspense>
      )}

      {/* Celebration / Success Modal */}
      {isSuccessModalOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <VerificationSuccessModal
            isOpen={isSuccessModalOpen}
            onClose={() => setIsSuccessModalOpen(false)}
            data={verificationData}
            onGoToHousing={() => {
              setIsSuccessModalOpen(false);
              handleNavigateTab("find-housing");
            }}
            isNightShiftMode={isNightShiftMode}
          />
        </Suspense>
      )}

      {/* 24/7 Support Modal */}
      {isSupportOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <NurseSupportModal
            isOpen={isSupportOpen}
            onClose={() => setIsSupportOpen(false)}
            isNightShiftMode={isNightShiftMode}
          />
        </Suspense>
      )}

      {/* Saved Housing Sanctuaries Modal */}
      {isSavedOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <SavedListingsModal
            isOpen={isSavedOpen}
            onClose={() => setIsSavedOpen(false)}
            savedListingIds={savedListingIds}
            allListings={appData.listings}
            onToggleSave={handleToggleSaveListing}
            onSelectListing={() => {
              handleNavigateTab("find-housing");
            }}
            isNightShiftMode={isNightShiftMode}
            onGoToHousing={() => {
              handleNavigateTab("find-housing");
            }}
          />
        </Suspense>
      )}

      {/* Google Sheets Live Integration & Tax/Payout Sync Modal (Admin Tool) */}
      {isSheetsModalOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <GoogleSheetsSyncModal
            isOpen={isSheetsModalOpen}
            onClose={() => setIsSheetsModalOpen(false)}
            isNightShiftMode={isNightShiftMode}
            initialPreset={sheetsPreset}
            bookingRequests={bookingRequests}
            listings={appData.listings}
            demandReports={demandReports}
            licenseReviews={[]}
            userRole={currentUser.role}
          />
        </Suspense>
      )}

      {/* Logout Confirmation Dialog (Clears user sessions & resets to Guest) */}
      {isLogoutDialogOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LogoutConfirmationModal
            isOpen={isLogoutDialogOpen}
            onClose={() => setIsLogoutDialogOpen(false)}
            onConfirmLogout={handleConfirmLogout}
            currentUser={currentUser}
            isNightShiftMode={isNightShiftMode}
          />
        </Suspense>
      )}

      {/* Booking Detail Modal (NB-05 / NB-06) */}
      {isBookingDetailOpen && selectedBookingDetail && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <BookingDetailModal
            isOpen={isBookingDetailOpen}
            onClose={() => setIsBookingDetailOpen(false)}
            booking={selectedBookingDetail}
            listing={appData.listings.find((l) => l.id === selectedBookingDetail.listingId)}
            isNightShiftMode={isNightShiftMode}
            onCancelBooking={handleCancelBooking}
            onGoToHousing={() => {
              setIsBookingDetailOpen(false);
              handleNavigateTab("find-housing");
            }}
            onOpenHostProfile={(hostId) => {
              setIsBookingDetailOpen(false);
              setDetailListing(null);
              setPublicListingId(null);
              setPublicHostId(hostId);
              window.history.pushState({}, document.title, `${window.location.origin}/hosts/unique/${hostId}`);
            }}
          />
        </Suspense>
      )}

      {/* Listing Detail Modal (Mirrored view for /listings/:listingId URLs) */}
      {detailListing && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ListingDetailModal
            listing={detailListing}
            onClose={() => {
              setDetailListing(null);
              setPublicListingId(null);
              window.history.pushState({}, document.title, "/");
            }}
            isNightShiftMode={isNightShiftMode}
            isSaved={savedListingIds.includes(detailListing.id)}
            onToggleSave={handleToggleSaveListing}
            isVerified={verificationData.licenseStatus === "verified"}
            onGoToVerification={() => {
              setDetailListing(null);
              handleNavigateTab("verification");
              setVerificationStep(3);
            }}
            onRequestToBook={(listing) => {
              setDetailListing(null);
              setCheckoutListing(listing);
              setIsCheckoutOpen(true);
            }}
            selectedHospital={searchParamsState.hospital || "Duke University Hospital"}
            onOpenHostProfile={(hostId) => {
              setDetailListing(null);
              setPublicListingId(null);
              setPublicHostId(hostId);
              window.history.pushState({}, document.title, `${window.location.origin}/hosts/unique/${hostId}`);
            }}
          />
        </Suspense>
      )}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
