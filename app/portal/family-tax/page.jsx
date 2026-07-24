"use client";

import { useState, useEffect, useRef } from "react";

const STEP_TITLES = [
  "Applicant Information",
  "Spouse Details",
  "Children Details",
  "Other Family Members",
  "Income Details",
  "Assets",
  "Liabilities",
  "Bank Accounts",
  "Upload Documents",
  "Review & Declaration"
];

const INCOME_TYPES = [
  { id: "salary", label: "Salary Income", desc: "Monthly or annual salary from employer" },
  { id: "business", label: "Business Income", desc: "Sole proprietorship, partnership, or enterprise" },
  { id: "freelancing", label: "Freelancing / IT Services", desc: "Local or foreign freelancing & consultancy" },
  { id: "rental", label: "Rental Income", desc: "Rent from residential or commercial property" },
  { id: "agriculture", label: "Agriculture Income", desc: "Agricultural land, crops, farming" },
  { id: "pension", label: "Pension / Retirement", desc: "Government or private pension" },
  { id: "foreign", label: "Foreign Income", desc: "Income earned outside Pakistan" },
  { id: "capital_gain", label: "Capital Gain", desc: "Profit on sale of property, stocks, crypto" },
  { id: "dividend", label: "Dividend Income", desc: "Dividends from company shares" },
  { id: "profit_savings", label: "Profit on Savings / Profit", desc: "Bank profit, prize bonds, NSS" },
  { id: "other", label: "Other Income", desc: "Gifts, inheritances, misc income" }
];

const ASSET_CATEGORIES = [
  "Property", "Vehicle", "Agriculture Land", "Gold / Jewelry",
  "Bank Balance", "Investment", "Shares & Stocks", "Foreign Assets", "Mutual Funds"
];

const LIABILITY_CATEGORIES = [
  "Home Loan", "Car Loan", "Business Loan", "Credit Card", "Personal Loan", "Other Debt"
];

export default function FamilyTaxWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [appId, setAppId] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [errors, setErrors] = useState({});

  // Form State
  const [applicant, setApplicant] = useState({
    fullName: "",
    fatherName: "",
    cnic: "",
    dob: "",
    gender: "Male",
    maritalStatus: "Single",
    mobile: "",
    whatsapp: "",
    email: "",
    occupation: "",
    employerName: "",
    monthlyIncome: "",
    annualIncome: 0,
    ntn: "",
    address: "",
    province: "Punjab",
    city: "",
    postalCode: ""
  });

  const [spouse, setSpouse] = useState({
    name: "",
    cnic: "",
    mobile: "",
    occupation: "",
    monthlyIncome: "",
    annualIncome: 0,
    ntn: "",
    isTaxFiler: false
  });

  const [children, setChildren] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedIncomeTypes, setSelectedIncomeTypes] = useState([]);
  const [incomeDetails, setIncomeDetails] = useState({});
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [digitalSignature, setDigitalSignature] = useState("");
  const [declaredCorrect, setDeclaredCorrect] = useState(false);

  // Coupon & Fee States
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [baseFee, setBaseFee] = useState(5000);
  const [finalFee, setFinalFee] = useState(5000);
  const [couponMsg, setCouponMsg] = useState({ text: "", error: false });
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // File Upload State
  const [uploadingCategory, setUploadingCategory] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState(null);

  // Auto calculate applicant annual income
  useEffect(() => {
    const monthly = parseFloat(applicant.monthlyIncome || 0);
    setApplicant(prev => ({ ...prev, annualIncome: monthly * 12 }));
  }, [applicant.monthlyIncome]);

  // Auto calculate spouse annual income
  useEffect(() => {
    const monthly = parseFloat(spouse.monthlyIncome || 0);
    setSpouse(prev => ({ ...prev, annualIncome: monthly * 12 }));
  }, [spouse.monthlyIncome]);

  // Sync with LocalStorage for instant refresh persistence
  useEffect(() => {
    const savedState = localStorage.getItem("familyTaxDraftLocal");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.applicant) setApplicant(prev => ({...prev, ...parsed.applicant}));
        if (parsed.spouse) setSpouse(prev => ({...prev, ...parsed.spouse}));
        if (parsed.children?.length > 0) setChildren(parsed.children);
        if (parsed.familyMembers?.length > 0) setFamilyMembers(parsed.familyMembers);
        if (parsed.selectedIncomeTypes?.length > 0) setSelectedIncomeTypes(parsed.selectedIncomeTypes);
        if (parsed.incomeDetails) setIncomeDetails(parsed.incomeDetails);
        if (parsed.assets?.length > 0) setAssets(parsed.assets);
        if (parsed.liabilities?.length > 0) setLiabilities(parsed.liabilities);
        if (parsed.bankAccounts?.length > 0) setBankAccounts(parsed.bankAccounts);
        if (parsed.currentStep && parsed.currentStep > 1) setCurrentStep(parsed.currentStep);
        if (parsed.digitalSignature) setDigitalSignature(parsed.digitalSignature);
        if (parsed.declaredCorrect !== undefined) setDeclaredCorrect(parsed.declaredCorrect);
      } catch (e) {
        console.error("Local storage load error", e);
      }
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
      applicant, spouse, children, familyMembers, selectedIncomeTypes,
      incomeDetails, assets, liabilities, bankAccounts, currentStep,
      digitalSignature, declaredCorrect
    };
    localStorage.setItem("familyTaxDraftLocal", JSON.stringify(stateToSave));
  }, [applicant, spouse, children, familyMembers, selectedIncomeTypes, incomeDetails, assets, liabilities, bankAccounts, currentStep, digitalSignature, declaredCorrect]);

  // Check for existing draft on mount
  useEffect(() => {
    fetch("/api/family-tax/applications?draftOnly=true")
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.hasDraft && resData.data) {
          const draft = resData.data;
          setAppId(draft.id);
          setOrderNumber(draft.order_number);
          setCurrentStep(draft.current_step || 1);

          setApplicant({
            fullName: draft.full_name || "",
            fatherName: draft.father_name || "",
            cnic: draft.cnic || "",
            dob: draft.dob || "",
            gender: draft.gender || "Male",
            maritalStatus: draft.marital_status || "Single",
            mobile: draft.mobile || "",
            whatsapp: draft.whatsapp || "",
            email: draft.email || "",
            occupation: draft.occupation || "",
            employerName: draft.employer_name || "",
            monthlyIncome: draft.monthly_income || "",
            annualIncome: draft.annual_income || 0,
            ntn: draft.ntn || "",
            address: draft.address || "",
            province: draft.province || "Punjab",
            city: draft.city || "",
            postalCode: draft.postal_code || ""
          });

          // Set members
          if (draft.members) {
            const sp = draft.members.find(m => m.member_type === 'spouse');
            if (sp) {
              setSpouse({
                name: sp.name || "",
                cnic: sp.cnic || "",
                mobile: sp.mobile || "",
                occupation: sp.occupation || "",
                monthlyIncome: sp.monthly_income || "",
                annualIncome: sp.annual_income || 0,
                ntn: sp.ntn || "",
                isTaxFiler: sp.is_taxpayer === 1
              });
            }

            const ch = draft.members.filter(m => m.member_type === 'child').map(c => ({
              name: c.name,
              dob: c.dob,
              bformCnic: c.bform_cnic,
              isStudent: c.is_student === 1,
              institution: c.institution,
              monthlyIncome: c.monthly_income,
              isTaxpayer: c.is_taxpayer === 1
            }));
            setChildren(ch);

            const fm = draft.members.filter(m => m.member_type === 'other').map(m => ({
              relationship: m.relationship,
              name: m.name,
              cnic: m.cnic,
              dob: m.dob,
              occupation: m.occupation,
              monthlyIncome: m.monthly_income,
              ntn: m.ntn
            }));
            setFamilyMembers(fm);
          }

          if (draft.incomeSources) {
            const types = draft.incomeSources.map(i => i.income_type);
            setSelectedIncomeTypes(types);
            const incMap = {};
            draft.incomeSources.forEach(i => {
              incMap[i.income_type] = {
                monthlyAmount: i.monthly_amount,
                annualAmount: i.annual_amount,
                details: JSON.parse(i.details_json || '{}')
              };
            });
            setIncomeDetails(incMap);
          }

          if (draft.assets) {
            setAssets(draft.assets.map(a => ({
              assetType: a.asset_type,
              title: a.title,
              purchaseDate: a.purchase_date,
              purchaseValue: a.purchase_value,
              currentValue: a.current_value,
              ownershipPercentage: a.ownership_percentage,
              details: JSON.parse(a.details_json || '{}')
            })));
          }

          if (draft.liabilities) {
            setLiabilities(draft.liabilities.map(l => ({
              liabilityType: l.liability_type,
              title: l.title,
              lenderName: l.lender_name,
              totalAmount: l.total_amount,
              remainingAmount: l.remaining_amount,
              details: JSON.parse(l.details_json || '{}')
            })));
          }

          if (draft.bankAccounts) {
            setBankAccounts(draft.bankAccounts.map(b => ({
              bankName: b.bank_name,
              accountTitle: b.account_title,
              accountNumber: b.account_number,
              iban: b.iban,
              annualTransactions: b.annual_transactions
            })));
          }

          if (draft.documents) {
            setDocuments(draft.documents.map(d => ({
              category: d.category,
              docType: d.doc_type,
              fileName: d.file_name,
              fileUrl: d.file_url,
              fileSize: d.file_size,
              fileType: d.file_type
            })));
          }
          if (draft.digital_signature) {
            setDigitalSignature(draft.digital_signature);
          }
          if (draft.declared_correct) {
            setDeclaredCorrect(draft.declared_correct === 1);
          }
        }
      })
      .catch(err => console.error("Error loading draft:", err));
  }, []);

  // Auto-Save draft every 30 seconds
  const autoSaveTimerRef = useRef(null);
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      handleSaveDraft(true);
    }, 30000);
    return () => clearInterval(autoSaveTimerRef.current);
  }, [applicant, spouse, children, familyMembers, selectedIncomeTypes, incomeDetails, assets, liabilities, bankAccounts, documents, currentStep, appId, digitalSignature, declaredCorrect]);

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!applicant.fullName?.trim()) errs.fullName = "Full Name is required";
      if (!applicant.fatherName?.trim()) errs.fatherName = "Father Name is required";
      if (!applicant.cnic?.trim()) errs.cnic = "CNIC is required";
      else if (!/^\d{5}-\d{7}-\d{1}$/.test(applicant.cnic) && !/^\d{13}$/.test(applicant.cnic.replace(/-/g, ''))) {
        errs.cnic = "Invalid CNIC format (e.g. 35202-1234567-1)";
      }
      if (!applicant.dob) errs.dob = "Date of birth is required";
      if (!applicant.mobile?.trim()) errs.mobile = "Mobile number is required";
      else if (!/^((\+92)|(0092)|0)?3\d{9}$/.test(applicant.mobile.replace(/[-+\s]/g, ''))) {
        errs.mobile = "Invalid Pakistani mobile number (e.g. 03001234567)";
      }
      if (!applicant.email?.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant.email)) {
        errs.email = "Invalid email format";
      }
      if (!applicant.occupation?.trim()) errs.occupation = "Occupation is required";
      if (!applicant.monthlyIncome) errs.monthlyIncome = "Monthly Income is required";
      if (!applicant.address?.trim()) errs.address = "Address is required";
      if (!applicant.city?.trim()) errs.city = "City is required";
    }

    if (step === 2 && applicant.maritalStatus === 'Married') {
      if (!spouse.name?.trim()) errs.spouseName = "Spouse Name is required";
      if (spouse.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(spouse.cnic) && !/^\d{13}$/.test(spouse.cnic.replace(/-/g, ''))) {
        errs.spouseCnic = "Invalid CNIC format";
      }
    }

    if (step === 3) {
      children.forEach((c, idx) => {
        if (!c.name?.trim()) errs[`child_${idx}_name`] = "Child Name is required";
      });
    }
    
    if (step === 4) {
      familyMembers.forEach((m, idx) => {
        if (!m.name?.trim()) errs[`member_${idx}_name`] = "Member Name is required";
      });
    }

    if (step === 6) {
      assets.forEach((a, idx) => {
        if (!a.title?.trim()) errs[`asset_${idx}_title`] = "Asset Title is required";
        if (!a.purchaseValue) errs[`asset_${idx}_val`] = "Purchase Value is required";
      });
    }

    if (step === 7) {
      liabilities.forEach((l, idx) => {
        if (!l.lenderName?.trim()) errs[`lia_${idx}_lender`] = "Lender Name is required";
        if (!l.totalAmount) errs[`lia_${idx}_amt`] = "Amount is required";
      });
    }

    if (step === 8) {
      bankAccounts.forEach((b, idx) => {
        if (!b.bankName?.trim()) errs[`bank_${idx}_name`] = "Bank Name is required";
        if (!b.accountTitle?.trim()) errs[`bank_${idx}_title`] = "Account Title is required";
        if (!b.accountNumber?.trim()) errs[`bank_${idx}_no`] = "Account Number is required";
      });
    }

    if (step === 10) {
      if (!declaredCorrect) errs.declaration = "You must confirm that all information is correct.";
      if (!digitalSignature?.trim()) errs.signature = "Digital signature (Full Name) is required.";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      alert("Please fix the required fields before proceeding.");
    }
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    let nextStep = currentStep + 1;
    // Skip Step 2 if Single
    if (currentStep === 1 && applicant.maritalStatus === 'Single') {
      nextStep = 3;
    }

    if (nextStep <= 10) {
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      handleSaveDraft(true);
    }
  };

  const handlePrev = () => {
    let prevStep = currentStep - 1;
    if (currentStep === 3 && applicant.maritalStatus === 'Single') {
      prevStep = 1;
    }
    if (prevStep >= 1) {
      setCurrentStep(prevStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveDraft = async (silent = false) => {
    if (!silent) setSaveStatus("Saving draft...");

    const formattedIncSources = selectedIncomeTypes.map(t => ({
      incomeType: t,
      monthlyAmount: incomeDetails[t]?.monthlyAmount || 0,
      annualAmount: (incomeDetails[t]?.monthlyAmount || 0) * 12,
      details: incomeDetails[t]?.details || {}
    }));

    const payload = {
      id: appId,
      isDraft: true,
      currentStep,
      applicant,
      spouse: applicant.maritalStatus === 'Married' ? spouse : null,
      children,
      familyMembers,
      incomeSources: formattedIncSources,
      assets,
      liabilities,
      bankAccounts,
      documents,
      digitalSignature,
      declaredCorrect
    };

    try {
      const res = await fetch("/api/family-tax/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (!appId) {
          setAppId(data.applicationId);
          setOrderNumber(data.orderNumber);
        }
        if (!silent) setSaveStatus("Draft saved!");
      } else {
        if (!silent) setSaveStatus("Failed to save draft.");
      }
    } catch (err) {
      if (!silent) setSaveStatus("Error saving draft.");
    }

    if (!silent) {
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const handleSubmitFinal = async () => {
    if (!validateStep(10)) return;
    setLoading(true);

    const formattedIncSources = selectedIncomeTypes.map(t => ({
      incomeType: t,
      monthlyAmount: incomeDetails[t]?.monthlyAmount || 0,
      annualAmount: (incomeDetails[t]?.monthlyAmount || 0) * 12,
      details: incomeDetails[t]?.details || {}
    }));

    const payload = {
      id: appId,
      isDraft: false,
      currentStep: 10,
      applicant,
      spouse: applicant.maritalStatus === 'Married' ? spouse : null,
      children,
      familyMembers,
      incomeSources: formattedIncSources,
      assets,
      liabilities,
      bankAccounts,
      documents,
      digitalSignature,
      declaredCorrect,
      couponCode: couponApplied ? couponCode : '',
      discountAmount: couponApplied ? discountAmount : 0,
      amount: couponApplied ? finalFee : baseFee
    };

    try {
      const res = await fetch("/api/family-tax/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = `/portal/family-tax/${data.applicationId}`;
      } else {
        alert(data.error || "Submission failed. Please check form entries.");
        setLoading(false);
      }
    } catch (err) {
      alert("An unexpected error occurred during submission.");
      setLoading(false);
    }
  };
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponMsg({ text: "", error: false });

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, amount: baseFee })
      });
      const data = await res.json();
      if (data.success) {
        setCouponApplied(true);
        setDiscountAmount(data.discountAmount);
        setFinalFee(data.finalAmount);
        setCouponMsg({ text: `Coupon "${data.code}" applied! Discount: PKR ${data.discountAmount}`, error: false });
      } else {
        setCouponMsg({ text: data.error || "Invalid coupon code", error: true });
      }
    } catch (err) {
      setCouponMsg({ text: "Error validating coupon", error: true });
    } finally {
      setValidatingCoupon(false);
    }
  };
  // Helper additions
  const addChild = () => {
    setChildren([...children, { name: "", dob: "", bformCnic: "", isStudent: true, institution: "", monthlyIncome: 0, isTaxpayer: false }]);
  };
  const removeChild = (idx) => {
    setChildren(children.filter((_, i) => i !== idx));
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { relationship: "Father", name: "", cnic: "", dob: "", occupation: "", monthlyIncome: 0, ntn: "" }]);
  };
  const removeFamilyMember = (idx) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== idx));
  };

  const addAsset = () => {
    setAssets([...assets, { assetType: "Property", title: "", purchaseDate: "", purchaseValue: "", currentValue: "", ownershipPercentage: 100 }]);
  };
  const removeAsset = (idx) => {
    setAssets(assets.filter((_, i) => i !== idx));
  };

  const addLiability = () => {
    setLiabilities([...liabilities, { liabilityType: "Home Loan", title: "", lenderName: "", totalAmount: "", remainingAmount: "" }]);
  };
  const removeLiability = (idx) => {
    setLiabilities(liabilities.filter((_, i) => i !== idx));
  };

  const addBankAccount = () => {
    setBankAccounts([...bankAccounts, { bankName: "", accountTitle: "", accountNumber: "", iban: "", annualTransactions: "" }]);
  };
  const removeBankAccount = (idx) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== idx));
  };

  // Upload handler
  const handleFileUpload = async (e, category, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds maximum limit of 10MB");
      return;
    }

    setUploadingCategory(`${category}-${docType}`);
    setUploadProgress(30);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    formData.append("docType", docType);

    try {
      setUploadProgress(70);
      const res = await fetch("/api/family-tax/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setUploadProgress(100);

      if (data.success) {
        const newDoc = data.file;
        setDocuments(prev => [
          ...prev.filter(d => !(d.category === category && d.docType === docType)),
          newDoc
        ]);
      } else {
        alert(data.error || "File upload failed");
      }
    } catch (err) {
      alert("File upload error");
    } finally {
      setTimeout(() => {
        setUploadingCategory(null);
        setUploadProgress(0);
      }, 500);
    }
  };

  const removeDoc = (category, docType) => {
    setDocuments(documents.filter(d => !(d.category === category && d.docType === docType)));
  };

  const getDoc = (category, docType) => {
    return documents.find(d => d.category === category && d.docType === docType);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 md:gap-8 pb-20 anim-fade-in">
      
      {/* Wizard Header & Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                Step {currentStep} of 10
              </span>
              {orderNumber && (
                <span className="text-xs font-semibold text-gray-500">
                  Ref: #{orderNumber}
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-heading text-text-primary mt-2">
              {STEP_TITLES[currentStep - 1]}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className="text-xs font-semibold text-primary animate-pulse">
                {saveStatus}
              </span>
            )}
            <button
              onClick={() => handleSaveDraft(false)}
              className="bg-gray-100 hover:bg-gray-200 text-text-primary text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Draft
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary to-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>

        {/* Horizontal Step Tabs */}
        <div className="flex items-center justify-between mt-6 overflow-x-auto pb-2 gap-2 scrollbar-none border-t border-gray-100 pt-4">
          {STEP_TITLES.map((title, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            const isSkipped = stepNum === 2 && applicant.maritalStatus === 'Single';

            return (
              <button
                key={stepNum}
                disabled={isSkipped}
                onClick={() => {
                  if (stepNum <= currentStep || isDone) setCurrentStep(stepNum);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSkipped ? 'opacity-30 cursor-not-allowed' :
                  isCurrent ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' :
                  isDone ? 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer' :
                  'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  isCurrent ? 'bg-white text-primary' : 'bg-current/10 text-current'
                }`}>
                  {isDone ? '✓' : stepNum}
                </span>
                <span className="hidden md:inline">{title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">

        {/* STEP 1: Applicant Information */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-text-primary">Primary Taxpayer Details</h3>
              <p className="text-xs text-text-secondary">Provide accuracy information matching your official CNIC and FBR records.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={applicant.fullName}
                  onChange={e => setApplicant({ ...applicant, fullName: e.target.value })}
                  placeholder="e.g. Muhammad Ali Shah"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.fullName ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Father Name *</label>
                <input
                  type="text"
                  value={applicant.fatherName}
                  onChange={e => setApplicant({ ...applicant, fatherName: e.target.value })}
                  placeholder="e.g. Tariq Mahmood Shah"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.fatherName ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                />
                {errors.fatherName && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.fatherName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">CNIC Number (13 digits) *</label>
                <input
                  type="text"
                  value={applicant.cnic}
                  onChange={e => setApplicant({ ...applicant, cnic: e.target.value })}
                  placeholder="35202-1234567-1"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.cnic ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                />
                {errors.cnic && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.cnic}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  value={applicant.dob}
                  onChange={e => setApplicant({ ...applicant, dob: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.dob ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                />
                {errors.dob && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.dob}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Gender *</label>
                <select
                  value={applicant.gender}
                  onChange={e => setApplicant({ ...applicant, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Marital Status *</label>
                <select
                  value={applicant.maritalStatus}
                  onChange={e => setApplicant({ ...applicant, maritalStatus: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Mobile Number *</label>
                <input
                  type="text"
                  value={applicant.mobile}
                  onChange={e => setApplicant({ ...applicant, mobile: e.target.value })}
                  placeholder="03001234567"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.mobile ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                />
                {errors.mobile && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.mobile}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">WhatsApp Number</label>
                <input
                  type="text"
                  value={applicant.whatsapp}
                  onChange={e => setApplicant({ ...applicant, whatsapp: e.target.value })}
                  placeholder="03001234567"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={applicant.email}
                  onChange={e => setApplicant({ ...applicant, email: e.target.value })}
                  placeholder="ali@example.com"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.email ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Occupation *</label>
                <input
                  type="text"
                  value={applicant.occupation}
                  onChange={e => setApplicant({ ...applicant, occupation: e.target.value })}
                  placeholder="e.g. Software Engineer, Doctor, Business"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.occupation ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                />
                {errors.occupation && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.occupation}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Employer / Company Name</label>
                <input
                  type="text"
                  value={applicant.employerName}
                  onChange={e => setApplicant({ ...applicant, employerName: e.target.value })}
                  placeholder="e.g. Systems Ltd"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">NTN (Optional)</label>
                <input
                  type="text"
                  value={applicant.ntn}
                  onChange={e => setApplicant({ ...applicant, ntn: e.target.value })}
                  placeholder="1234567-8"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Monthly Income (PKR) *</label>
                <input
                  type="number"
                  value={applicant.monthlyIncome}
                  onChange={e => setApplicant({ ...applicant, monthlyIncome: e.target.value })}
                  placeholder="e.g. 150000"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.monthlyIncome ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                />
                {errors.monthlyIncome && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.monthlyIncome}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Annual Income (Auto Calculated)</label>
                <div className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-bold text-primary">
                  PKR {applicant.annualIncome.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-text-primary mb-1.5">Residential Address *</label>
                <textarea
                  rows={2}
                  value={applicant.address}
                  onChange={e => setApplicant({ ...applicant, address: e.target.value })}
                  placeholder="House #, Street #, Sector/Area"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.address ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                />
                {errors.address && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Province *</label>
                <select
                  value={applicant.province}
                  onChange={e => setApplicant({ ...applicant, province: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Punjab">Punjab</option>
                  <option value="Sindh">Sindh</option>
                  <option value="KPK">Khyber Pakhtunkhwa</option>
                  <option value="Balochistan">Balochistan</option>
                  <option value="Islamabad">Islamabad Capital Territory</option>
                  <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                  <option value="AJK">Azad Jammu & Kashmir</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">City *</label>
                <input
                  type="text"
                  value={applicant.city}
                  onChange={e => setApplicant({ ...applicant, city: e.target.value })}
                  placeholder="e.g. Lahore"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.city ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Postal Code</label>
                <input
                  type="text"
                  value={applicant.postalCode}
                  onChange={e => setApplicant({ ...applicant, postalCode: e.target.value })}
                  placeholder="54000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Spouse Details */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-text-primary">Spouse Details</h3>
              <p className="text-xs text-text-secondary">Enter your spouse tax profile and income info.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Spouse Name *</label>
                <input
                  type="text"
                  value={spouse.name}
                  onChange={e => setSpouse({ ...spouse, name: e.target.value })}
                  placeholder="Full Name"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.spouseName ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.spouseName && <p className="text-xs text-red-500 mt-1">{errors.spouseName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Spouse CNIC</label>
                <input
                  type="text"
                  value={spouse.cnic}
                  onChange={e => setSpouse({ ...spouse, cnic: e.target.value })}
                  placeholder="35202-7654321-2"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Mobile Number</label>
                <input
                  type="text"
                  value={spouse.mobile}
                  onChange={e => setSpouse({ ...spouse, mobile: e.target.value })}
                  placeholder="03001234567"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Occupation</label>
                <input
                  type="text"
                  value={spouse.occupation}
                  onChange={e => setSpouse({ ...spouse, occupation: e.target.value })}
                  placeholder="e.g. Teacher / Homemaker"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Monthly Income (PKR)</label>
                <input
                  type="number"
                  value={spouse.monthlyIncome}
                  onChange={e => setSpouse({ ...spouse, monthlyIncome: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Annual Income (Auto Calculated)</label>
                <div className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-bold text-primary">
                  PKR {spouse.annualIncome.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">NTN (Optional)</label>
                <input
                  type="text"
                  value={spouse.ntn}
                  onChange={e => setSpouse({ ...spouse, ntn: e.target.value })}
                  placeholder="7654321-0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Is Spouse Active Tax Filer?</label>
                <div className="flex items-center gap-6 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="radio"
                      name="spouseFiler"
                      checked={spouse.isTaxFiler}
                      onChange={() => setSpouse({ ...spouse, isTaxFiler: true })}
                      className="accent-primary w-4 h-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="radio"
                      name="spouseFiler"
                      checked={!spouse.isTaxFiler}
                      onChange={() => setSpouse({ ...spouse, isTaxFiler: false })}
                      className="accent-primary w-4 h-4"
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Children Details */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Children Details</h3>
                <p className="text-xs text-text-secondary">Add all dependent or earning children.</p>
              </div>
              <button
                onClick={addChild}
                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>+</span> Add Child
              </button>
            </div>

            {children.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-text-secondary text-sm">No children added yet.</p>
                <button onClick={addChild} className="mt-3 text-xs font-bold text-primary hover:underline">
                  + Click here to add child
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {children.map((child, idx) => (
                  <div key={idx} className="p-4 md:p-5 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col gap-4 relative">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                      <span className="text-xs font-bold text-primary uppercase">Child #{idx + 1}</span>
                      <button
                        onClick={() => removeChild(idx)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Delete Child
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Child Name *</label>
                        <input
                          type="text"
                          value={child.name}
                          onChange={e => {
                            const updated = [...children];
                            updated[idx].name = e.target.value;
                            setChildren(updated);
                          }}
                          placeholder="Name"
                          className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${errors[`child_${idx}_name`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        />
                        {errors[`child_${idx}_name`] && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors[`child_${idx}_name`]}</p>}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={child.dob}
                          onChange={e => {
                            const updated = [...children];
                            updated[idx].dob = e.target.value;
                            setChildren(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">B-Form / CNIC</label>
                        <input
                          type="text"
                          value={child.bformCnic}
                          onChange={e => {
                            const updated = [...children];
                            updated[idx].bformCnic = e.target.value;
                            setChildren(updated);
                          }}
                          placeholder="35202-0000000-0"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Is Student?</label>
                        <select
                          value={child.isStudent ? "yes" : "no"}
                          onChange={e => {
                            const updated = [...children];
                            updated[idx].isStudent = e.target.value === "yes";
                            setChildren(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>

                      {child.isStudent && (
                        <div>
                          <label className="block text-[11px] font-bold text-text-primary mb-1">Institution Name</label>
                          <input
                            type="text"
                            value={child.institution}
                            onChange={e => {
                              const updated = [...children];
                              updated[idx].institution = e.target.value;
                              setChildren(updated);
                            }}
                            placeholder="School / College / Univ"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Monthly Income (if any)</label>
                        <input
                          type="number"
                          value={child.monthlyIncome}
                          onChange={e => {
                            const updated = [...children];
                            updated[idx].monthlyIncome = e.target.value;
                            setChildren(updated);
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Taxpayer Status</label>
                        <select
                          value={child.isTaxpayer ? "yes" : "no"}
                          onChange={e => {
                            const updated = [...children];
                            updated[idx].isTaxpayer = e.target.value === "yes";
                            setChildren(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        >
                          <option value="no">Non-Taxpayer</option>
                          <option value="yes">Active Taxpayer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Other Family Members */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Other Family Members</h3>
                <p className="text-xs text-text-secondary">Add parents, siblings, or guardians included in family tax declaration.</p>
              </div>
              <button
                onClick={addFamilyMember}
                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>+</span> Add Member
              </button>
            </div>

            {familyMembers.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-text-secondary text-sm">No additional family members added.</p>
                <button onClick={addFamilyMember} className="mt-3 text-xs font-bold text-primary hover:underline">
                  + Click here to add family member
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {familyMembers.map((member, idx) => (
                  <div key={idx} className="p-4 md:p-5 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                      <span className="text-xs font-bold text-primary uppercase">Member #{idx + 1}</span>
                      <button
                        onClick={() => removeFamilyMember(idx)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Delete Member
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Relationship *</label>
                        <select
                          value={member.relationship}
                          onChange={e => {
                            const updated = [...familyMembers];
                            updated[idx].relationship = e.target.value;
                            setFamilyMembers(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Guardian">Guardian</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={e => {
                            const updated = [...familyMembers];
                            updated[idx].name = e.target.value;
                            setFamilyMembers(updated);
                          }}
                          placeholder="Name"
                          className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${errors[`member_${idx}_name`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        />
                        {errors[`member_${idx}_name`] && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors[`member_${idx}_name`]}</p>}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">CNIC Number</label>
                        <input
                          type="text"
                          value={member.cnic}
                          onChange={e => {
                            const updated = [...familyMembers];
                            updated[idx].cnic = e.target.value;
                            setFamilyMembers(updated);
                          }}
                          placeholder="35202-0000000-0"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={member.dob}
                          onChange={e => {
                            const updated = [...familyMembers];
                            updated[idx].dob = e.target.value;
                            setFamilyMembers(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Occupation</label>
                        <input
                          type="text"
                          value={member.occupation}
                          onChange={e => {
                            const updated = [...familyMembers];
                            updated[idx].occupation = e.target.value;
                            setFamilyMembers(updated);
                          }}
                          placeholder="Occupation"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Monthly Income (PKR)</label>
                        <input
                          type="number"
                          value={member.monthlyIncome}
                          onChange={e => {
                            const updated = [...familyMembers];
                            updated[idx].monthlyIncome = e.target.value;
                            setFamilyMembers(updated);
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">NTN (Optional)</label>
                        <input
                          type="text"
                          value={member.ntn}
                          onChange={e => {
                            const updated = [...familyMembers];
                            updated[idx].ntn = e.target.value;
                            setFamilyMembers(updated);
                          }}
                          placeholder="NTN"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Income Details */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-text-primary">Income Details</h3>
              <p className="text-xs text-text-secondary">Select all sources of income that apply to your household.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {INCOME_TYPES.map(inc => {
                const isSelected = selectedIncomeTypes.includes(inc.id);
                return (
                  <label
                    key={inc.id}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedIncomeTypes([...selectedIncomeTypes, inc.id]);
                        } else {
                          setSelectedIncomeTypes(selectedIncomeTypes.filter(t => t !== inc.id));
                        }
                      }}
                      className="accent-primary w-4 h-4 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-text-primary">{inc.label}</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">{inc.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Dynamic Income Inputs */}
            {selectedIncomeTypes.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-gray-100 pt-6 mt-2">
                <h4 className="font-bold text-sm text-text-primary">Specify Details for Selected Incomes</h4>

                {selectedIncomeTypes.map(incType => {
                  const incObj = INCOME_TYPES.find(i => i.id === incType);
                  const currentData = incomeDetails[incType] || { monthlyAmount: "", details: {} };

                  return (
                    <div key={incType} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">{incObj?.label}</span>
                        <span className="text-[11px] font-semibold text-text-secondary">
                          Annual: PKR {((parseFloat(currentData.monthlyAmount) || 0) * 12).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-text-primary mb-1">Monthly Income (PKR)</label>
                          <input
                            type="number"
                            value={currentData.monthlyAmount || ""}
                            onChange={e => {
                              setIncomeDetails({
                                ...incomeDetails,
                                [incType]: { ...currentData, monthlyAmount: e.target.value }
                              });
                            }}
                            placeholder="Amount in PKR"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-text-primary mb-1">Source / Employer / Description</label>
                          <input
                            type="text"
                            value={currentData.details?.description || ""}
                            onChange={e => {
                              setIncomeDetails({
                                ...incomeDetails,
                                [incType]: {
                                  ...currentData,
                                  details: { ...currentData.details, description: e.target.value }
                                }
                              });
                            }}
                            placeholder="Details or platform name"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Assets */}
        {currentStep === 6 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Assets Breakdown</h3>
                <p className="text-xs text-text-secondary">Declare property, vehicles, gold, investments, and foreign assets.</p>
              </div>
              <button
                onClick={addAsset}
                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>+</span> Add Asset
              </button>
            </div>

            {assets.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-text-secondary text-sm">No assets added yet.</p>
                <button onClick={addAsset} className="mt-3 text-xs font-bold text-primary hover:underline">
                  + Click here to add an asset
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {assets.map((asset, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                      <span className="text-xs font-bold text-primary uppercase">Asset #{idx + 1}</span>
                      <button onClick={() => removeAsset(idx)} className="text-xs font-bold text-red-500 hover:text-red-700">Delete</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Asset Category</label>
                        <select
                          value={asset.assetType}
                          onChange={e => {
                            const updated = [...assets];
                            updated[idx].assetType = e.target.value;
                            setAssets(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        >
                          {ASSET_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">
                          {asset.assetType === 'Bank Balance' ? 'Bank Name & Account' :
                           asset.assetType === 'Vehicle' ? 'Make / Model / Registration' :
                           asset.assetType === 'Gold / Jewelry' ? 'Weight / Description' :
                           'Title / Description'}
                        </label>
                        <input
                          type="text"
                          value={asset.title}
                          onChange={e => {
                            const updated = [...assets];
                            updated[idx].title = e.target.value;
                            setAssets(updated);
                          }}
                          placeholder={
                            asset.assetType === 'Bank Balance' ? 'e.g. HBL 1234...' :
                            asset.assetType === 'Vehicle' ? 'e.g. Honda Civic 2022' :
                            'e.g. 5 Marla Plot'
                          }
                          className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${errors[`asset_${idx}_title`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        />
                        {errors[`asset_${idx}_title`] && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors[`asset_${idx}_title`]}</p>}
                      </div>

                      {['Property', 'Vehicle', 'Agriculture Land', 'Foreign Assets', 'Shares & Stocks', 'Mutual Funds', 'Investment'].includes(asset.assetType) && (
                        <>
                          <div>
                            <label className="block text-[11px] font-bold text-text-primary mb-1">Purchase Date</label>
                            <input
                              type="date"
                              value={asset.purchaseDate}
                              onChange={e => {
                                const updated = [...assets];
                                updated[idx].purchaseDate = e.target.value;
                                setAssets(updated);
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-text-primary mb-1">Purchase Value (PKR)</label>
                            <input
                              type="number"
                              value={asset.purchaseValue}
                              onChange={e => {
                                const updated = [...assets];
                                updated[idx].purchaseValue = e.target.value;
                                setAssets(updated);
                              }}
                              placeholder="0"
                              className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${errors[`asset_${idx}_val`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                            />
                            {errors[`asset_${idx}_val`] && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors[`asset_${idx}_val`]}</p>}
                          </div>
                        </>
                      )}


                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Current Value (PKR)</label>
                        <input
                          type="number"
                          value={asset.currentValue}
                          onChange={e => {
                            const updated = [...assets];
                            updated[idx].currentValue = e.target.value;
                            setAssets(updated);
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Ownership %</label>
                        <input
                          type="number"
                          value={asset.ownershipPercentage}
                          onChange={e => {
                            const updated = [...assets];
                            updated[idx].ownershipPercentage = e.target.value;
                            setAssets(updated);
                          }}
                          placeholder="100"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 7: Liabilities */}
        {currentStep === 7 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Liabilities & Debts</h3>
                <p className="text-xs text-text-secondary">Declare loans, credit card balances, and financial obligations.</p>
              </div>
              <button
                onClick={addLiability}
                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>+</span> Add Liability
              </button>
            </div>

            {liabilities.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-text-secondary text-sm">No liabilities added.</p>
                <button onClick={addLiability} className="mt-3 text-xs font-bold text-primary hover:underline">
                  + Click here to add a loan/liability
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {liabilities.map((lia, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                      <span className="text-xs font-bold text-primary uppercase">Liability #{idx + 1}</span>
                      <button onClick={() => removeLiability(idx)} className="text-xs font-bold text-red-500 hover:text-red-700">Delete</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Liability Type</label>
                        <select
                          value={lia.liabilityType}
                          onChange={e => {
                            const updated = [...liabilities];
                            updated[idx].liabilityType = e.target.value;
                            setLiabilities(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        >
                          {LIABILITY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Lender / Bank Name</label>
                        <input
                          type="text"
                          value={lia.lenderName}
                          onChange={e => {
                            const updated = [...liabilities];
                            updated[idx].lenderName = e.target.value;
                            setLiabilities(updated);
                          }}
                          placeholder="e.g. Meezan Bank / HBL"
                          className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${errors[`lia_${idx}_lender`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        />
                        {errors[`lia_${idx}_lender`] && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors[`lia_${idx}_lender`]}</p>}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Total Loan Amount (PKR)</label>
                        <input
                          type="number"
                          value={lia.totalAmount}
                          onChange={e => {
                            const updated = [...liabilities];
                            updated[idx].totalAmount = e.target.value;
                            setLiabilities(updated);
                          }}
                          placeholder="0"
                          className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${errors[`lia_${idx}_amt`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        />
                        {errors[`lia_${idx}_amt`] && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors[`lia_${idx}_amt`]}</p>}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Remaining Outstanding Balance (PKR)</label>
                        <input
                          type="number"
                          value={lia.remainingAmount}
                          onChange={e => {
                            const updated = [...liabilities];
                            updated[idx].remainingAmount = e.target.value;
                            setLiabilities(updated);
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 8: Bank Accounts */}
        {currentStep === 8 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Bank Accounts</h3>
                <p className="text-xs text-text-secondary">List all bank accounts maintained by family members.</p>
              </div>
              <button
                onClick={addBankAccount}
                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>+</span> Add Bank Account
              </button>
            </div>

            {bankAccounts.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-text-secondary text-sm">No bank accounts added.</p>
                <button onClick={addBankAccount} className="mt-3 text-xs font-bold text-primary hover:underline">
                  + Click here to add a bank account
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {bankAccounts.map((acc, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                      <span className="text-xs font-bold text-primary uppercase">Bank Account #{idx + 1}</span>
                      <button onClick={() => removeBankAccount(idx)} className="text-xs font-bold text-red-500 hover:text-red-700">Delete</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Bank Name *</label>
                        <input
                          type="text"
                          value={acc.bankName}
                          onChange={e => {
                            const updated = [...bankAccounts];
                            updated[idx].bankName = e.target.value;
                            setBankAccounts(updated);
                          }}
                          placeholder="e.g. Meezan Bank"
                          className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${errors[`bank_${idx}_name`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        />
                        {errors[`bank_${idx}_name`] && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors[`bank_${idx}_name`]}</p>}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Account Title *</label>
                        <input
                          type="text"
                          value={acc.accountTitle}
                          onChange={e => {
                            const updated = [...bankAccounts];
                            updated[idx].accountTitle = e.target.value;
                            setBankAccounts(updated);
                          }}
                          placeholder="Account Title"
                          className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${errors[`bank_${idx}_title`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        />
                        {errors[`bank_${idx}_title`] && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors[`bank_${idx}_title`]}</p>}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Account Number *</label>
                        <input
                          type="text"
                          value={acc.accountNumber}
                          onChange={e => {
                            const updated = [...bankAccounts];
                            updated[idx].accountNumber = e.target.value;
                            setBankAccounts(updated);
                          }}
                          placeholder="Account Number"
                          className={`w-full px-3 py-2 rounded-lg border text-xs bg-white ${errors[`bank_${idx}_no`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        />
                        {errors[`bank_${idx}_no`] && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors[`bank_${idx}_no`]}</p>}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">IBAN (24 chars)</label>
                        <input
                          type="text"
                          value={acc.iban}
                          onChange={e => {
                            const updated = [...bankAccounts];
                            updated[idx].iban = e.target.value;
                            setBankAccounts(updated);
                          }}
                          placeholder="PK36MEZN0000000000000000"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-primary mb-1">Annual Turnover / Credit Volume (PKR)</label>
                        <input
                          type="number"
                          value={acc.annualTransactions}
                          onChange={e => {
                            const updated = [...bankAccounts];
                            updated[idx].annualTransactions = e.target.value;
                            setBankAccounts(updated);
                          }}
                          placeholder="Total yearly transaction sum"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 9: Upload Documents */}
        {currentStep === 9 && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-text-primary">Upload Required Documents</h3>
              <p className="text-xs text-text-secondary">Upload high quality scans or photos (PDF, JPG, PNG up to 10MB each).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Applicant Card */}
              <div className="p-5 rounded-2xl border border-gray-200 bg-white flex flex-col gap-4 shadow-sm">
                <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Applicant Documents
                </h4>
                <div className="flex flex-col gap-3">
                  {[
                    { docType: "cnic_front", title: "CNIC Front Image" },
                    { docType: "cnic_back", title: "CNIC Back Image" },
                    { docType: "photo", title: "Passport Photo / Selfie" }
                  ].map(item => {
                    const doc = getDoc('applicant', item.docType);
                    const isUploading = uploadingCategory === `applicant-${item.docType}`;
                    return (
                      <div key={item.docType} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-text-primary">{item.title}</p>
                          {doc && <p className="text-[10px] text-green-600 font-semibold truncate max-w-[200px]">{doc.fileName}</p>}
                        </div>

                        {doc ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setPreviewFile(doc)} className="text-[11px] font-bold text-primary hover:underline">Preview</button>
                            <button onClick={() => removeDoc('applicant', item.docType)} className="text-[11px] font-bold text-red-500 hover:underline">Remove</button>
                          </div>
                        ) : (
                          <label className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all">
                            {isUploading ? `Uploading ${uploadProgress}%` : "Upload File"}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={e => handleFileUpload(e, 'applicant', item.docType)}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spouse Card */}
              {applicant.maritalStatus === 'Married' && (
                <div className="p-5 rounded-2xl border border-gray-200 bg-white flex flex-col gap-4 shadow-sm">
                  <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Spouse Documents
                  </h4>
                  <div className="flex flex-col gap-3">
                    {[
                      { docType: "spouse_cnic_front", title: "Spouse CNIC Front" },
                      { docType: "spouse_cnic_back", title: "Spouse CNIC Back" }
                    ].map(item => {
                      const doc = getDoc('spouse', item.docType);
                      const isUploading = uploadingCategory === `spouse-${item.docType}`;
                      return (
                        <div key={item.docType} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-text-primary">{item.title}</p>
                            {doc && <p className="text-[10px] text-green-600 font-semibold truncate max-w-[200px]">{doc.fileName}</p>}
                          </div>
                          {doc ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setPreviewFile(doc)} className="text-[11px] font-bold text-primary hover:underline">Preview</button>
                              <button onClick={() => removeDoc('spouse', item.docType)} className="text-[11px] font-bold text-red-500 hover:underline">Remove</button>
                            </div>
                          ) : (
                            <label className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                              {isUploading ? `Uploading ${uploadProgress}%` : "Upload File"}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => handleFileUpload(e, 'spouse', item.docType)} />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Income Proof Card */}
              <div className="p-5 rounded-2xl border border-gray-200 bg-white flex flex-col gap-4 shadow-sm">
                <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Income Proof Documents
                </h4>
                <div className="flex flex-col gap-3">
                  {[
                    { docType: "salary_slip", title: "Salary Slip / Certificate" },
                    { docType: "business_docs", title: "Business Tax Registration / Proof" },
                    { docType: "bank_statement", title: "Annual Bank Statement (PDF)" }
                  ].map(item => {
                    const doc = getDoc('income', item.docType);
                    const isUploading = uploadingCategory === `income-${item.docType}`;
                    return (
                      <div key={item.docType} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-text-primary">{item.title}</p>
                          {doc && <p className="text-[10px] text-green-600 font-semibold truncate max-w-[200px]">{doc.fileName}</p>}
                        </div>
                        {doc ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setPreviewFile(doc)} className="text-[11px] font-bold text-primary hover:underline">Preview</button>
                            <button onClick={() => removeDoc('income', item.docType)} className="text-[11px] font-bold text-red-500 hover:underline">Remove</button>
                          </div>
                        ) : (
                          <label className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                            {isUploading ? `Uploading ${uploadProgress}%` : "Upload File"}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => handleFileUpload(e, 'income', item.docType)} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assets & Previous Tax Card */}
              <div className="p-5 rounded-2xl border border-gray-200 bg-white flex flex-col gap-4 shadow-sm">
                <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Assets & Previous Tax Records
                </h4>
                <div className="flex flex-col gap-3">
                  {[
                    { category: "assets", docType: "property_registry", title: "Property Registry / Vehicle Reg" },
                    { category: "previous_tax", docType: "previous_return", title: "Previous FBR Tax Return PDF" },
                    { category: "previous_tax", docType: "wealth_statement", title: "Previous Wealth Statement" }
                  ].map(item => {
                    const doc = getDoc(item.category, item.docType);
                    const isUploading = uploadingCategory === `${item.category}-${item.docType}`;
                    return (
                      <div key={item.docType} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-text-primary">{item.title}</p>
                          {doc && <p className="text-[10px] text-green-600 font-semibold truncate max-w-[200px]">{doc.fileName}</p>}
                        </div>
                        {doc ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setPreviewFile(doc)} className="text-[11px] font-bold text-primary hover:underline">Preview</button>
                            <button onClick={() => removeDoc(item.category, item.docType)} className="text-[11px] font-bold text-red-500 hover:underline">Remove</button>
                          </div>
                        ) : (
                          <label className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                            {isUploading ? `Uploading ${uploadProgress}%` : "Upload File"}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => handleFileUpload(e, item.category, item.docType)} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: Review & Declaration */}
        {currentStep === 10 && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-text-primary">Review & Digital Declaration</h3>
              <p className="text-xs text-text-secondary">Carefully verify your application details before submission.</p>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 md:p-6 flex flex-col gap-4 text-xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-bold text-sm text-text-primary">1. Applicant Profile</span>
                <button onClick={() => setCurrentStep(1)} className="text-primary font-bold hover:underline">Edit</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><span className="text-gray-500">Name:</span> <strong className="text-text-primary">{applicant.fullName}</strong></div>
                <div><span className="text-gray-500">CNIC:</span> <strong className="text-text-primary">{applicant.cnic}</strong></div>
                <div><span className="text-gray-500">Mobile:</span> <strong className="text-text-primary">{applicant.mobile}</strong></div>
                <div><span className="text-gray-500">Income:</span> <strong className="text-primary">PKR {applicant.annualIncome.toLocaleString()}/yr</strong></div>
              </div>

              <div className="flex items-center justify-between border-b border-gray-200 pb-2 mt-2">
                <span className="font-bold text-sm text-text-primary">2. Family & Income Overview</span>
                <button onClick={() => setCurrentStep(5)} className="text-primary font-bold hover:underline">Edit</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><span className="text-gray-500">Marital Status:</span> <strong>{applicant.maritalStatus}</strong></div>
                <div><span className="text-gray-500">Children:</span> <strong>{children.length}</strong></div>
                <div><span className="text-gray-500">Other Members:</span> <strong>{familyMembers.length}</strong></div>
                <div><span className="text-gray-500">Selected Incomes:</span> <strong>{selectedIncomeTypes.length}</strong></div>
              </div>

              <div className="flex items-center justify-between border-b border-gray-200 pb-2 mt-2">
                <span className="font-bold text-sm text-text-primary">3. Assets & Documents</span>
                <button onClick={() => setCurrentStep(9)} className="text-primary font-bold hover:underline">Edit</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><span className="text-gray-500">Assets Count:</span> <strong>{assets.length}</strong></div>
                <div><span className="text-gray-500">Bank Accounts:</span> <strong>{bankAccounts.length}</strong></div>
                <div><span className="text-gray-500">Uploaded Files:</span> <strong>{documents.length}</strong></div>
                <div>
                  <span className="text-gray-500">Fee Amount:</span> 
                  <strong className="text-green-600 font-bold ml-1">
                    PKR {couponApplied ? finalFee.toLocaleString() : baseFee.toLocaleString()}
                    {couponApplied && <span className="text-[10px] text-primary ml-1">(Discounted)</span>}
                  </strong>
                </div>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 flex flex-col gap-3">
              <h4 className="font-bold text-sm text-text-primary">Have a Coupon Code / Discount Voucher?</h4>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Enter Promo Code (e.g. SAVE1000)"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="bg-primary text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {validatingCoupon ? "Checking..." : "Apply Coupon"}
                </button>
              </div>
              {couponMsg.text && (
                <p className={`text-xs font-bold ${couponMsg.error ? 'text-red-500' : 'text-green-600'}`}>
                  {couponMsg.text}
                </p>
              )}
              {couponApplied && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs font-bold">
                  <span className="text-gray-600">Total Filing Fee After Discount:</span>
                  <span className="text-primary text-sm">PKR {finalFee.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Declaration Checkbox */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col gap-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declaredCorrect}
                  onChange={e => setDeclaredCorrect(e.target.checked)}
                  className="accent-primary w-5 h-5 mt-0.5"
                />
                <span className="text-xs font-bold text-amber-900 leading-relaxed">
                  I solemnly declare that all information provided in this Family Tax Filing application is true, accurate, complete, and correct according to my official records and FBR compliance.
                </span>
              </label>
              {errors.declaration && <p className="text-xs text-red-500 font-semibold">{errors.declaration}</p>}
            </div>

            {/* Digital Signature */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">Digital Signature (Type your Full Name as signature) *</label>
              <input
                type="text"
                value={digitalSignature}
                onChange={e => setDigitalSignature(e.target.value)}
                placeholder="Type full legal name"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.signature ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
              />
              {errors.signature && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.signature}</p>}
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Bar Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentStep === 1 ? 'opacity-30 cursor-not-allowed text-gray-400' : 'bg-gray-100 text-text-primary hover:bg-gray-200'
            }`}
          >
            ← Previous
          </button>

          <div className="flex items-center gap-3">
            {currentStep < 10 ? (
              <button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-8 py-3 rounded-xl shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Next Step →
              </button>
            ) : (
              <button
                onClick={handleSubmitFinal}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-10 py-3.5 rounded-xl shadow-lg shadow-green-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                {loading ? "Submitting Application..." : "Submit Application & Proceed to Payment →"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-text-primary truncate">{previewFile.fileName}</h3>
              <button onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 rounded-xl p-2">
              {previewFile.fileType.includes('pdf') ? (
                <iframe src={previewFile.fileUrl} className="w-full h-[500px] rounded-lg" title="PDF Preview" />
              ) : (
                <img src={previewFile.fileUrl} alt="Preview" className="max-h-[500px] object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
