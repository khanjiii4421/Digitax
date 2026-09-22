"use client";

import { useEffect, useState } from "react";

export default function PortalLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.data?.user) {
          setUser(resData.data.user);
          setLoading(false);
        } else {
          return fetch("/api/auth/refresh", { method: "POST" })
            .then(r => r.json())
            .then(refreshData => {
              if (refreshData.success) {
                return fetch("/api/auth/me").then(r => r.json());
              }
              return null;
            })
            .then(retryData => {
              if (retryData?.success && retryData.data?.user) {
                setUser(retryData.data.user);
              } else {
                window.location.href = '/login';
              }
              setLoading(false);
            });
        }
      })
      .catch(() => {
        window.location.href = '/login';
        setLoading(false);
      });
  }, []);

  // Notification polling
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const prevUnread = unreadCount;
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          if (data.unreadCount > prevUnread && prevUnread >= 0) {
            const newNotifs = (data.notifications || []).filter(n => !n.is_read).slice(0, 1);
            if (newNotifs.length > 0 && typeof window !== 'undefined' && Notification.permission === 'granted') {
              new Notification(newNotifs[0].title, { body: newNotifs[0].message });
            }
          }
        }
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (!user) return;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch(e) {}
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = '/';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return null;

  const menu = [
    { name: 'Dashboard', path: '/portal', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'My Applications', path: '/portal/applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Services', path: '/portal/services', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Completed Files', path: '/portal/completed', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'FAQs', path: '/portal/faq', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Guides & Updates', path: '/portal/blog-updates', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { name: 'Video Tutorials', path: '/portal/videos', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { name: 'My Queries', path: '/portal/queries', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { name: 'Settings', path: '/portal/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 font-body relative overflow-x-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`bg-white border-r border-gray-200/50 shadow-sm flex flex-col fixed md:sticky top-0 h-screen overflow-y-auto z-50 transform transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0 justify-between">
          <div className="flex items-center cursor-pointer overflow-hidden" onClick={() => window.location.href = '/'}>
            <span className="font-heading font-bold text-xl text-primary tracking-tight shrink-0">DIGITAX</span>
            {!isCollapsed && (
              <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">Portal</span>
            )}
          </div>
          <button className="md:hidden text-text-secondary" onClick={() => setIsSidebarOpen(false)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {menu.map(item => {
            const isActive = window.location.pathname === item.path;
            return (
              <a
                key={item.name}
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all relative group ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'text-text-secondary hover:bg-primary/5 hover:text-primary'
                }`}
              >
                <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                {isCollapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap shadow-lg">
                    {item.name}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-error hover:bg-error/5 rounded-xl transition-colors flex items-center gap-3 cursor-pointer"
          >
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 w-full">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 md:px-8 justify-between shadow-sm shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-text-primary p-2 -ml-2 rounded-lg hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button 
              className="hidden md:block text-text-secondary p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h12M4 18h8" />
              </svg>
            </button>
            <h2 className="font-bold text-lg text-text-primary hidden sm:block">Client Portal</h2>
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); if (!showNotifications) markAllRead(); }}
              className="p-2 text-text-secondary hover:text-primary rounded-full hover:bg-gray-100 relative cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-12 top-12 w-80 bg-white border border-gray-200/50 shadow-xl rounded-2xl p-4 z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-text-primary">Notifications</h3>
                  {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-primary font-medium hover:underline cursor-pointer">Mark all read</button>}
                </div>
                <div className="flex flex-col gap-2">
                  {notifications.length > 0 ? notifications.map(n => (
                    <a
                      key={n.id}
                      href={n.link || '#'}
                      onClick={() => { setShowNotifications(false); }}
                      className={`p-3 rounded-xl transition-colors text-xs cursor-pointer block ${n.is_read ? 'hover:bg-gray-50 text-text-secondary' : 'bg-primary/5 border border-primary/10 text-text-primary font-medium'}`}
                    >
                      <div className="font-bold text-[13px]">{n.title}</div>
                      <div className="mt-0.5">{n.message}</div>
                      <div className="mt-1 text-[10px] text-text-secondary">{new Date(n.created_at).toLocaleString()}</div>
                    </a>
                  )) : (
                    <div className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-xs text-text-secondary">
                      Welcome to DIGITAX Client Portal!
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="relative">
              <button 
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                className="flex items-center gap-2 cursor-pointer focus:outline-none"
              >
                <div className="w-9 h-9 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center text-sm uppercase">
                  {user.name.charAt(0)}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200/50 shadow-xl rounded-2xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-100 text-xs">
                    <p className="font-bold text-text-primary truncate">{user.name}</p>
                    <p className="text-text-secondary truncate">{user.email}</p>
                  </div>
                  {user.role === 'admin' && (
                    <a 
                      href="/admin"
                      className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center gap-2 mt-1"
                    >
                      Admin Panel
                    </a>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/5 rounded-lg transition-colors flex items-center gap-2 mt-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="p-4 md:p-8 flex-1 overflow-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
