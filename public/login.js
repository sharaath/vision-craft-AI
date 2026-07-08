/* -------------------------------------------------------------
 * login.js
 * Logic, validation, animations, and API integrations for VisionCraft AI
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Login
  const loginForm = document.getElementById('login-form');
  const identifierInput = document.getElementById('identifier');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const eyeOpenIcon = document.getElementById('eye-open');
  const eyeClosedIcon = document.getElementById('eye-closed');
  const pwdStrengthLabel = document.getElementById('password-strength-label');
  const strengthBars = document.querySelectorAll('.strength-bar');
  const loginBtn = document.getElementById('login-btn');
  const loginSpinner = document.getElementById('login-spinner');
  const errorSummary = document.getElementById('error-summary');
  const rememberMeCheckbox = document.getElementById('remember-me');

  // DOM Elements - Errors
  const identifierError = document.getElementById('identifier-error');
  const passwordError = document.getElementById('password-error');

  // DOM Elements - Register Modal
  const registerBtn = document.getElementById('register-btn');
  const registerModal = document.getElementById('register-modal');
  const closeRegisterModalBtn = document.getElementById('close-register-modal');
  const regNameInput = document.getElementById('reg-name');
  const regEmailInput = document.getElementById('reg-email');
  const regMobileInput = document.getElementById('reg-mobile');
  const regPasswordInput = document.getElementById('reg-password');
  const regNameError = document.getElementById('reg-name-error');
  const regEmailError = document.getElementById('reg-email-error');
  const regMobileError = document.getElementById('reg-mobile-error');
  const regPasswordError = document.getElementById('reg-password-error');
  const regSubmitBtn = document.getElementById('reg-submit-btn');
  const regSpinner = document.getElementById('reg-spinner');
  const regStepForm = document.getElementById('reg-step-form');
  const regStepOtp = document.getElementById('reg-step-otp');
  const regOtpInput = document.getElementById('reg-otp');
  const regOtpError = document.getElementById('reg-otp-error');
  const regVerifyBtn = document.getElementById('reg-verify-btn');
  const regVerifySpinner = document.getElementById('reg-verify-spinner');
  const regStepSuccess = document.getElementById('reg-step-success');
  const regLoginRedirectBtn = document.getElementById('reg-login-redirect');

  // DOM Elements - Forgot Password Modal
  const forgotLink = document.getElementById('forgot-password-link');
  const forgotModal = document.getElementById('forgot-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const fpIdentifierInput = document.getElementById('fp-identifier');
  const fpIdentifierError = document.getElementById('fp-identifier-error');
  const sendOtpBtn = document.getElementById('send-otp-btn');
  const otpFields = document.querySelectorAll('.otp-field');
  const otpTimerLabel = document.getElementById('otp-timer');
  const resendOtpLink = document.getElementById('resend-otp-link');
  const verifyOtpBtn = document.getElementById('verify-otp-btn');
  const fpNewPwdInput = document.getElementById('fp-new-pwd');
  const fpNewPwdError = document.getElementById('fp-new-pwd-error');
  const fpConfirmPwdInput = document.getElementById('fp-confirm-pwd');
  const fpConfirmPwdError = document.getElementById('fp-confirm-pwd-error');
  const resetPasswordBtn = document.getElementById('reset-password-btn');
  const redirectLoginBtn = document.getElementById('fp-login-redirect');

  // Modal Step Containers
  const step1 = document.getElementById('fp-step-1');
  const step2 = document.getElementById('fp-step-2');
  const step3 = document.getElementById('fp-step-3');
  const step4 = document.getElementById('fp-step-4');

  // Spinners
  const fpSpinner1 = document.getElementById('fp-spinner-1');
  const fpSpinner2 = document.getElementById('fp-spinner-2');
  const fpSpinner3 = document.getElementById('fp-spinner-3');

  // State Variables
  let otpCountdownInterval = null;
  let activeFpIdentifier = '';

  // -----------------------------------------------------------
  // 1. Initial Setup (Remember Me Prepopulation)
  // -----------------------------------------------------------
  const savedIdentifier = localStorage.getItem('visioncraft_saved_username');
  if (savedIdentifier) {
    identifierInput.value = savedIdentifier;
    rememberMeCheckbox.checked = true;
    validateField(identifierInput, validateIdentifier, identifierError);
    toggleLoginButtonState();
  }

  // -----------------------------------------------------------
  // 2. Password Visibility Toggle
  // -----------------------------------------------------------
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    eyeOpenIcon.classList.toggle('hidden');
    eyeClosedIcon.classList.toggle('hidden');
  });

  // -----------------------------------------------------------
  // 3. Validation Helpers & Logic
  // -----------------------------------------------------------
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const mobileRegex = /^[0-9]{10}$/;

  function validateIdentifier(value) {
    const cleanValue = value.trim();
    if (!cleanValue) {
      return 'Email or Mobile number is required.';
    }
    
    // Check if user is typing numbers (mobile path) or letters (email path)
    const hasDigitsOnly = /^[0-9]+$/.test(cleanValue);
    if (hasDigitsOnly) {
      if (cleanValue.length !== 10) {
        return 'Mobile number must be exactly 10 digits.';
      }
      return ''; // Valid mobile
    }

    // Default to email validation
    if (!emailRegex.test(cleanValue)) {
      return 'Please enter a valid email address.';
    }
    return ''; // Valid email
  }

  function validatePassword(value) {
    if (!value) {
      return 'Password is required.';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return '';
  }

  function validateField(inputElement, validationFunc, errorElement) {
    const errorMsg = validationFunc(inputElement.value);
    if (errorMsg) {
      errorElement.textContent = errorMsg;
      inputElement.classList.add('error');
      return false;
    } else {
      errorElement.textContent = '';
      inputElement.classList.remove('error');
      return true;
    }
  }

  function toggleLoginButtonState() {
    const isIdValid = validateIdentifier(identifierInput.value) === '';
    const isPwdValid = validatePassword(passwordInput.value) === '';
    loginBtn.disabled = !(isIdValid && isPwdValid);
  }

  // Real-time Validation Triggers
  identifierInput.addEventListener('input', () => {
    validateField(identifierInput, validateIdentifier, identifierError);
    toggleLoginButtonState();
  });

  passwordInput.addEventListener('input', () => {
    validateField(passwordInput, validatePassword, passwordError);
    checkPasswordStrength(passwordInput.value);
    toggleLoginButtonState();
  });

  // -----------------------------------------------------------
  // 4. Password Strength Algorithm
  // -----------------------------------------------------------
  function checkPasswordStrength(password) {
    // Reset state
    strengthBars.forEach(bar => {
      bar.style.backgroundColor = 'rgba(255,255,255,0.1)';
    });
    pwdStrengthLabel.textContent = '';

    if (!password) return;

    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    // Contains letters & numbers
    if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) score++;
    // Contains special char or uppercase
    if (/[^a-zA-Z0-9]/.test(password) || /[A-Z]/.test(password)) score++;

    if (password.length < 8) {
      // Automatic weak if less than 8 chars
      strengthBars[0].style.backgroundColor = 'var(--error-color)';
      pwdStrengthLabel.textContent = 'Weak';
      pwdStrengthLabel.style.color = 'var(--error-color)';
    } else if (score === 1) {
      strengthBars[0].style.backgroundColor = 'var(--error-color)';
      pwdStrengthLabel.textContent = 'Weak';
      pwdStrengthLabel.style.color = 'var(--error-color)';
    } else if (score === 2) {
      strengthBars[0].style.backgroundColor = '#f59e0b'; // Amber
      strengthBars[1].style.backgroundColor = '#f59e0b';
      pwdStrengthLabel.textContent = 'Medium';
      pwdStrengthLabel.style.color = '#f59e0b';
    } else if (score === 3) {
      strengthBars[0].style.backgroundColor = 'var(--success-color)';
      strengthBars[1].style.backgroundColor = 'var(--success-color)';
      strengthBars[2].style.backgroundColor = 'var(--success-color)';
      pwdStrengthLabel.textContent = 'Strong';
      pwdStrengthLabel.style.color = 'var(--success-color)';
    }
  }

  // -----------------------------------------------------------
  // 5. Backend Integrations (Fetch Placeholders)
  // -----------------------------------------------------------
  async function apiCall(endpoint, payload) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'An error occurred. Please try again.');
      }
      return data;
    } catch (err) {
      console.error(`API error on ${endpoint}:`, err);
      throw new Error(err.message || 'Network error. Please try again.');
    }
  }

  // -----------------------------------------------------------
  // 6. Login Form Submission Flow
  // -----------------------------------------------------------
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Final client-side sanity check
    const isIdValid = validateField(identifierInput, validateIdentifier, identifierError);
    const isPwdValid = validateField(passwordInput, validatePassword, passwordError);

    if (!isIdValid || !isPwdValid) return;

    // Loading UI state
    setLoadingState(true);
    errorSummary.classList.add('hidden');

    const payload = {
      identifier: identifierInput.value,
      password: passwordInput.value
    };

    try {
      const response = await apiCall('/api/login', payload);
      
      // Save credentials if Remember Me is checked
      if (rememberMeCheckbox.checked) {
        localStorage.setItem('visioncraft_saved_username', identifierInput.value);
      } else {
        localStorage.removeItem('visioncraft_saved_username');
      }

      // Save Auth details & Redirect
      localStorage.setItem('visioncraft_jwt_token', response.token);
      localStorage.setItem('visioncraft_user_name', response.name || 'Innovator');
      
      // Beautiful fade transition on redirect
      document.body.style.opacity = 0;
      document.body.style.transition = 'opacity 0.4s ease';
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 400);

    } catch (err) {
      errorSummary.textContent = err.message || 'An unexpected error occurred.';
      errorSummary.classList.remove('hidden');
      setLoadingState(false);
    }
  });

  function setLoadingState(isLoading) {
    if (isLoading) {
      loginBtn.disabled = true;
      loginSpinner.classList.remove('hidden');
      loginBtn.querySelector('.btn-text').style.opacity = 0;
      identifierInput.disabled = true;
      passwordInput.disabled = true;
    } else {
      loginSpinner.classList.add('hidden');
      loginBtn.querySelector('.btn-text').style.opacity = 1;
      identifierInput.disabled = false;
      passwordInput.disabled = false;
      toggleLoginButtonState();
    }
  }

  // -----------------------------------------------------------
  // 7. Forgot Password Modal Flow (Multi-Step Forms)
  // -----------------------------------------------------------
  
  // Show Modal
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotModal.classList.remove('hidden');
    resetFpModalState();
  });

  // Hide Modal
  closeModalBtn.addEventListener('click', () => {
    forgotModal.classList.add('hidden');
    clearInterval(otpCountdownInterval);
  });

  // Close Modal on clicking outside
  forgotModal.addEventListener('click', (e) => {
    if (e.target === forgotModal) {
      forgotModal.classList.add('hidden');
      clearInterval(otpCountdownInterval);
    }
  });

  function resetFpModalState() {
    step1.classList.remove('hidden');
    step2.classList.add('hidden');
    step3.classList.add('hidden');
    step4.classList.add('hidden');
    
    fpIdentifierInput.value = '';
    fpIdentifierError.textContent = '';
    fpIdentifierInput.classList.remove('error');
    
    otpFields.forEach(field => field.value = '');
    document.getElementById('fp-otp-error').textContent = '';
    
    fpNewPwdInput.value = '';
    fpConfirmPwdInput.value = '';
    fpNewPwdError.textContent = '';
    fpConfirmPwdError.textContent = '';
    
    clearInterval(otpCountdownInterval);
    resendOtpLink.classList.add('hidden');
    otpTimerLabel.classList.remove('hidden');
  }

  // --- Step 1: Send OTP ---
  sendOtpBtn.addEventListener('click', async () => {
    const isIdValid = validateField(fpIdentifierInput, validateIdentifier, fpIdentifierError);
    if (!isIdValid) return;

    activeFpIdentifier = fpIdentifierInput.value.trim();
    
    // Set UI Loader
    sendOtpBtn.disabled = true;
    fpSpinner1.classList.remove('hidden');
    sendOtpBtn.querySelector('.btn-text').style.opacity = 0;

    try {
      await apiCall('/api/send-otp', { identifier: activeFpIdentifier });
      
      // Advance to OTP Step
      step1.classList.add('hidden');
      step2.classList.remove('hidden');
      
      // Start Countdown & Focus first digit input
      startOtpTimer();
      setTimeout(() => otpFields[0].focus(), 150);

    } catch (err) {
      fpIdentifierError.textContent = err.message;
      fpIdentifierInput.classList.add('error');
    } finally {
      sendOtpBtn.disabled = false;
      fpSpinner1.classList.add('hidden');
      sendOtpBtn.querySelector('.btn-text').style.opacity = 1;
    }
  });

  // --- Step 2: OTP Focus Routing & Verifying ---
  otpFields.forEach((field, index) => {
    // Move forward on digit input
    field.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.match(/^[0-9]$/)) {
        if (index < otpFields.length - 1) {
          otpFields[index + 1].focus();
        }
      } else {
        field.value = '';
      }
      clearOtpErrors();
    });

    // Move backward on backspace key
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!field.value && index > 0) {
          otpFields[index - 1].value = '';
          otpFields[index - 1].focus();
        }
      }
    });

    // Handle pasting a full 6-digit OTP code
    field.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text').trim();
      if (pasteData.match(/^[0-9]{6}$/)) {
        otpFields.forEach((f, i) => {
          f.value = pasteData[i];
        });
        otpFields[5].focus();
        clearOtpErrors();
      }
    });
  });

  function clearOtpErrors() {
    document.getElementById('fp-otp-error').textContent = '';
  }

  function startOtpTimer() {
    clearInterval(otpCountdownInterval);
    resendOtpLink.classList.add('hidden');
    otpTimerLabel.classList.remove('hidden');
    
    let secondsLeft = 59;
    otpTimerLabel.textContent = `Resend OTP in ${secondsLeft}s`;

    otpCountdownInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(otpCountdownInterval);
        otpTimerLabel.classList.add('hidden');
        resendOtpLink.classList.remove('hidden');
      } else {
        otpTimerLabel.textContent = `Resend OTP in ${secondsLeft}s`;
      }
    }, 1000);
  }

  // Resend OTP Link Trigger
  resendOtpLink.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/send-otp', { identifier: activeFpIdentifier });
      startOtpTimer();
      otpFields.forEach(f => f.value = '');
      otpFields[0].focus();
    } catch (err) {
      document.getElementById('fp-otp-error').textContent = err.message;
    }
  });

  // Verify OTP Action
  verifyOtpBtn.addEventListener('click', async () => {
    // Gather OTP code string
    let otpCode = '';
    otpFields.forEach(f => otpCode += f.value);

    if (otpCode.length !== 6) {
      document.getElementById('fp-otp-error').textContent = 'Please enter the full 6-digit code.';
      return;
    }

    verifyOtpBtn.disabled = true;
    fpSpinner2.classList.remove('hidden');
    verifyOtpBtn.querySelector('.btn-text').style.opacity = 0;

    try {
      await apiCall('/api/verify-otp', { identifier: activeFpIdentifier, otp: otpCode });
      
      // Advance to Password Reset Step
      step2.classList.add('hidden');
      step3.classList.remove('hidden');
      setTimeout(() => fpNewPwdInput.focus(), 150);

    } catch (err) {
      document.getElementById('fp-otp-error').textContent = err.message;
      otpFields.forEach(f => f.classList.add('error'));
      setTimeout(() => otpFields.forEach(f => f.classList.remove('error')), 1500);
    } finally {
      verifyOtpBtn.disabled = false;
      fpSpinner2.classList.add('hidden');
      verifyOtpBtn.querySelector('.btn-text').style.opacity = 1;
    }
  });

  // --- Step 3: Password Reset Submissions ---
  resetPasswordBtn.addEventListener('click', async () => {
    const newPwd = fpNewPwdInput.value;
    const confirmPwd = fpConfirmPwdInput.value;

    let isValid = true;

    if (newPwd.length < 8) {
      fpNewPwdError.textContent = 'Password must be at least 8 characters.';
      fpNewPwdInput.classList.add('error');
      isValid = false;
    } else {
      fpNewPwdError.textContent = '';
      fpNewPwdInput.classList.remove('error');
    }

    if (newPwd !== confirmPwd) {
      fpConfirmPwdError.textContent = 'Passwords do not match.';
      fpConfirmPwdInput.classList.add('error');
      isValid = false;
    } else {
      fpConfirmPwdError.textContent = '';
      fpConfirmPwdInput.classList.remove('error');
    }

    if (!isValid) return;

    resetPasswordBtn.disabled = true;
    fpSpinner3.classList.remove('hidden');
    resetPasswordBtn.querySelector('.btn-text').style.opacity = 0;

    try {
      await apiCall('/api/reset-password', { identifier: activeFpIdentifier, password: newPwd });
      
      // Advance to final success modal
      step3.classList.add('hidden');
      step4.classList.remove('hidden');

    } catch (err) {
      fpNewPwdError.textContent = err.message;
    } finally {
      resetPasswordBtn.disabled = false;
      fpSpinner3.classList.add('hidden');
      resetPasswordBtn.querySelector('.btn-text').style.opacity = 1;
    }
  });

  // --- Step 4: Success Redirection Close ---
  redirectLoginBtn.addEventListener('click', () => {
    forgotModal.classList.add('hidden');
    // Autofill identifier input with updated ID for convenience
    identifierInput.value = activeFpIdentifier;
    validateField(identifierInput, validateIdentifier, identifierError);
    passwordInput.value = '';
    passwordInput.focus();
  });

  // -----------------------------------------------------------
  // 8. Register Modal Flow
  // -----------------------------------------------------------
  
  // Show Register Modal
  registerBtn.addEventListener('click', () => {
    registerModal.classList.remove('hidden');
    resetRegModalState();
  });

  // Hide Register Modal
  closeRegisterModalBtn.addEventListener('click', () => {
    registerModal.classList.add('hidden');
  });

  // Close Register Modal on clicking outside
  registerModal.addEventListener('click', (e) => {
    if (e.target === registerModal) {
      registerModal.classList.add('hidden');
    }
  });

  function resetRegModalState() {
    regStepForm.classList.remove('hidden');
    regStepOtp.classList.add('hidden');
    regStepSuccess.classList.add('hidden');
    
    regNameInput.value = '';
    regEmailInput.value = '';
    regMobileInput.value = '';
    regPasswordInput.value = '';
    regOtpInput.value = '';
    
    regNameError.textContent = '';
    regEmailError.textContent = '';
    regMobileError.textContent = '';
    regPasswordError.textContent = '';
    regOtpError.textContent = '';
    
    regNameInput.classList.remove('error');
    regEmailInput.classList.remove('error');
    regMobileInput.classList.remove('error');
    regPasswordInput.classList.remove('error');
    regOtpInput.classList.remove('error');
  }

  // Register Form Submit
  regSubmitBtn.addEventListener('click', async () => {
    let isValid = true;

    // Validate Name
    if (!regNameInput.value.trim()) {
      regNameError.textContent = 'Full name is required.';
      regNameInput.classList.add('error');
      isValid = false;
    } else {
      regNameError.textContent = '';
      regNameInput.classList.remove('error');
    }

    // Validate Email
    if (!emailRegex.test(regEmailInput.value.trim())) {
      regEmailError.textContent = 'Please enter a valid email address.';
      regEmailInput.classList.add('error');
      isValid = false;
    } else {
      regEmailError.textContent = '';
      regEmailInput.classList.remove('error');
    }

    // Validate Mobile
    if (!mobileRegex.test(regMobileInput.value.trim())) {
      regMobileError.textContent = 'Mobile number must be exactly 10 digits.';
      regMobileInput.classList.add('error');
      isValid = false;
    } else {
      regMobileError.textContent = '';
      regMobileInput.classList.remove('error');
    }

    // Validate Password
    if (regPasswordInput.value.length < 8) {
      regPasswordError.textContent = 'Password must be at least 8 characters.';
      regPasswordInput.classList.add('error');
      isValid = false;
    } else {
      regPasswordError.textContent = '';
      regPasswordInput.classList.remove('error');
    }

    if (!isValid) return;

    regSubmitBtn.disabled = true;
    regSpinner.classList.remove('hidden');
    regSubmitBtn.querySelector('.btn-text').style.opacity = 0;

    const payload = {
      name: regNameInput.value.trim(),
      email: regEmailInput.value.trim(),
      mobile: regMobileInput.value.trim(),
      password: regPasswordInput.value
    };

    try {
      await apiCall('/api/register/send-otp', payload);
      regStepForm.classList.add('hidden');
      regStepOtp.classList.remove('hidden');
      regOtpInput.value = '';
      regOtpError.textContent = '';
    } catch (err) {
      regEmailError.textContent = err.message;
      regEmailInput.classList.add('error');
    } finally {
      regSubmitBtn.disabled = false;
      regSpinner.classList.add('hidden');
      regSubmitBtn.querySelector('.btn-text').style.opacity = 1;
    }
  });

  // Verify Registration OTP Submit
  regVerifyBtn.addEventListener('click', async () => {
    const otpVal = regOtpInput.value.trim();
    if (otpVal.length !== 6) {
      regOtpError.textContent = 'Please enter the 6-digit code.';
      regOtpInput.classList.add('error');
      return;
    }
    regOtpError.textContent = '';
    regOtpInput.classList.remove('error');

    regVerifyBtn.disabled = true;
    regVerifySpinner.classList.remove('hidden');
    regVerifyBtn.querySelector('.btn-text').style.opacity = 0;

    const payload = {
      name: regNameInput.value.trim(),
      email: regEmailInput.value.trim(),
      mobile: regMobileInput.value.trim(),
      password: regPasswordInput.value,
      otp: otpVal
    };

    try {
      await apiCall('/api/register/verify', payload);
      regStepOtp.classList.add('hidden');
      regStepSuccess.classList.remove('hidden');
    } catch (err) {
      regOtpError.textContent = err.message;
      regOtpInput.classList.add('error');
    } finally {
      regVerifyBtn.disabled = false;
      regVerifySpinner.classList.add('hidden');
      regVerifyBtn.querySelector('.btn-text').style.opacity = 1;
    }
  });

  // Redirect to Login from Register Success
  regLoginRedirectBtn.addEventListener('click', () => {
    registerModal.classList.add('hidden');
    identifierInput.value = regEmailInput.value;
    validateField(identifierInput, validateIdentifier, identifierError);
    passwordInput.value = '';
    passwordInput.focus();
  });
});
