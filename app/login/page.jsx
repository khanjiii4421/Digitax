"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("signin"); // signin | signup
  const [showPassword, setShowPassword] = useState(false);

  const [signinForm, setSigninForm] = useState({ email: "", password: "", remember: false });
  const [signupForm, setSignupForm] = useState({ name: "", number: "", email: "", cnic: "", password: "" });
  const [signinLoading, setSigninLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Forgot password states
  const [forgotStep, setForgotStep] = useState("email"); // email | otp | newpass | done
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const googleBtnRef = useRef(null);
  const googleScriptLoaded = useRef(false);

  // Load Google Identity Services
  useEffect(() => {
    if (typeof window !== "undefined" && !googleScriptLoaded.current) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleScriptLoaded.current = true;
        initGoogleSignIn();
      };
      script.onerror = () => {
        console.warn("Google Identity Services script failed to load.");
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
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === "signin" && googleScriptLoaded.current && window.google) {
      initGoogleSignIn();
      setTimeout(() => {
        if (googleBtnRef.current && window.google) {
          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: googleBtnRef.current.offsetWidth || 350,
          });
        }
      }, 100);
    }
  }, [activeTab]);

  const handleGoogleCallback = async (response) => {
    setSigninLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(resData.message || "Signed in with Google!", "success");
        setTimeout(() => (window.location.href = "/portal"), 1000);
      } else {
        showToast(resData.message || "Google sign-in failed.", "error");
      }
    } catch (err) {
      showToast("Google sign-in failed.", "error");
    } finally {
      setSigninLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      showToast("Google Sign-In is being configured. Please use email sign-in.", "error");
      return;
    }
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      showToast("Google services not loaded yet. Please wait a moment.", "error");
    }
  };

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
        body: JSON.stringify(signinForm),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(resData.message || "Signed in successfully!", "success");
        setTimeout(() => (window.location.href = "/portal"), 1000);
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
        body: JSON.stringify({ ...signupForm, cnic: cnicFormatted }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast(resData.message || "Account created successfully!", "success");
        setTimeout(() => (window.location.href = "/portal"), 1000);
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

  // Forgot password handlers
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return showToast("Please enter your email.", "error");
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("OTP sent to your email!", "success");
        setForgotStep("otp");
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
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("OTP verified! Set your new password.", "success");
        setForgotStep("newpass");
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
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, password: newPassword }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        showToast("Password reset successful! Please sign in.", "success");
        setForgotStep("done");
        setTimeout(() => {
          setForgotStep("email");
          setActiveTab("signin");
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
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  const isForgotFlow = forgotStep !== "email" || activeTab === "forgot";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 flex flex-col">
      {/* Top bar */}
      <div className="w-full py-4 px-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">D</div>
          <span className="font-heading font-bold text-xl text-primary tracking-tight">DIGITAX</span>
        </a>
        <a href="/" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </a>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white border border-gray-200/50 rounded-[2rem] shadow-2xl p-8 md:p-10">

            {isForgotFlow ? (
              /* FORGOT PASSWORD FLOW */
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-text-primary tracking-tight">
                    {forgotStep === "email" && "Forgot Password?"}
                    {forgotStep === "otp" && "Verify OTP"}
                    {forgotStep === "newpass" && "Reset Password"}
                    {forgotStep === "done" && "Password Reset!"}
                  </h2>
                  <p className="text-text-secondary mt-1 text-sm">
                    {forgotStep === "email" && "Enter your email to receive a reset code"}
                    {forgotStep === "otp" && `We sent a 6-digit code to ${forgotEmail}`}
                    {forgotStep === "newpass" && "Enter your new password"}
                    {forgotStep === "done" && "Your password has been reset successfully."}
                  </p>
                </div>

                {forgotStep === "email" && (
                  <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-text-primary ml-1">Email Address</label>
                      <input type="email" placeholder="you@example.com" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                    </div>
                    <button type="submit" disabled={forgotLoading} className="bg-primary text-white font-bold text-base py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-md transition-all cursor-pointer disabled:opacity-50">
                      {forgotLoading ? "Sending..." : "Send OTP"}
                    </button>
                  </form>
                )}

                {forgotStep === "otp" && (
                  <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-text-primary ml-1">Enter 6-Digit OTP</label>
                      <input type="text" placeholder="000000" maxLength={6} required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm text-center text-2xl tracking-[0.5em] font-mono" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ""))} />
                    </div>
                    <button type="submit" disabled={forgotLoading} className="bg-primary text-white font-bold text-base py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-md transition-all cursor-pointer disabled:opacity-50">
                      {forgotLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button type="button" onClick={handleSendOtp} className="text-sm text-primary font-medium hover:underline cursor-pointer">Resend OTP</button>
                  </form>
                )}

                {forgotStep === "newpass" && (
                  <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-text-primary ml-1">New Password</label>
                      <input type="password" placeholder="••••••••" required minLength={6} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-text-primary ml-1">Confirm Password</label>
                      <input type="password" placeholder="••••••••" required minLength={6} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    <button type="submit" disabled={forgotLoading} className="bg-primary text-white font-bold text-base py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-md transition-all cursor-pointer disabled:opacity-50">
                      {forgotLoading ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>
                )}

                {forgotStep === "done" && (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-text-secondary text-sm">Redirecting to sign in...</p>
                  </div>
                )}

                <p className="text-center text-sm text-text-secondary mt-6">
                  Remember your password?{" "}
                  <button onClick={() => { setForgotStep("email"); setForgotEmail(""); setActiveTab("signin"); }} className="text-primary font-bold hover:underline cursor-pointer">Sign in</button>
                </p>
              </>
            ) : (
              /* SIGN IN / SIGN UP FLOW */
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-heading font-bold text-text-primary tracking-tight">
                    {activeTab === "signin" ? "Welcome Back" : "Create Account"}
                  </h2>
                  <p className="text-text-secondary mt-1 text-sm">
                    {activeTab === "signin"
                      ? "Sign in to continue to DIGITAX client portal"
                      : "Join DIGITAX in just a few seconds."}
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  <button
                    onClick={() => setActiveTab("signin")}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === "signin" ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setActiveTab("signup")}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === "signup" ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Google Sign In */}
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3.5 mb-5 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                >
                  <GoogleIcon />
                  <span className="text-sm font-bold text-text-primary">
                    {activeTab === "signin" ? "Continue with Google" : "Sign up with Google"}
                  </span>
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-text-secondary font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* SIGN IN FORM */}
                {activeTab === "signin" && (
                  <form onSubmit={handleSignin} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-text-primary ml-1">Email Address</label>
                      <input type="email" placeholder="you@example.com" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signinForm.email} onChange={(e) => setSigninForm({ ...signinForm, email: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-text-primary ml-1">Password</label>
                        <button type="button" onClick={() => setActiveTab("forgot")} className="text-xs text-primary font-medium hover:underline cursor-pointer">Forgot Password?</button>
                      </div>
                      <input type="password" placeholder="••••••••" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signinForm.password} onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={signinForm.remember} onChange={(e) => setSigninForm({ ...signinForm, remember: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm text-text-secondary">Remember me for 30 days</span>
                    </label>
                    <button type="submit" disabled={signinLoading} className="bg-primary text-white font-bold text-base py-3.5 rounded-xl mt-2 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-primary/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                      {signinLoading ? (
                        <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Signing In...</>
                      ) : "Sign In"}
                    </button>
                  </form>
                )}

                {/* SIGN UP FORM */}
                {activeTab === "signup" && (
                  <form onSubmit={handleSignup} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-sm font-bold text-text-primary ml-1">Full Name</label>
                      <input type="text" placeholder="John Doe" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-text-primary ml-1">Phone Number</label>
                      <input type="tel" placeholder="0300 1234567" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signupForm.number} onChange={(e) => setSignupForm({ ...signupForm, number: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-text-primary ml-1">CNIC</label>
                      <input type="text" placeholder="33202-0402151-5" required maxLength={15} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signupForm.cnic} onChange={handleCnicChange} />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-sm font-bold text-text-primary ml-1">Email Address</label>
                      <input type="email" placeholder="you@example.com" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-sm font-bold text-text-primary ml-1">Password</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="••••••••" required className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-primary transition-all shadow-sm text-sm" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-primary cursor-pointer">
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={signupLoading} className="sm:col-span-2 bg-primary text-white font-bold text-base py-3.5 rounded-xl mt-2 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-primary/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                      {signupLoading ? (
                        <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Creating Account...</>
                      ) : "Sign Up"}
                    </button>
                  </form>
                )}

                {/* Hidden div for Google Identity Services */}
                <div ref={googleBtnRef} className="hidden"></div>
              </>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-text-secondary mt-6">
            &copy; {new Date().getFullYear()} DIGITAX. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
