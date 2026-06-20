"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ToastProvider";
import SearchBar from "@/components/SearchBar";

export default function Header({ settings = [], logoUrl = null, initialUser = null }) {
  const { showToast } = useToast();
  const [showSignin, setShowSignin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // email, otp, newpass
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [signinForm, setSigninForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", number: "", email: "", cnic: "", password: "" });
  const [signinLoading, setSigninLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const googleScriptLoaded = useRef(false);

  const FallbackLogo = ({ size = "h-10" }) => (
    <div className="flex items-center gap-2">
      <div className={`${size === "h-10" ? "w-8 h-8" : size === "h-8" ? "w-7 h-7" : "w-12 h-12"} bg-primary rounded-full flex items-center justify-center text-white font-bold ${size === "h-12" ? "text-xl" : "text-sm"}`}>D</div>
      <span className="font-heading font-bold text-xl text-primary tracking-tight">DIGITAX</span>
    </div>
  );

  const officeAddress = settings.find(s => s.key === "office_address")?.value || settings.find(s => s.key === "contact_address")?.value || "Office 12, 3rd Floor, Executive Plaza, Islamabad, Pakistan";
  const contactPhone = settings.find(s => s.key === "contact_phone")?.value || "+92 349 1887803";
  const contactEmail = settings.find(s => s.key === "contact_email")?.value || "info@digitax.pk";
  const googleMapsLink = settings.find(s => s.key === "google_maps_link")?.value || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officeAddress)}`;

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window !== 'undefined' && !googleScriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleScriptLoaded.current = true;
        initGoogleSignIn();
      };
      document.head.appendChild(script);
    }
  }, []);

  const initGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
      });
    } catch(e) {}
  };

  useEffect(() => {
    if (showSignin && googleScriptLoaded.current && window.google) {
      initGoogleSignIn();
      setTimeout(() => {
        if (googleBtnRef.current && window.google) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: googleBtnRef.current.offsetWidth || 350,
          });
        }
      }, 100);
    }
  }, [showSignin]);

  const handleGoogleCallback = async (response) => {
    setSigninLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setUser(resData.data.user);
        setShowSignin(false);
        showToast(resData.message || "Signed in with Google!", "success");
        setTimeout(() => window.location.href = "/portal", 1000);
      } else {
        showToast(resData.message || "Google sign-in failed.", "error");
      }
    } catch (err) {
      showToast("Google sign-in failed.", "error");
    } finally {
      setSigninLoading(false);
    }
  };

  // Simple Google sign-in button (works without Google Identity Services too)
  const handleGoogleSignIn = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      showToast("Google Sign-In is being configured. Please use email sign-in.", "error");
      return;
    }
    // If Google Identity Services loaded, trigger popup
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      showToast("Google services not loaded yet. Please wait a moment.", "error");
    }
  };

  useEffect(() => {
    if (!initialUser) {
      fetch("/api/auth/me")
        .then(res => res.json())
        .then(resData => {
          if (resData.success && resData.data?.user) {
            setUser(resData.data.user);
          }
        })
        .catch(() => {});
    }
  }, [initialUser]);

  // Auth modals only open via explicit button click — no URL param triggers

  const handleSignin = async (e) => {
    e.preventDefault();
    if (!signinForm.email || !signinForm.password) {
      return showToast("Please fill in all fields.", "error");
    }
    setSigninLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signinForm)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setUser(resData.data.user);
        setShowSignin(false);
        showToast(resData.message || "Signed in successfully!", "success");
        setTimeout(() => window.location.href = "/portal", 1000);
      } else {
        showToast(resData.message || "Invalid credentials.", "error");
      }
    } catch (err) {
      showToast("Sign in failed. Please try again.", "error");
    } finally {
      setSigninLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (signupForm.name.length < 3) return showToast("Name must be at least 3 characters long.", "error");
    if (signupForm.password.length < 6) return showToast("Password must be at least 6 characters long.", "error");
    
    const cnicDigits = signupForm.cnic.replace(/-/g, "");
    if (cnicDigits.length !== 13 || !/^\d{13}$/.test(cnicDigits)) return showToast("CNIC must be exactly 13 digits (e.g. 33202-0402151-5).", "error");
    const cnicFormatted = cnicDigits.slice(0, 5) + "-" + cnicDigits.slice(5, 12) + "-" + cnicDigits.slice(12);
    
    const phoneDigits = signupForm.number.replace(/[-\s]/g, "");
    if (!/^\d{10,11}$/.test(phoneDigits)) return showToast("Phone number must be 10 or 11 digits.", "error");

    setSignupLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...signupForm, cnic: cnicFormatted })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setUser(resData.data.user);
        showToast(resData.message || "Account created successfully!", "success");
        setShowSignup(false);
        setTimeout(() => window.location.href = "/portal", 1000);
      } else {
        showToast(resData.message || "Failed to create account.", "error");
      }
    } catch (err) {
      showToast("Sign up failed. Please try again.", "error");
    } finally {
      setSignupLoading(false);
    }
  };

  // CNIC auto-format handler
  const handleCnicChange = (e) => {
    let val = e.target.value.replace(/[^0-9]/g, "").slice(0, 13);
    if (val.length > 12) val = val.slice(0, 5) + "-" + val.slice(5, 12) + "-" + val.slice(12);
    else if (val.length > 5) val = val.slice(0, 5) + "-" + val.slice(5);
    setSignupForm({ ...signupForm, cnic: val });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  // Forgot Password Handlers
  const closeAllModals = () => {
    setShowSignin(false);
    setShowSignup(false);
    setShowForgot(false);
    setForgotStep('email');
  };

  const openForgotPassword = () => {
    setShowSignin(false);
    setShowForgot(true);
    setForgotStep('email');
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return showToast("Please enter your email.", "error");
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("OTP sent to your email!", "success");
        setForgotStep('otp');
      } else {
        showToast(resData.message || "Failed to send OTP.", "error");
      }
    } catch (err) {
      showToast("Failed to send OTP.", "error");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.length !== 6) return showToast("Please enter the 6-digit OTP.", "error");
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("OTP verified! Set your new password.", "success");
        setForgotStep('newpass');
      } else {
        showToast(resData.message || "Invalid or expired OTP.", "error");
      }
    } catch (err) {
      showToast("OTP verification failed.", "error");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return showToast("Password must be at least 6 characters.", "error");
    if (newPassword !== confirmPassword) return showToast("Passwords do not match.", "error");
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, password: newPassword })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("Password reset successful! Please sign in.", "success");
        setForgotStep('done');
        setTimeout(() => {
          setShowForgot(false);
          setForgotStep('email');
          setShowSignin(true);
        }, 2000);
      } else {
        showToast(resData.message || "Password reset failed.", "error");
      }
    } catch (err) {
      showToast("Password reset failed.", "error");
    } finally {
      setForgotLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  // Forgot Password Modal
  const renderForgotPasswordModal = () => {
    if (forgotStep === 'done') {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white border border-premium rounded-[2rem] shadow-2xl w-full max-w-md p-8 md:p-10 relative text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">Password Reset!</h2>
            <p className="text-text-secondary text-sm">Your password has been reset successfully. Redirecting to sign in...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
        <div className="bg-white border border-premium rounded-[2rem] shadow-2xl w-full max-w-md p-8 md:p-10 relative">
          <button onClick={closeAllModals} className="absolute top-6 right-6 text-text-secondary hover:text-primary transition-colors text-2xl leading-none cursor-pointer">&times;</button>

          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h2 className="text-2xl font-heading font-bold text-text-primary tracking-tight">
              {forgotStep === 'email' && 'Forgot Password?'}
              {forgotStep === 'otp' && 'Verify OTP'}
              {forgotStep === 'newpass' && 'Reset Password'}
            </h2>
            <p className="text-text-secondary mt-1 text-sm">
              {forgotStep === 'email' && 'Enter your email to receive a reset code'}
              {forgotStep === 'otp' && `We sent a 6-digit code to ${forgotEmail}`}
              {forgotStep === 'newpass' && 'Enter your new password'}
            </p>
          </div>

          {forgotStep === 'email' && (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">Email Address</label>
                <input type="email" placeholder="you@example.com" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={forgotLoading} className="bg-primary text-white font-bold text-base py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-md transition-all cursor-pointer disabled:opacity-50">
                {forgotLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {forgotStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">Enter 6-Digit OTP</label>
                <input type="text" placeholder="000000" maxLength={6} required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm text-center text-2xl tracking-[0.5em] font-mono" value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/[^0-9]/g, ''))} />
              </div>
              <button type="submit" disabled={forgotLoading} className="bg-primary text-white font-bold text-base py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-md transition-all cursor-pointer disabled:opacity-50">
                {forgotLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" onClick={handleSendOtp} className="text-sm text-primary font-medium hover:underline cursor-pointer">Resend OTP</button>
            </form>
          )}

          {forgotStep === 'newpass' && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">New Password</label>
                <input type="password" placeholder="••••••••" required minLength={6} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">Confirm Password</label>
                <input type="password" placeholder="••••••••" required minLength={6} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={forgotLoading} className="bg-primary text-white font-bold text-base py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-md transition-all cursor-pointer disabled:opacity-50">
                {forgotLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-text-secondary mt-6">
            Remember your password? <button onClick={() => { setShowForgot(false); setForgotStep('email'); setShowSignin(true); }} className="text-primary font-bold hover:underline cursor-pointer">Sign in</button>
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="hidden md:block w-full border-b border-gray-150 py-2.5 text-xs text-text-secondary bg-gray-50/50">
        <div className="mx-auto max-w-[1400px] w-[90%] md:w-[75%] flex justify-between items-center px-4">
            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate hover:underline">{officeAddress}</span>
            </a>
          <div className="flex gap-4 items-center shrink-0">
            <span>{contactPhone}</span>
            <span>{contactEmail}</span>
          </div>
        </div>
      </div>

      <header className="sticky top-4 z-50 mx-auto max-w-[1400px] w-[90%] md:w-[75%] bg-white/75 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/50 px-6 py-4 flex items-center justify-between">
        <div className="hidden md:flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => window.location.href = "/"}>
          {logoUrl && !logoError ? (
            <img 
              src={logoUrl} 
              alt="DIGITAX" 
              className="h-10 object-contain" 
              loading="eager"
              onError={() => setLogoError(true)}
            />
          ) : (
            <FallbackLogo />
          )}
        </div>

        <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
          <a href="/" className="text-text-primary hover:text-primary transition-colors">Home</a>
          <a href="/services" className="text-text-primary hover:text-primary transition-colors">Business Services</a>
          <a href="/#tax-tool" className="text-text-primary hover:text-primary transition-colors">Tax Tool</a>
          <a href="/sales-tax" className="text-text-primary hover:text-primary transition-colors">Sales Tax</a>
          <SearchBar />
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Hi, {user.name}</span>
              {user.role === "admin" && (
                <a href="/admin" className="text-sm font-medium text-primary hover:underline">Admin Panel</a>
              )}
              {user.role === "user" && (
                <a href="/portal" className="text-sm font-medium text-primary hover:underline">Client Portal</a>
              )}
              <button onClick={handleLogout} className="text-sm font-medium text-text-secondary hover:text-error transition-colors cursor-pointer">Logout</button>
            </div>
          ) : (
            <>
              <button onClick={() => setShowSignin(true)} className="text-sm font-bold text-text-primary hover:text-primary transition-colors cursor-pointer">Sign In</button>
              <button onClick={() => setShowSignup(true)} className="text-sm font-bold bg-primary text-white px-6 py-2.5 rounded-full hover:scale-105 transition-transform shadow-md cursor-pointer">Sign Up</button>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center justify-between w-full relative">
          <div className="cursor-pointer flex items-center shrink-0" onClick={() => window.location.href = "/"}>
            {logoUrl && !logoError ? (
              <img 
                src={logoUrl} 
                alt="DIGITAX" 
                className="h-8 object-contain" 
                loading="eager"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">D</div>
            )}
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <span className="font-heading font-bold text-base text-primary tracking-wider uppercase">DIGITAX</span>
          </div>

          <div className="flex items-center gap-1">
            <SearchBar />

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-text-primary focus:outline-none p-1 z-50 cursor-pointer">
            <svg className="w-6 h-6 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-xl p-6 flex flex-col gap-4 z-[99] mx-4 transition-all duration-300 origin-top animate-fade-in">
            <a href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-text-primary hover:text-primary transition-colors py-2 border-b border-gray-100">Home</a>
            <a href="/services" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-text-primary hover:text-primary transition-colors py-2 border-b border-gray-100">Business Services</a>
            <a href="/#tax-tool" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-text-primary hover:text-primary transition-colors py-2 border-b border-gray-100">Tax Tool</a>
            <a href="/sales-tax" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-text-primary hover:text-primary transition-colors py-2 border-b border-gray-100">Sales Tax</a>
            <div className="flex flex-col gap-3 pt-2">
              {user ? (
                <>
                  <span className="text-sm font-bold text-text-primary">Hi, {user.name}</span>
                  {user.role === "admin" && (
                    <a href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-primary hover:underline py-1">Admin Panel</a>
                  )}
                  {user.role === "user" && (
                    <a href="/portal" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-primary hover:underline py-1">Client Portal</a>
                  )}
                  <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="text-left text-sm font-bold text-error py-1 cursor-pointer">Logout</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setIsMobileMenuOpen(false); setShowSignin(true); }} className="w-full text-center font-bold border border-primary text-primary py-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer">Sign In</button>
                  <button onClick={() => { setIsMobileMenuOpen(false); setShowSignup(true); }} className="w-full text-center font-bold bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer">Sign Up</button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {showSignin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white border border-premium rounded-[2rem] shadow-2xl w-full max-w-md p-8 md:p-10 relative max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowSignin(false)} className="absolute top-6 right-6 text-text-secondary hover:text-primary transition-colors text-2xl leading-none cursor-pointer">&times;</button>
            
            <div className="text-center mb-8">
              {logoUrl ? (
                <img src={logoUrl} alt="DIGITAX" className="h-12 object-contain mx-auto mb-4" />
              ) : (
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4 text-xl">D</div>
              )}
              <h2 className="text-3xl font-heading font-bold text-text-primary tracking-tight">Welcome Back</h2>
              <p className="text-text-secondary mt-1 text-sm">Sign in to continue to DIGITAX client portal</p>
            </div>

            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3.5 mb-5 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
            >
              <GoogleIcon />
              <span className="text-sm font-bold text-text-primary">Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-text-secondary font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <form onSubmit={handleSignin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">Email Address</label>
                <input type="email" placeholder="you@example.com" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signinForm.email} onChange={e => setSigninForm({...signinForm, email: e.target.value})} />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-text-primary ml-1">Password</label>
                  <button type="button" onClick={openForgotPassword} className="text-xs text-primary font-medium hover:underline cursor-pointer">Forgot Password?</button>
                </div>
                <input type="password" placeholder="••••••••" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signinForm.password} onChange={e => setSigninForm({...signinForm, password: e.target.value})} />
              </div>

              <button type="submit" disabled={signinLoading} className="bg-primary text-white font-bold text-base py-3.5 rounded-xl mt-2 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-primary/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">{signinLoading ? (
                <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Signing In...</>
              ) : "Sign In"}</button>
            </form>

            {/* Hidden div for Google Identity Services rendering */}
            <div ref={googleBtnRef} className="hidden"></div>

            <p className="text-center text-sm text-text-secondary mt-8">
              Don&apos;t have an account? <button onClick={() => { setShowSignin(false); setShowSignup(true); }} className="text-primary font-bold hover:underline cursor-pointer">Sign up</button>
            </p>
          </div>
        </div>
      )}

      {showSignup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white border border-premium rounded-[2rem] shadow-2xl w-full max-w-lg p-8 md:p-10 relative max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowSignup(false)} className="absolute top-6 right-6 text-text-secondary hover:text-primary transition-colors text-2xl leading-none cursor-pointer">&times;</button>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-heading font-bold text-text-primary tracking-tight">Create Account</h2>
              <p className="text-text-secondary mt-1 text-sm">Join DIGITAX in just a few seconds.</p>
            </div>

            {/* Google Sign-Up Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3.5 mb-5 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
            >
              <GoogleIcon />
              <span className="text-sm font-bold text-text-primary">Sign up with Google</span>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-text-secondary font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <form onSubmit={handleSignup} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-text-primary ml-1">Full Name</label>
                <input type="text" placeholder="John Doe" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signupForm.name} onChange={e => setSignupForm({...signupForm, name: e.target.value})} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">Phone Number</label>
                <input type="tel" placeholder="0300 1234567" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signupForm.number} onChange={e => setSignupForm({...signupForm, number: e.target.value})} />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-text-primary ml-1">CNIC</label>
                <input type="text" placeholder="33202-0402151-5" required maxLength={15} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signupForm.cnic} onChange={handleCnicChange} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-text-primary ml-1">Email Address</label>
                <input type="email" placeholder="you@example.com" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signupForm.email} onChange={e => setSignupForm({...signupForm, email: e.target.value})} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-text-primary ml-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signupForm.password} onChange={e => setSignupForm({...signupForm, password: e.target.value})} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-primary cursor-pointer">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={signupLoading} className="sm:col-span-2 bg-primary text-white font-bold text-base py-3.5 rounded-xl mt-2 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-primary/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">{signupLoading ? (
                <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Creating Account...</>
              ) : "Sign Up"}</button>
            </form>

            <p className="text-center text-sm text-text-secondary mt-8">
              Already have an account? <button onClick={() => { setShowSignup(false); setShowSignin(true); }} className="text-primary font-bold hover:underline cursor-pointer">Sign in</button>
            </p>
          </div>
        </div>
      )}

      {/* Forgot Password Modal — only when user explicitly clicks Forgot Password */}
      {showForgot && !showSignin && !showSignup && renderForgotPasswordModal()}
    </>
  );
}
