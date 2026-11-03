import React, { useState, useEffect } from 'react';
import { HousingListing } from '../types';
import { SearchListingCard } from './SearchListingCard';

interface HostPublicProfileViewProps {
  hostId: string;
  isNightShiftMode: boolean;
  onClose?: () => void;
  onSelectListing: (listing: HousingListing) => void;
  savedListingIds: string[];
  onToggleSave: (id: string) => void;
  selectedHospital?: string;
}

export const HostPublicProfileView: React.FC<HostPublicProfileViewProps> = ({
  hostId,
  isNightShiftMode,
  onClose,
  onSelectListing,
  savedListingIds,
  onToggleSave,
  selectedHospital = 'Duke University Hospital',
}) => {
  const [profileData, setProfileData] = useState<{
    host: {
      id: string;
      fullName: string;
      role: string;
      isHostVerified: boolean;
      identityVerified: boolean;
      memberSince: string;
      responseTime: string;
      rating: number;
      reviewsCount: number;
    };
    listings: HousingListing[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchHost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/hosts/${hostId}`);
        if (!res.ok) {
          throw new Error('Host not found');
        }
        const data = await res.json();
        if (isMounted) {
          setProfileData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load host profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchHost();
    return () => {
      isMounted = false;
    };
  }, [hostId]);

  const handleCopyShareLink = () => {
    const publicUrl = `${window.location.origin}/hosts/unique/${hostId}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isNightShiftMode ? 'bg-[#0B1626] text-[#E6ECF7]' : 'bg-[#EFF6FB] text-[#001848]'}`}>
        <div className="flex items-center gap-3 text-[#0A6FA8] font-bold text-sm">
          <span className="w-5 h-5 border-2 border-[#0A6FA8] border-t-transparent rounded-full animate-spin"></span>
          Loading verified host profile...
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isNightShiftMode ? 'bg-[#0B1626] text-[#E6ECF7]' : 'bg-[#EFF6FB] text-[#001848]'} text-center`}>
        <div className="w-16 h-16 rounded-full bg-[#F4E2DC] text-[#A8452E] flex items-center justify-center mb-4 text-2xl">
          <span className="material-symbols-outlined text-[32px]">error</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Host Profile Not Found</h1>
        <p className="text-sm text-gray-500 mb-6">The requested host URL ({hostId}) does not exist or has been removed.</p>
        <a
          href="/"
          className="px-6 py-2.5 rounded-full bg-[#0A6FA8] text-white text-xs font-bold shadow-md hover:bg-[#0C7EBF] transition-all"
        >
          Return to Housing Search
        </a>
      </div>
    );
  }

  const { host, listings } = profileData;

  return (
    <div className={`min-h-screen ${isNightShiftMode ? 'bg-[#0B1626] text-[#E6ECF7]' : 'bg-[#EFF6FB] text-[#001848]'} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-bold text-[#0A6FA8] dark:text-[#3E9AD1] hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to Search</span>
            </button>
          )}
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#0E1A2E] border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#0A6FA8]">share</span>
            <span>{copiedLink ? 'Link Copied!' : 'Share Host Profile URL'}</span>
          </button>
        </div>

        {/* Host Header Card */}
        <div className={`rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(11,37,89,0.08)] border ${isNightShiftMode ? 'bg-[#0E1A2E] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.08)]'} flex flex-col sm:flex-row items-center sm:items-start gap-6`}>
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0A6FA8] to-[#2F6E5E] text-white text-3xl font-bold flex items-center justify-center shadow-lg shrink-0">
            {host.fullName.charAt(0)}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold">{host.fullName}</h1>
              {host.isHostVerified && (
                <span className="px-3 py-1 rounded-full bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#142823] dark:text-[#aff0db] text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  <span>Verified Host &amp; Deed</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Member since {host.memberSince} • Response time: {host.responseTime} • ⭐ {host.rating} ({host.reviewsCount} reviews)
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              {host.identityVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFF6FB] text-[#0A6FA8] dark:bg-[#182840] dark:text-[#3E9AD1] text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[13px]">badge</span>
                  <span>RealID Verified</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFF6FB] text-[#0A6FA8] dark:bg-[#182840] dark:text-[#3E9AD1] text-[11px] font-semibold">
                <span className="material-symbols-outlined text-[13px]">shield</span>
                <span>Stripe Payout Protected</span>
              </span>
            </div>
          </div>
        </div>

        {/* Host Listings Portfolio - Reusing SearchListingCard for 100% homepage parity */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Listings by {host.fullName} ({listings.length})</h2>
          {listings.length === 0 ? (
            <div className={`p-8 rounded-2xl text-center text-xs text-gray-400 border ${isNightShiftMode ? 'bg-[#0E1A2E] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.08)]'}`}>
              This host currently has no active published listings.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listings.map((listing) => (
                <SearchListingCard
                  key={listing.id}
                  listing={listing}
                  isSaved={savedListingIds.includes(listing.id)}
                  onToggleSave={onToggleSave}
                  onViewDetails={(l) => {
                    window.history.pushState({}, document.title, `${window.location.origin}/listings/${l.id}`);
                    onSelectListing(l);
                  }}
                  selectedHospital={selectedHospital}
                  isNightShiftMode={isNightShiftMode}
                  viewMode="grid"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
