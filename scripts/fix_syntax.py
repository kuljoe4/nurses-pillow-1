import re

with open('src/components/NurseDashboardView.tsx', 'r') as f:
    content = f.read()

# Replace the start of TAB 1
content = content.replace(
    "{activeTab === 'current' && (",
    "{activeTab === 'current' && activeBookings.length > 0 && ("
)

# Insert the empty state before TAB 2
empty_state_str = """
      {activeTab === 'current' && activeBookings.length === 0 && (
        <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-12 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex flex-col items-center justify-center text-center animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-[#f2f3ff] dark:bg-[#182840] flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px] text-[#005684] dark:text-[#93ccff]">
              luggage
            </span>
          </div>
          <h2 className="text-xl font-bold mb-2">No active sanctuary stays</h2>
          <p className="text-sm text-gray-500 max-w-md mb-8">
            You don't have any current or upcoming bookings. Explore our vetted listings to find your next assignment sanctuary.
          </p>
          <button
            onClick={onGoToHousing}
            className="px-6 py-3 rounded-full bg-[#001848] text-white text-sm font-bold hover:bg-[#162e62] transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#162e62] cursor-pointer"
          >
            Explore Listings
          </button>
        </div>
      )}

      {/* TAB 2: My Saved Pillows */}"""

content = content.replace("{/* TAB 2: My Saved Pillows */}", empty_state_str)

with open('src/components/NurseDashboardView.tsx', 'w') as f:
    f.write(content)
print("Replaced TAB 1 and TAB 2 properly")
