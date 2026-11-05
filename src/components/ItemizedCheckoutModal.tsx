import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HousingListing, BookingRequest } from '../types';
import { stripeConnect, STRIPE_SANDBOX_CONFIG, STRIPE_TEST_CARDS, StripeSplitTransaction } from '../services/stripeConnect';
import { CancellationRefundEngine, CancellationTier } from '../services/cancellationEngine';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { calculateStayPricing } from '../lib/utils/pricing';

interface ItemizedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: HousingListing;
  isNightShiftMode: boolean;
  onBookingSubmitted: (booking: BookingRequest) => void;
  currentUser?: {
    id?: string;
    role: string;
    name: string;
    email?: string;
  };
  verificationData?: any;
  onGoToVerification?: () => void;
  onSwitchRole?: (role?: any) => void | Promise<void>;
  onSetupClinician?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  checkInDate: string;
  checkOutDate: string;
}

export const ItemizedCheckoutModal: React.FC<ItemizedCheckoutModalProps> = ({
  isOpen,
  onClose,
  listing,
  isNightShiftMode,
  onBookingSubmitted,
  currentUser,
  verificationData,
  onGoToVerification,
  onOpenAuth,
  checkInDate,
  checkOutDate,
}) => {
  useBodyScrollLock(isOpen);

  const [agreedToPolicy, setAgreedToPolicy] = useState(true);
  const [specialNote, setSpecialNote] = useState('');
  const [selectedTestCard, setSelectedTestCard] = useState(STRIPE_TEST_CARDS[0]);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('883');
  const [cardZip, setCardZip] = useState('27710');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRequest | null>(null);
  const [lastPaymentIntentId, setLastPaymentIntentId] = useState<string | null>(null);
  const [showCancellationDetails, setShowCancellationDetails] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedExtraOptions, setSelectedExtraOptions] = useState<Record<string, boolean>>({});
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const [platformFeePercent, setPlatformFeePercent] = useState<number>(5);
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch('/api/platform/fee')
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('Fee settings unavailable')))
      .then((data) => {
        if (active && Number.isFinite(Number(data.hostFeePercent))) {
          setPlatformFeePercent(Number(data.hostFeePercent));
          stripeConnect.setGlobalPlatformFeePercent(Number(data.hostFeePercent));
        }
      })
      .catch((err) => console.warn('[Checkout] Using launch commission default:', err));
    return () => { active = false; };
  }, [isOpen]);

  // Selected policy tier (defaulting to flexible_30d)
  const cancellationTier: CancellationTier = (listing as any).cancellationTier || 'flexible_30d';
  const tierDetails = CancellationRefundEngine.getTierDetails(cancellationTier);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const monthlyRent = listing.monthlyRate || 1950;

  // Calculate Stay Pricing
  const { daysCount, accommodationTotal, dailyRate } = calculateStayPricing(monthlyRent, checkInDate, checkOutDate);

  // Strict Platform-Wide Policy: Zero Security Deposit Holds for Clinicians
  const securityDeposit = 0;
  const cleaningFee = 150;
  const petFee = listing.petFee || 0;
  const parkingFee = listing.parkingFee || 0;

  const extraOptionsFee = (listing.extraOptions || []).reduce((acc, opt) => {
    return acc + (selectedExtraOptions[opt.name] ? Number(opt.price) : 0);
  }, 0);

  const travelerFee = 0;
  // Upfront charge includes prorated accommodation, cleaning fee, and pet fee minus any promo discount.
  const baseSubtotal = accommodationTotal + cleaningFee + petFee + parkingFee + extraOptionsFee + travelerFee;
  const promoDiscount = appliedPromo ? appliedPromo.discountAmount : 0;
  const totalInitialCharge = Math.max(0, baseSubtotal - promoDiscount);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim() || isValidatingPromo) return;
    setIsValidatingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch('/api/checkout/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCodeInput.trim(), subtotal: baseSubtotal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedPromo({ code: data.code, discountAmount: data.discountAmount });
        setPromoError(null);
      } else {
        setPromoError(data.error || 'Invalid or expired promo code');
        setAppliedPromo(null);
      }
    } catch {
      setPromoError('Network error checking promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // The server-persisted platform rate is the source of truth for this booking.
  const finalFeeRate = platformFeePercent / 100;

  // Verification Checkpoint lock
  const isIdentityVerified = verificationData?.isIdVerified === true || verificationData?.isIdentityVerified === true || (currentUser as any)?.isIdVerified === true;
  const isContactAndPhoneVerified = (verificationData?.phoneVerified === true && verificationData?.isContactVerified === true) || (currentUser as any)?.phoneVerified === true;
  const isLicenseVerified = verificationData?.licenseStatus === 'verified' || verificationData?.licenseStatus === 'pending_review' || (currentUser as any)?.isNurseVerified === true || currentUser?.role === 'nurse' || currentUser?.role === 'dual';
  const isCheckoutLocked = !isIdentityVerified || !isContactAndPhoneVerified || !isLicenseVerified;

  // Split calculation preview based on final effective fee rate
  const splitPreview = stripeConnect.calculateSplit(
    accommodationTotal,
    cleaningFee,
    securityDeposit,
    finalFeeRate
  );

  const handleSelectCard = (card: typeof STRIPE_TEST_CARDS[0]) => {
    setSelectedTestCard(card);
    setCardNumber(card.number);
    setCardExpiry(card.expiry);
    setCardCvc(card.cvc);
    setCardZip(card.zip);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToPolicy) return;
    if (currentUser?.id && listing.hostId === currentUser.id) {
      alert("You cannot book your own listing.");
      setIsSubmitting(false);
      return;
    }
    if (!currentUser || currentUser.role === 'guest') {
      setCheckoutError("You must be signed in to request a booking sanctuary.");
      setIsSubmitting(false);
      return;
    }
    if (!verificationData || verificationData.licenseStatus !== 'verified') {
      setCheckoutError("Clinical verification required. Please complete your clinical license and identity verification before booking.");
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token'))
        : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Execute live non-custodial Stripe Connect direct charge pre-auth hold
      const res = await fetch('/api/checkout/create-booking-request', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          listing_id: listing.id || (listing as any).listing_id || 'nc-duke-condo',
          start_date: checkInDate,
          end_date: checkOutDate,
          traveler_name: currentUser?.name || 'Sarah Jenkins, RN',
          traveler_user_id: currentUser?.id,
          card_number: cardNumber,
          card_expiry: cardExpiry,
          card_cvc: cardCvc,
          card_zip: cardZip,
          special_requests: specialNote,
          promo_code: appliedPromo?.code || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place pre-authorization hold on Stripe');
      }

      const paymentIntentId = data.paymentIntentId || data.booking?.paymentIntentId;
      setLastPaymentIntentId(paymentIntentId);

      const newBooking: BookingRequest = {
        id: data.booking?.id || `bk-${Date.now()}`,
        clinicianName: currentUser?.name || 'Travel Clinician',
        clinicianTitle: verificationData?.professionSpecialty || 'BSN, RN (Travel Specialist)',
        clinicianAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
        clinicianPhone: verificationData?.mobilePhone || '+1 (919) 555-0198',
        hospitalName: listing.nearestHospital || 'Assignment Hospital',
        unitSpecialty: verificationData?.professionSpecialty?.includes('PICU') ? 'Pediatric ICU' : 'Clinical Rotation',
        listingId: listing.id || (listing as any).listing_id || 'unknown',
        listingTitle: listing.title,
        startDate: checkInDate,
        endDate: checkOutDate,
        durationWeeks: Math.round(daysCount / 7),
        monthlyRent,
        securityDeposit: 0,
        cleaningFee,
        petFee,
        parkingFee,
        extraOptionsFee,
        selectedExtraOptions: (listing.extraOptions || []).filter(o => selectedExtraOptions[o.name]),
        travelerFee,
        totalInitialCharge,
        hostNetPayout: data.booking?.hostNetPayout || splitPreview.hostNetPayout,
        status: 'pending_host_approval',
        submittedAt: 'Just now',
        deadlineHoursRemaining: 24,
        specialRequests: specialNote,
        doorCode: '•••• 4821',
        wifiNetwork: 'Sanctuary-Clinician-5G',
        paymentIntentId,
      };

      setConfirmedBooking(newBooking);
      setIsSuccess(true);
      onBookingSubmitted(newBooking);
    } catch (err: any) {
      console.error('Stripe Split Payment Error:', err);
      setCheckoutError(err.message || 'Payment pre-authorization hold failed. Please check your card information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[150] overflow-y-auto p-3 sm:p-6 pt-16 sm:pt-20 bg-black/65 backdrop-blur-xs flex justify-center items-start"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-lg my-auto rounded-3xl p-5 sm:p-8 shadow-lg relative border transition-colors ${
          isNightShiftMode
            ? 'bg-[#0E1A2E] border-[#233550] text-[#E6ECF7]'
            : 'bg-white border-[rgba(11,37,89,0.1)] text-[#001848]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close / Back button */}
        <button
          onClick={() => {
            if (step === 2 && !isSuccess) {
              setStep(1);
            } else {
              onClose();
            }
          }}
          type="button"
          aria-label={step === 2 && !isSuccess ? "Go back" : "Close checkout modal"}
          className="absolute top-5 left-5 w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-[#EFF6FB] dark:hover:bg-[#182840]/10 dark:hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] cursor-pointer transition-colors z-10"
        >
          <span className="material-symbols-outlined text-lg">
            {step === 2 && !isSuccess ? 'arrow_back' : 'close'}
          </span>
        </button>

        {!isSuccess ? (
          <div className="pt-8">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header */}
                  <div className="mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A6FA8] dark:text-[#3E9AD1]">
                      Step 1 of 2
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#001848] dark:text-white">
                      Review Cost Details
                    </h2>
                  </div>

                  {/* Property Summary Pill */}
                  <div className="p-3.5 rounded-2xl bg-[#eaedff]/60 dark:bg-[#15233a] border border-[#005684]/20 flex items-center justify-between gap-4 mb-5">
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate text-[#001848] dark:text-white">
                        {listing.title}
                      </div>
                      <div className="text-[11px] text-[#404850] dark:text-[#c0c7d1]">
                        Stay Duration Summary • {daysCount} Nights
                      </div>
                    </div>
                  </div>

                  {/* Itemized Cost Summary Table */}
                  <div className="border border-[rgba(11,37,89,0.1)] dark:border-[#233550] rounded-2xl p-4 mb-5 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-[#404850] dark:text-[#c0c7d1]">
                      <span>Accommodation ({daysCount} nights)</span>
                      <span className="font-bold tabular-nums text-[#001848] dark:text-white">${accommodationTotal.toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between items-center text-[#404850] dark:text-[#c0c7d1]">
                      <span>Cleaning Fee</span>
                      <span className="font-bold tabular-nums text-[#001848] dark:text-white">${cleaningFee.toFixed(2)}</span>
                    </div>
                    {petFee > 0 && (
                      <div className="flex justify-between items-center text-[#404850] dark:text-[#c0c7d1]">
                        <span>Pet Fee</span>
                        <span className="font-bold tabular-nums text-[#001848] dark:text-white">${petFee.toFixed(2)}</span>
                      </div>
                    )}
                    {parkingFee > 0 && (
                      <div className="flex justify-between items-center text-[#404850] dark:text-[#c0c7d1]">
                        <span>Parking Fee</span>
                        <span className="font-bold tabular-nums text-[#001848] dark:text-white">${parkingFee.toFixed(2)}</span>
                      </div>
                    )}
                    {listing.extraOptions && listing.extraOptions.length > 0 && (
                      <div className="pt-2 pb-1 border-t border-[rgba(11,37,89,0.05)] dark:border-[#233550]">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Extra Options</span>
                        <div className="space-y-2">
                          {listing.extraOptions.map((opt, i) => (
                            <label key={i} className="flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!selectedExtraOptions[opt.name]}
                                  onChange={(e) => setSelectedExtraOptions(prev => ({...prev, [opt.name]: e.target.checked}))}
                                  className="rounded accent-[#0A6FA8]"
                                />
                                <span className="text-[#404850] dark:text-[#c0c7d1]">{opt.name}</span>
                              </div>
                              <span className="font-bold tabular-nums text-[#001848] dark:text-white">+${Number(opt.price).toFixed(2)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[#404850] dark:text-[#c0c7d1]">
                      <span>Traveler Platform Fee</span>
                      <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">$0.00</span>
                    </div>

                    {appliedPromo && (
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">loyalty</span>
                          <span>Promo code ({appliedPromo.code})</span>
                        </span>
                        <span className="font-bold tabular-nums">-${appliedPromo.discountAmount.toLocaleString()}.00</span>
                      </div>
                    )}

                    {/* Promo Code Input Trigger */}
                    <div className="pt-2 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          placeholder="Promo code (e.g. WELCOME50)"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0B1626] text-xs font-mono tracking-wider outline-none focus:border-[#0A6FA8]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={!promoCodeInput.trim() || isValidatingPromo}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0A6FA8] hover:bg-[#0C7EBF] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isValidatingPromo ? 'Checking...' : 'Apply'}
                        </button>
                      </div>
                      {promoError && (
                        <p className="text-[11px] text-rose-500 mt-1 font-medium">{promoError}</p>
                      )}
                    </div>

                    {/* Total Due Now */}
                    <div className="pt-3 border-t border-[rgba(11,37,89,0.1)] dark:border-[#233550]">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-sm text-[#001848] dark:text-white">Due Today</span>
                        <div className="text-xl font-black tabular-nums text-[#0A6FA8] dark:text-[#3E9AD1]">
                          ${totalInitialCharge.toLocaleString()}.00
                        </div>
                      </div>
                    </div>
                  </div>

                  {(!currentUser || currentUser.role === 'guest') ? (
                    <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-sm">
                        <span className="material-symbols-outlined text-[18px]">account_circle</span>
                        Sign In or Register Required
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Please sign in or register before submitting a booking request.
                      </p>
                    </div>
                  ) : isCheckoutLocked && (
                    <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-sm">
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        Verification Required
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Please complete your clinician identity and license verification before proceeding to checkout.
                      </p>
                    </div>
                  )}

                  {(!currentUser || currentUser.role === 'guest') ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth?.('signin');
                      }}
                      className="w-full py-4 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white font-bold text-sm shadow-md transition-all duration-200 ease-in-out cursor-pointer flex justify-center items-center gap-2"
                    >
                      Sign In or Register to Book
                      <span className="material-symbols-outlined text-[18px]">login</span>
                    </button>
                  ) : isCheckoutLocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onGoToVerification) {
                          onGoToVerification();
                        }
                      }}
                      className="w-full py-4 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white font-bold text-sm shadow-md transition-all duration-200 ease-in-out cursor-pointer flex justify-center items-center gap-2"
                    >
                      Complete Verification to Book
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full py-4 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white font-bold text-sm shadow-md transition-all duration-200 ease-in-out cursor-pointer flex justify-center items-center gap-2"
                    >
                      Continue to Payment
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Header */}
                    <div className="mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A6FA8] dark:text-[#3E9AD1]">
                        Step 2 of 2
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#001848] dark:text-white">
                        Payment & Submit
                      </h2>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#001848] dark:text-white flex items-center gap-1.5">
                          <span>Payment Method</span>
                          <span className="text-[10px] font-normal text-gray-400">Encrypted 256-bit SSL</span>
                        </label>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <span className="text-[10px] font-semibold text-gray-400">Visa • MC • Amex</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl border border-[rgba(11,37,89,0.15)] dark:border-[#233550] bg-white dark:bg-[#111e33] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs shadow-xs">
                        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                          <span className="material-symbols-outlined text-[20px] text-[#0A6FA8]">credit_card</span>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                              const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
                              setCardNumber(formatted);
                            }}
                            className="bg-transparent focus:outline-none w-full font-mono font-medium text-[#001848] dark:text-white"
                            placeholder="Card number"
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => {
                              let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                              if (v.length >= 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                              setCardExpiry(v);
                            }}
                            className="bg-transparent focus:outline-none w-14 text-center font-mono text-[#001848] dark:text-white"
                            placeholder="MM/YY"
                            maxLength={5}
                            required
                          />
                          <span className="text-gray-300">|</span>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="bg-transparent focus:outline-none w-12 text-center font-mono text-[#001848] dark:text-white"
                            placeholder="CVC"
                            maxLength={4}
                            required
                          />
                          <span className="text-gray-300">|</span>
                          <input
                            type="text"
                            value={cardZip}
                            onChange={(e) => setCardZip(e.target.value.slice(0, 5))}
                            className="bg-transparent focus:outline-none w-14 text-center font-mono text-gray-600 dark:text-gray-300"
                            placeholder="ZIP"
                            maxLength={5}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Note to Host */}
                    <div>
                      <label className="block text-xs font-bold text-[#001848] dark:text-white mb-1">
                        Note to Host
                      </label>
                      <textarea
                        rows={2}
                        value={specialNote}
                        onChange={(e) => setSpecialNote(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[rgba(11,37,89,0.15)] dark:border-[#233550] bg-white dark:bg-[#111e33] text-xs focus:outline-none focus:ring-1 focus:ring-[#0A6FA8]"
                        placeholder="Share unit shift times or flight arrival schedule..."
                      />
                    </div>

                    {/* Policy Simplification */}
                    <div className="text-xs text-[#404850] dark:text-[#c0c7d1] space-y-2">
                      <label htmlFor="policy-agreement" className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          id="policy-agreement"
                          type="checkbox"
                          checked={agreedToPolicy}
                          onChange={(e) => setAgreedToPolicy(e.target.checked)}
                          className="mt-0.5 rounded accent-[#0A6FA8] cursor-pointer"
                          required
                        />
                        <span>
                          I agree to the {tierDetails.name} policy and the Quiet Daytime Environment commitment.
                        </span>
                      </label>
                    </div>

                    {/* Live Stripe Error Notice */}
                    {checkoutError && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">error</span>
                        <div className="leading-snug">{checkoutError}</div>
                      </div>
                    )}

                    {/* Submit CTA */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !agreedToPolicy}
                      className="w-full py-4 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all duration-200 ease-in-out flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                          <span>Placing Pre-Auth Hold...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">lock</span>
                          <span>Authorize Hold • ${totalInitialCharge.toLocaleString()}</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#195b4c]/20 text-[#195b4c] dark:text-[#aff0db] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h3 className="text-2xl font-bold text-[#001848] dark:text-white">
              Booking Pre-Authorization Hold Placed!
            </h3>
            <p className="text-xs text-[#404850] dark:text-[#c0c7d1] max-w-md mx-auto leading-relaxed">
              Your {Math.round(daysCount / 7)}-week booking request has been securely placed into the host's approval queue. The host has <strong>24 hours</strong> to accept and capture your hold.
            </p>

            <div className="p-4 rounded-2xl bg-[#eaedff]/60 dark:bg-[#15233a] max-w-md mx-auto text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Stripe Pre-Auth Hold:</span>
                <span className="font-mono font-bold text-[#0A6FA8] dark:text-[#3E9AD1] truncate max-w-[210px]">
                  {confirmedBooking?.paymentIntentId || lastPaymentIntentId || 'pi_confirmed'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Stripe Connect Direct Charge:</span>
                <span className="font-bold text-[#2F6E5E]">{platformFeePercent.toFixed(1)}% Platform Commission</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Hold Amount:</span>
                <span className="font-bold text-[#005684] dark:text-[#7bb0cc] tabular-nums">
                  ${totalInitialCharge.toLocaleString()}.00 (Uncaptured Hold)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Host SLA Window:</span>
                <span className="font-bold text-rose-600">23h 59m remaining</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Sanctuary Arrival Code:</span>
                <span className="font-bold text-[#195b4c]">PIN •••• 4821 (Unlocks on approval)</span>
              </div>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-[#001848] text-white text-xs font-bold hover:bg-[#162e62] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#162e62] cursor-pointer"
              >
                Done / View My Stays
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
