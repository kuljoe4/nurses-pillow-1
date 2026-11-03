import React, { useState } from 'react';
import { NOTIFICATION_TEMPLATES } from '../../data/phase1InventoryData';

export const Phase1InventoryNotificationsTab: React.FC = () => {
  const [selectedNotification, setSelectedNotification] = useState(NOTIFICATION_TEMPLATES[0]);
  const [notificationChannelPreview, setNotificationChannelPreview] = useState<'Email' | 'SMS' | 'Push' | 'In-App'>('Email');
  const [customNotificationCopy, setCustomNotificationCopy] = useState<string>(NOTIFICATION_TEMPLATES[0]?.sampleBody || '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Templates List */}
      <div className="lg:col-span-5 space-y-2 max-h-[700px] overflow-y-auto pr-1">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
          Notification Templates (25 Total across M1 &amp; M2)
        </h3>
        {NOTIFICATION_TEMPLATES.map((notif) => (
          <button
            key={notif.id}
            onClick={() => {
              setSelectedNotification(notif);
              setCustomNotificationCopy(notif.sampleBody);
              setNotificationChannelPreview(notif.channels[0] as any);
            }}
            className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all duration-200 ease-in-out flex flex-col gap-1 ${
              selectedNotification?.id === notif.id
                ? 'bg-[#005684] text-white border-[#005684] shadow-md'
                : 'bg-white dark:bg-[#0B1626] border-[rgba(11,37,89,0.08)] dark:border-[#233550] hover:border-[#005684]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                selectedNotification?.id === notif.id ? 'bg-white/20' : 'bg-black/5 dark:bg-white/5'
              }`}>
                {notif.id}
              </span>
              <span className="text-[10px] opacity-80">{notif.milestone} • {notif.recipient}</span>
            </div>
            <div className="font-bold text-sm">{notif.event}</div>
            <div className="text-[11px] opacity-70 flex gap-1">
              {notif.channels.map((c) => (
                <span key={c} className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono">
                  {c}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Template Preview & Editor Column */}
      <div className="lg:col-span-7 bg-white dark:bg-[#0B1626] p-6 sm:p-8 rounded-3xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-6">
        {selectedNotification ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
              <div>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-[#005684]/15 text-[#005684] dark:text-[#93ccff]">
                  {selectedNotification.id}
                </span>
                <h2 className="text-xl font-black mt-1">{selectedNotification.event}</h2>
                <p className="text-xs opacity-70">
                  Recipient: <strong>{selectedNotification.recipient}</strong> • Milestone: {selectedNotification.milestone}
                </p>
              </div>

              {/* Channel Switcher */}
              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                {selectedNotification.channels.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setNotificationChannelPreview(ch as any)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-200 ease-in-out ${
                      notificationChannelPreview === ch
                        ? 'bg-[#005684] text-white'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Rendered Live Simulation */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                Live Channel Simulation: {notificationChannelPreview}
              </div>

              {notificationChannelPreview === 'Email' && (
                <div className="rounded-2xl border border-[rgba(11,37,89,0.15)] dark:border-[#233550] overflow-hidden shadow-sm">
                  <div className="bg-[#001848] text-white p-4 flex items-center justify-between text-xs">
                    <div className="font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                      <span>Postmark Transactional Delivery</span>
                    </div>
                    <span className="opacity-70 text-[11px]">from: support@nursespillow.com</span>
                  </div>
                  <div className="p-5 bg-white dark:bg-[#08101C] text-xs space-y-3">
                    <div className="font-bold text-sm border-b border-black/5 pb-2">
                      Subject: {selectedNotification.subject}
                    </div>
                    <p className="leading-relaxed opacity-90">
                      {customNotificationCopy || selectedNotification.sampleBody}
                    </p>
                    <div className="pt-4 border-t border-black/5 flex justify-between items-center text-[10px] opacity-60">
                      <span>Nurses Pillow Inc. • Clinical Housing Network</span>
                      <span>Transactional ID: #NP-TX-8492</span>
                    </div>
                  </div>
                </div>
              )}

              {notificationChannelPreview === 'SMS' && (
                <div className="max-w-md mx-auto p-4 rounded-3xl bg-[#E9E9EB] dark:bg-[#1C2533] text-black dark:text-white shadow-sm space-y-2">
                  <div className="text-[10px] text-center opacity-60 font-semibold">
                    SMS Notification Gateway • 1-800-PILLOWS
                  </div>
                  <div className="bg-[#007AFF] text-white p-3 rounded-2xl rounded-bl-none text-xs leading-relaxed max-w-[85%]">
                    {customNotificationCopy || selectedNotification.sampleBody}
                  </div>
                  <div className="text-[9px] opacity-50 text-right pr-2">Delivered • Just now</div>
                </div>
              )}

              {(notificationChannelPreview === 'Push' || notificationChannelPreview === 'In-App') && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#08101C] border border-[#005684]/30 shadow-lg flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#005684] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">NURSES PILLOW ALERT</span>
                      <span className="text-[10px] opacity-60">now</span>
                    </div>
                    <p className="leading-relaxed opacity-90">
                      {customNotificationCopy || selectedNotification.sampleBody}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Admin-Editable Copy Box */}
            <div className="space-y-2 pt-2 border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
              <label className="text-xs font-bold uppercase tracking-wider opacity-70 block">
                Admin Copy Customizer (Test Variable Merge)
              </label>
              <textarea
                rows={3}
                value={customNotificationCopy}
                onChange={(e) => setCustomNotificationCopy(e.target.value)}
                className="w-full p-3 rounded-xl border border-[rgba(11,37,89,0.2)] dark:border-[#233550] bg-transparent text-xs leading-relaxed focus:outline-none focus:border-[#005684]"
              />
              <div className="text-[10px] opacity-60 flex justify-between">
                <span>Variables supported: [ClinicianName], [HospitalName], [DoorCode], [MonthlyRent]</span>
                <button
                  onClick={() => setCustomNotificationCopy(selectedNotification.sampleBody)}
                  className="text-[#005684] dark:text-[#93ccff] font-bold hover:underline"
                >
                  Reset to Default Copy
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 opacity-60">
            Select a notification template from the left to view its rendered design and delivery logic.
          </div>
        )}
      </div>
    </div>
  );
};
