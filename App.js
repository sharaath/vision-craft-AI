import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Share, Modal
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';

const DEFAULT_SERVER_URL = 'https://vision-craft-ai.onrender.com';

const TEMPLATES = [
  {
    label: '🏋️ AI Fitness Coach',
    idea: 'AI fitness coach app that analyzes posture via camera and builds custom workout plans.',
    audience: 'Busy professionals aged 25-40 who work from home.',
    problem: 'Lack of guidance on correct exercise form leading to joint pain or lack of progress.'
  },
  {
    label: '📅 Freelancer Billing',
    idea: 'Automated micro-SaaS billing and invoicing solution for freelance writers and designers.',
    audience: 'Independent freelancers and creative gig workers.',
    problem: 'Spending hours manually tracking client hours, generating invoices, and chasing late payments.'
  },
  {
    label: '🍲 Food Sharing',
    idea: 'A hyperlocal food sharing platform matching local grocers and households with excess food to neighbors in need.',
    audience: 'Environmentally-conscious neighbors, local food banks, and neighborhood grocers.',
    problem: 'Massive amounts of edible food go to waste daily while others face food insecurity.'
  }
];

const LOADING_MESSAGES = [
  "Analyzing startup idea and market context...",
  "Identifying target audience persona and pain points...",
  "Evaluating competitor landscapes and differentiation...",
  "Architecting the technical stack blueprint...",
  "Generating production-ready boilerplate code...",
  "Drafting executive advisor guidance and strategy...",
  "Summoning marketing copywriters for social media posts...",
  "Assembling final presentation deck. Almost ready!"
];

export default function App() {
  const [idea, setIdea] = useState('');
  const [audience, setAudience] = useState('');
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('blueprint');

  // New states for enhancements
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [collapsedFiles, setCollapsedFiles] = useState({});
  const [collapsedPosts, setCollapsedPosts] = useState({});

  // Dashboard and history states
  const [history, setHistory] = useState([]);
  const [activeView, setActiveView] = useState('login'); // login, dashboard, wizard, loading, project_hub, category_detail
  const [selectedCategory, setSelectedCategory] = useState('blueprint');

  // Mobile Login states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifierErr, setIdentifierErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginErrorSummary, setLoginErrorSummary] = useState('');
  const [userName, setUserName] = useState('Innovator');
  const [userIdentifier, setUserIdentifier] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Forgot Password modal states
  const [showFp, setShowFp] = useState(false);
  const [fpStep, setFpStep] = useState(1); // 1, 2, 3, 4
  const [fpIdentifier, setFpIdentifier] = useState('');
  const [fpOtp, setFpOtp] = useState(['', '', '', '', '', '']);
  const [fpNewPwd, setFpNewPwd] = useState('');
  const [fpConfirmPwd, setFpConfirmPwd] = useState('');
  const [fpIdentifierErr, setFpIdentifierErr] = useState('');
  const [fpOtpErr, setFpOtpErr] = useState('');
  const [fpNewPwdErr, setFpNewPwdErr] = useState('');
  const [fpConfirmPwdErr, setFpConfirmPwdErr] = useState('');
  const [isFpLoading, setIsFpLoading] = useState(false);
  const [fpResendTimer, setFpResendTimer] = useState(0);

  // Mobile Registration states
  const [showReg, setShowReg] = useState(false);
  const [regStep, setRegStep] = useState(1); // 1 = Form, 2 = OTP, 3 = Success
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNameErr, setRegNameErr] = useState('');
  const [regEmailErr, setRegEmailErr] = useState('');
  const [regMobileErr, setRegMobileErr] = useState('');
  const [regPasswordErr, setRegPasswordErr] = useState('');
  const [regOtp, setRegOtp] = useState(['', '', '', '', '', '']);
  const [regOtpErr, setRegOtpErr] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  // Refs for registration OTP input boxes focus shifting
  const regOtpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Refs for OTP input boxes focus shifting
  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Load history and initialize authentication details from AsyncStorage on startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load history
        const stored = await AsyncStorage.getItem('VISIONCRAFTAI_HISTORY');
        if (stored) {
          setHistory(JSON.parse(stored));
        }

        // Load Remember Me username
        const savedUsername = await AsyncStorage.getItem('visioncraft_saved_username');
        if (savedUsername) {
          setLoginIdentifier(savedUsername);
          setRememberMe(true);
        }

        // Check auto-login JWT
        const token = await AsyncStorage.getItem('visioncraft_jwt_token');
        if (token) {
          const savedName = await AsyncStorage.getItem('visioncraft_user_name');
          if (savedName) {
            setUserName(savedName);
          }
          const savedIdentifier = await AsyncStorage.getItem('visioncraft_user_identifier');
          if (savedIdentifier) {
            setUserIdentifier(savedIdentifier);
          }
          setActiveView('dashboard');
        }
      } catch (e) {
        console.error('Failed to initialize app', e);
      }
    };
    initializeApp();
  }, []);

  // Safe OTA Update Checker
  useEffect(() => {
    const checkForUpdates = async () => {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'Update Available 🚀',
            'A new version with the Project Hub is ready. Restart now to apply?',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Restart Now', onPress: () => Updates.reloadAsync() }
            ]
          );
        }
      } catch (e) {
        console.log('Update Check failed (dev client/simulator):', e);
      }
    };
    checkForUpdates();
  }, []);

  // Cycle loading messages
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    } else {
      setMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // -----------------------------------------------------------
  // Mobile Registration Flow Handlers
  // -----------------------------------------------------------
  const openRegModal = () => {
    setRegName('');
    setRegEmail('');
    setRegMobile('');
    setRegPassword('');
    setRegNameErr('');
    setRegEmailErr('');
    setRegMobileErr('');
    setRegPasswordErr('');
    setRegStep(1);
    setShowReg(true);
  };

  const handleRegSubmit = async () => {
    let isValid = true;

    if (!regName.trim()) {
      setRegNameErr('Full name is required.');
      isValid = false;
    } else {
      setRegNameErr('');
    }

    if (!emailRegex.test(regEmail.trim())) {
      setRegEmailErr('Please enter a valid email address.');
      isValid = false;
    } else {
      setRegEmailErr('');
    }

    if (regMobile.trim().length !== 10 || !/^[0-9]+$/.test(regMobile.trim())) {
      setRegMobileErr('Mobile number must be exactly 10 digits.');
      isValid = false;
    } else {
      setRegMobileErr('');
    }

    if (regPassword.length < 8) {
      setRegPasswordErr('Password must be at least 8 characters.');
      isValid = false;
    } else {
      setRegPasswordErr('');
    }

    if (!isValid) return;
    setIsRegLoading(true);

    try {
      const response = await fetch(`${serverUrl.trim()}/api/register/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          mobile: regMobile.trim(),
          password: regPassword
        })
      });
      const result = await response.json();
      if (response.ok) {
        setRegOtp(['', '', '', '', '', '']);
        setRegOtpErr('');
        setRegStep(2);
      } else {
        setRegEmailErr(result.error || 'Registration failed.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not reach server.');
    }
    setIsRegLoading(false);
  };

  const handleRegOtpChange = (text, index) => {
    const newOtp = [...regOtp];
    const digit = text.replace(/[^0-9]/g, '');
    newOtp[index] = digit;
    setRegOtp(newOtp);
    setRegOtpErr('');

    if (digit && index < 5) {
      regOtpRefs[index + 1].current?.focus();
    }
  };

  const handleRegOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!regOtp[index] && index > 0) {
        const newOtp = [...regOtp];
        newOtp[index - 1] = '';
        setRegOtp(newOtp);
        regOtpRefs[index - 1].current?.focus();
      }
    }
  };

  const handleRegVerify = async () => {
    const otpCode = regOtp.join('');
    if (otpCode.length !== 6) {
      setRegOtpErr('Please enter the 6-digit code.');
      return;
    }
    setRegOtpErr('');
    setIsRegLoading(true);

    try {
      const response = await fetch(`${serverUrl.trim()}/api/register/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          mobile: regMobile.trim(),
          password: regPassword,
          otp: otpCode
        })
      });
      const result = await response.json();
      if (response.ok) {
        setRegStep(3);
      } else {
        setRegOtpErr(result.error || 'Verification failed. Incorrect code.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not reach server.');
    }
    setIsRegLoading(false);
  };

  // -----------------------------------------------------------
  // Mobile Login Validation & Handlers
  // -----------------------------------------------------------
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateIdentifierStr = (val) => {
    const clean = val.trim();
    if (!clean) return 'Email or Mobile is required.';
    const digitsOnly = /^[0-9]+$/.test(clean);
    if (digitsOnly) {
      if (clean.length !== 10) return 'Mobile must be exactly 10 digits.';
      return '';
    }
    if (!emailRegex.test(clean)) return 'Enter a valid email address.';
    return '';
  };

  const getPasswordStrengthScore = (pwd) => {
    if (!pwd || pwd.length < 8) return 1; // Weak
    let score = 1;
    if (/[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd) || /[A-Z]/.test(pwd)) score++;
    return score; // 1 = Weak, 2 = Medium, 3 = Strong
  };

  const handleIdentifierChange = (val) => {
    setLoginIdentifier(val);
    setIdentifierErr(validateIdentifierStr(val));
    setLoginErrorSummary('');
  };

  const handlePasswordChange = (val) => {
    setLoginPassword(val);
    if (!val) {
      setPasswordErr('Password is required.');
    } else if (val.length < 8) {
      setPasswordErr('Password must be at least 8 characters.');
    } else {
      setPasswordErr('');
    }
    setLoginErrorSummary('');
  };

  const handleLoginSubmit = async () => {
    const idErr = validateIdentifierStr(loginIdentifier);
    const pwdErr = !loginPassword ? 'Password is required.' : (loginPassword.length < 8 ? 'Password must be at least 8 characters.' : '');
    
    if (idErr || pwdErr) {
      setIdentifierErr(idErr);
      setPasswordErr(pwdErr);
      return;
    }

    setIsLoginLoading(true);
    setLoginErrorSummary('');

    try {
      const response = await fetch(`${serverUrl.trim()}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ identifier: loginIdentifier.trim(), password: loginPassword })
      });
      const result = await response.json();
      if (response.ok) {
        // Save jwt
        await AsyncStorage.setItem('visioncraft_jwt_token', result.token);
        await AsyncStorage.setItem('visioncraft_user_name', result.name || 'Innovator');
        await AsyncStorage.setItem('visioncraft_user_identifier', loginIdentifier.trim());
        setUserName(result.name || 'Innovator');
        setUserIdentifier(loginIdentifier.trim());

        // Remember Me state
        if (rememberMe) {
          await AsyncStorage.setItem('visioncraft_saved_username', loginIdentifier.trim());
        } else {
          await AsyncStorage.removeItem('visioncraft_saved_username');
        }

        // Clean form & transition
        setLoginPassword('');
        setLoginErrorSummary('');
        setActiveView('dashboard');
      } else {
        setLoginErrorSummary(result.error || 'Login failed. Incorrect identifier or password.');
      }
    } catch (err) {
      setLoginErrorSummary('Connection error. Make sure your server is running and accessible.');
      console.error(err);
    }
    setIsLoginLoading(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('visioncraft_jwt_token');
      await AsyncStorage.removeItem('visioncraft_user_name');
      await AsyncStorage.removeItem('visioncraft_user_identifier');
      // Reset details & route to login
      setLoginPassword('');
      setLoginErrorSummary('');
      setUserName('Innovator');
      setUserIdentifier('');
      setShowSettingsModal(false);
      setActiveView('login');
    } catch (e) {
      console.error("Failed to clear auth token on logout", e);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userIdentifier) {
      Alert.alert(
        'Session Expired ⚠️',
        'Please log out and log back in once to sync your account details and enable deletion.',
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert(
      'Delete Account ⚠️',
      'Are you sure you want to permanently delete your account? This action cannot be undone, and all your saved blueprints will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              const response = await fetch(`${serverUrl.trim()}/api/delete-account`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({ identifier: userIdentifier })
              });
              const result = await response.json();
              if (response.ok) {
                Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
                await handleLogout();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete account.');
              }
            } catch (err) {
              Alert.alert('Network Error', 'Could not reach server to delete account.');
            }
            setIsDeletingAccount(false);
          }
        }
      ]
    );
  };

  // -----------------------------------------------------------
  // Forgot Password Flow Handlers
  // -----------------------------------------------------------
  const openFpModal = () => {
    setFpIdentifier('');
    setFpOtp(['', '', '', '', '', '']);
    setFpNewPwd('');
    setFpConfirmPwd('');
    setFpIdentifierErr('');
    setFpOtpErr('');
    setFpNewPwdErr('');
    setFpConfirmPwdErr('');
    setFpStep(1);
    setFpResendTimer(0);
    setShowFp(true);
  };

  // Start Resend timer
  const startFpTimer = () => {
    setFpResendTimer(59);
  };

  useEffect(() => {
    let timer;
    if (fpResendTimer > 0 && showFp) {
      timer = setTimeout(() => {
        setFpResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [fpResendTimer, showFp]);

  const handleFpSendOtp = async () => {
    const err = validateIdentifierStr(fpIdentifier);
    if (err) {
      setFpIdentifierErr(err);
      return;
    }
    setFpIdentifierErr('');
    setIsFpLoading(true);

    try {
      const response = await fetch(`${serverUrl.trim()}/api/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ identifier: fpIdentifier.trim() })
      });
      const result = await response.json();
      if (response.ok) {
        startFpTimer();
        setFpStep(2);
      } else {
        setFpIdentifierErr(result.error || 'User not found with this identifier.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not reach server.');
    }
    setIsFpLoading(false);
  };

  const handleFpOtpChange = (text, index) => {
    const newOtp = [...fpOtp];
    const digit = text.replace(/[^0-9]/g, '');
    newOtp[index] = digit;
    setFpOtp(newOtp);
    setFpOtpErr('');

    if (digit && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleFpOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!fpOtp[index] && index > 0) {
        const newOtp = [...fpOtp];
        newOtp[index - 1] = '';
        setFpOtp(newOtp);
        otpRefs[index - 1].current?.focus();
      }
    }
  };

  const handleFpVerifyOtp = async () => {
    const otpCode = fpOtp.join('');
    if (otpCode.length !== 6) {
      setFpOtpErr('Please enter the 6-digit code.');
      return;
    }
    setFpOtpErr('');
    setIsFpLoading(true);

    try {
      const response = await fetch(`${serverUrl.trim()}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ identifier: fpIdentifier.trim(), otp: otpCode })
      });
      const result = await response.json();
      if (response.ok) {
        setFpStep(3);
      } else {
        setFpOtpErr(result.error || 'Invalid OTP code. Try using: 123456.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not reach server.');
    }
    setIsFpLoading(false);
  };

  const handleFpResetPassword = async () => {
    let isValid = true;
    if (fpNewPwd.length < 8) {
      setFpNewPwdErr('Password must be at least 8 characters.');
      isValid = false;
    } else {
      setFpNewPwdErr('');
    }

    if (fpNewPwd !== fpConfirmPwd) {
      setFpConfirmPwdErr('Passwords do not match.');
      isValid = false;
    } else {
      setFpConfirmPwdErr('');
    }

    if (!isValid) return;
    setIsFpLoading(true);

    try {
      const response = await fetch(`${serverUrl.trim()}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ identifier: fpIdentifier.trim(), password: fpNewPwd })
      });
      const result = await response.json();
      if (response.ok) {
        setFpStep(4);
      } else {
        setFpNewPwdErr(result.error || 'Failed to reset password.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not reach server.');
    }
    setIsFpLoading(false);
  };

  const handleGenerate = async () => {
    if (!idea || !audience || !problem) {
      Alert.alert('Missing Fields', 'Please fill in all three fields!');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl.trim()}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ idea, audience, problem })
      });
      const result = await response.json();
      if (response.ok) {
        const newStartup = {
          id: Date.now().toString(),
          createdAt: new Date().toLocaleDateString(),
          ...result
        };
        setData(newStartup);

        // Save to history
        const updatedHistory = [newStartup, ...history];
        setHistory(updatedHistory);
        try {
          await AsyncStorage.setItem('VISIONCRAFTAI_HISTORY', JSON.stringify(updatedHistory));
        } catch (e) {
          console.error("Failed to save history", e);
        }

        // By default, collapse files but keep first one open for readability
        const initialCollapsed = {};
        if (newStartup.code?.files) {
          newStartup.code.files.forEach((_, idx) => {
            initialCollapsed[idx] = idx !== 0; // Collapsed if not the first file
          });
        }
        setCollapsedFiles(initialCollapsed);
        setActiveView('project_hub');
      } else {
        Alert.alert('Generation Error', result.error || 'Failed to generate startup blueprint.');
      }
    } catch (err) {
      Alert.alert('Connection Error', `Could not reach the server at ${serverUrl}. Make sure your backend server is running and accessible.`);
      console.error(err);
    }
    setLoading(false);
  };

  const handleRestart = () => {
    setData(null);
    setIdea('');
    setAudience('');
    setProblem('');
    setActiveTab('blueprint');
    setCollapsedFiles({});
    setCollapsedPosts({});
    setActiveView('wizard');
  };

  const selectTemplate = (tpl) => {
    setIdea(tpl.idea);
    setAudience(tpl.audience);
    setProblem(tpl.problem);
  };

  const handleShare = async (title, content) => {
    try {
      await Share.share({
        title: title,
        message: `${title}\n\n${content}`,
      });
    } catch (error) {
      console.error("Error sharing content: ", error);
    }
  };

  const toggleFileCollapse = (index) => {
    setCollapsedFiles(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const togglePostCollapse = (index) => {
    setCollapsedPosts(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const deleteStartup = async (id) => {
    Alert.alert(
      "Delete Startup",
      "Are you sure you want to delete this startup blueprint?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedHistory = history.filter(item => item.id !== id);
            setHistory(updatedHistory);
            try {
              await AsyncStorage.setItem('VISIONCRAFTAI_HISTORY', JSON.stringify(updatedHistory));
            } catch (e) {
              console.error("Failed to delete startup", e);
            }
          }
        }
      ]
    );
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingTitle}>Generating Your Startup...</Text>
        <Text style={styles.loadingDesc}>{LOADING_MESSAGES[msgIndex]}</Text>
      </View>
    );
  }

  // LOGIN SCREEN
  if (activeView === 'login') {
    const isLoginEnabled = !validateIdentifierStr(loginIdentifier) && loginPassword && loginPassword.length >= 8;
    const pwdStrength = getPasswordStrengthScore(loginPassword);

    return (
      <ScrollView contentContainerStyle={styles.loginScrollContainer} style={{ backgroundColor: '#0a0a0f' }}>
        <StatusBar style="light" />

        {/* Header decoration orbs */}
        <View style={styles.loginDecorContainer}>
          <View style={[styles.loginOrb, { backgroundColor: '#8b5cf6', top: -100, right: -100, opacity: 0.15 }]} />
          <View style={[styles.loginOrb, { backgroundColor: '#3b82f6', bottom: -100, left: -100, opacity: 0.15 }]} />
        </View>

        <View style={styles.loginCard}>
          {/* Logo */}
          <View style={styles.loginLogoContainer}>
            <MaterialIcons name="camera" size={32} color="#a78bfa" />
            <Text style={styles.loginLogoText}>VisionCraft<Text style={styles.loginLogoTextAI}>AI</Text></Text>
          </View>

          {/* Heading */}
          <Text style={styles.loginTitleText}>Welcome Back</Text>
          <Text style={styles.loginSubtitleText}>Sign in to continue using VisionCraft AI</Text>

          {/* Error Summary */}
          {!!loginErrorSummary ? (
            <View style={styles.loginErrorSummary}>
              <Text style={styles.loginErrorSummaryText}>{loginErrorSummary}</Text>
            </View>
          ) : null}

          {/* Identifier Input */}
          <View style={styles.loginInputGroup}>
            <Text style={styles.loginInputLabel}>Email Address or Mobile Number</Text>
            <View style={[styles.loginInputWrapper, !!identifierErr && { borderColor: '#ef4444' }]}>
              <MaterialIcons name="person-outline" size={20} color="#64748b" style={styles.loginInputIcon} />
              <TextInput
                style={styles.loginTextInput}
                placeholder="name@email.com or 10-digit mobile"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={loginIdentifier}
                onChangeText={handleIdentifierChange}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {!!identifierErr ? <Text style={styles.loginErrorText}>{identifierErr}</Text> : null}
          </View>

          {/* Password Input */}
          <View style={styles.loginInputGroup}>
            <Text style={styles.loginInputLabel}>Password</Text>
            <View style={[styles.loginInputWrapper, !!passwordErr && { borderColor: '#ef4444' }]}>
              <MaterialIcons name="lock-outline" size={20} color="#64748b" style={styles.loginInputIcon} />
              <TextInput
                style={styles.loginTextInput}
                placeholder="Enter your password"
                placeholderTextColor="rgba(255,255,255,0.25)"
                secureTextEntry={!showPassword}
                value={loginPassword}
                onChangeText={handlePasswordChange}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.loginPasswordToggle}>
                <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {/* Password strength indicators */}
            {!!loginPassword ? (
              <View style={styles.loginStrengthContainer}>
                <View style={styles.loginStrengthBars}>
                  <View style={[styles.loginStrengthBar, { backgroundColor: pwdStrength >= 1 ? (pwdStrength === 1 ? '#ef4444' : pwdStrength === 2 ? '#f59e0b' : '#10b981') : 'rgba(255,255,255,0.1)' }]} />
                  <View style={[styles.loginStrengthBar, { backgroundColor: pwdStrength >= 2 ? (pwdStrength === 2 ? '#f59e0b' : '#10b981') : 'rgba(255,255,255,0.1)' }]} />
                  <View style={[styles.loginStrengthBar, { backgroundColor: pwdStrength === 3 ? '#10b981' : 'rgba(255,255,255,0.1)' }]} />
                </View>
                <Text style={[styles.loginStrengthText, { color: pwdStrength === 1 ? '#ef4444' : pwdStrength === 2 ? '#f59e0b' : '#10b981' }]}>
                  {pwdStrength === 1 ? 'Weak' : pwdStrength === 2 ? 'Medium' : 'Strong'}
                </Text>
              </View>
            ) : null}
            
            {!!passwordErr ? <Text style={styles.loginErrorText}>{passwordErr}</Text> : null}
          </View>

          {/* Remember Me and Forgot Password Link */}
          <View style={styles.loginOptionsRow}>
            <TouchableOpacity style={styles.loginRememberRow} onPress={() => setRememberMe(!rememberMe)}>
              <MaterialIcons 
                name={rememberMe ? "check-box" : "check-box-outline-blank"} 
                size={20} 
                color={rememberMe ? "#8b5cf6" : "#64748b"} 
              />
              <Text style={styles.loginRememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openFpModal}>
              <Text style={styles.loginForgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.loginBtnGroup}>
            <TouchableOpacity 
              style={[styles.loginBtnPrimary, !isLoginEnabled && { opacity: 0.5 }]} 
              disabled={!isLoginEnabled || isLoginLoading}
              onPress={handleLoginSubmit}
            >
              {isLoginLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.loginBtnTextPrimary}>Login</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.loginBtnSecondary}
              onPress={openRegModal}
            >
              <Text style={styles.loginBtnTextSecondary}>Create New Account</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* FORGOT PASSWORD MODAL OVERLAY */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showFp}
          onRequestClose={() => setShowFp(false)}
        >
          <View style={styles.fpModalOverlay}>
            <View style={styles.fpModalCard}>
              {/* Close Modal button */}
              <TouchableOpacity style={styles.fpModalClose} onPress={() => setShowFp(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>

              {/* STEP 1: Enter email or phone */}
              {fpStep === 1 ? (
                <View>
                  <Text style={styles.fpModalTitle}>Reset Password</Text>
                  <Text style={styles.fpModalSub}>Enter your registered email address or mobile number to receive a 6-digit OTP code.</Text>
                  
                  <View style={styles.loginInputGroup}>
                    <Text style={styles.loginInputLabel}>Email or Mobile Number</Text>
                    <View style={[styles.loginInputWrapper, !!fpIdentifierErr && { borderColor: '#ef4444' }]}>
                      <MaterialIcons name="mail-outline" size={20} color="#64748b" style={styles.loginInputIcon} />
                      <TextInput
                        style={styles.loginTextInput}
                        placeholder="name@email.com or 10-digit mobile"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={fpIdentifier}
                        onChangeText={setFpIdentifier}
                        autoCapitalize="none"
                      />
                    </View>
                    {!!fpIdentifierErr ? <Text style={styles.loginErrorText}>{fpIdentifierErr}</Text> : null}
                  </View>

                  <TouchableOpacity 
                    style={styles.loginBtnPrimary} 
                    onPress={handleFpSendOtp}
                    disabled={isFpLoading}
                  >
                    {isFpLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.loginBtnTextPrimary}>Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* STEP 2: Verify OTP */}
              {fpStep === 2 ? (
                <View>
                  <Text style={styles.fpModalTitle}>Enter OTP Code</Text>
                  <Text style={styles.fpModalSub}>A 6-digit verification code has been sent to your device. Enter it below to proceed.</Text>

                  <View style={styles.loginInputGroup}>
                    <Text style={styles.loginInputLabel}>6-Digit Verification Code</Text>
                    <View style={styles.fpOtpContainer}>
                      {fpOtp.map((digit, idx) => (
                        <TextInput
                          key={idx}
                          ref={otpRefs[idx]}
                          style={styles.fpOtpInput}
                          maxLength={1}
                          keyboardType="numeric"
                          value={digit}
                          onChangeText={(text) => handleFpOtpChange(text, idx)}
                          onKeyPress={(e) => handleFpOtpKeyPress(e, idx)}
                        />
                      ))}
                    </View>
                    {!!fpOtpErr ? <Text style={styles.loginErrorText}>{fpOtpErr}</Text> : null}
                  </View>

                  <TouchableOpacity 
                    style={[styles.fpResendBtn, fpResendTimer > 0 && styles.fpResendBtnDisabled]}
                    onPress={handleFpSendOtp}
                    disabled={fpResendTimer > 0}
                  >
                    <Text style={[styles.fpResendBtnText, fpResendTimer > 0 && styles.fpResendBtnTextDisabled]}>
                      {fpResendTimer > 0 ? `Resend Code (${fpResendTimer}s)` : "Resend Code"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.loginBtnPrimary} 
                    onPress={handleFpVerifyOtp}
                    disabled={isFpLoading}
                  >
                    {isFpLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.loginBtnTextPrimary}>Verify Code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* STEP 3: Reset password entry */}
              {fpStep === 3 ? (
                <View>
                  <Text style={styles.fpModalTitle}>Create New Password</Text>
                  <Text style={styles.fpModalSub}>Enter your new password below. It must be at least 8 characters long.</Text>

                  <View style={styles.loginInputGroup}>
                    <Text style={styles.loginInputLabel}>New Password</Text>
                    <View style={[styles.loginInputWrapper, !!fpNewPwdErr && { borderColor: '#ef4444' }]}>
                      <TextInput
                        style={[styles.loginTextInput, { paddingLeft: 16 }]}
                        placeholder="Enter new password"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        secureTextEntry={true}
                        value={fpNewPwd}
                        onChangeText={setFpNewPwd}
                        autoCapitalize="none"
                      />
                    </View>
                    {!!fpNewPwdErr ? <Text style={styles.loginErrorText}>{fpNewPwdErr}</Text> : null}
                  </View>

                  <View style={styles.loginInputGroup}>
                    <Text style={styles.loginInputLabel}>Confirm New Password</Text>
                    <View style={[styles.loginInputWrapper, !!fpConfirmPwdErr && { borderColor: '#ef4444' }]}>
                      <TextInput
                        style={[styles.loginTextInput, { paddingLeft: 16 }]}
                        placeholder="Confirm new password"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        secureTextEntry={true}
                        value={fpConfirmPwd}
                        onChangeText={setFpConfirmPwd}
                        autoCapitalize="none"
                      />
                    </View>
                    {!!fpConfirmPwdErr ? <Text style={styles.loginErrorText}>{fpConfirmPwdErr}</Text> : null}
                  </View>

                  <TouchableOpacity 
                    style={styles.loginBtnPrimary} 
                    onPress={handleFpResetPassword}
                    disabled={isFpLoading}
                  >
                    {isFpLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.loginBtnTextPrimary}>Reset Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* STEP 4: Success Message */}
              {fpStep === 4 ? (
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.fpSuccessIconBadge}>
                    <MaterialIcons name="check" size={32} color="#10b981" />
                  </View>
                  <Text style={styles.fpModalTitle}>Password Updated!</Text>
                  <Text style={[styles.fpModalSub, { textAlign: 'center', marginBottom: 24 }]}>
                    Password changed successfully. Please login again.
                  </Text>

                  <TouchableOpacity 
                    style={styles.loginBtnPrimary} 
                    onPress={() => {
                      setShowFp(false);
                      setLoginIdentifier(fpIdentifier);
                      setLoginPassword('');
                    }}
                  >
                    <Text style={styles.loginBtnTextPrimary}>Back to Login</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

            </View>
          </View>
        </Modal>

        {/* REGISTER MODAL OVERLAY */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showReg}
          onRequestClose={() => setShowReg(false)}
        >
          <View style={styles.fpModalOverlay}>
            <View style={styles.fpModalCard}>
              {/* Close Modal button */}
              <TouchableOpacity style={styles.fpModalClose} onPress={() => setShowReg(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>

              {regStep === 1 ? (
                <View>
                  <Text style={styles.fpModalTitle}>Create Account</Text>
                  <Text style={styles.fpModalSub}>Join VisionCraft AI to start generating high-quality startup blueprints.</Text>

                  {/* Name field */}
                  <View style={styles.loginInputGroup}>
                    <Text style={styles.loginInputLabel}>Full Name</Text>
                    <View style={[styles.loginInputWrapper, !!regNameErr && { borderColor: '#ef4444' }]}>
                      <MaterialIcons name="person-outline" size={20} color="#64748b" style={styles.loginInputIcon} />
                      <TextInput
                        style={styles.loginTextInput}
                        placeholder="John Doe"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={regName}
                        onChangeText={setRegName}
                      />
                    </View>
                    {!!regNameErr ? <Text style={styles.loginErrorText}>{regNameErr}</Text> : null}
                  </View>

                  {/* Email field */}
                  <View style={styles.loginInputGroup}>
                    <Text style={styles.loginInputLabel}>Email Address</Text>
                    <View style={[styles.loginInputWrapper, !!regEmailErr && { borderColor: '#ef4444' }]}>
                      <MaterialIcons name="mail-outline" size={20} color="#64748b" style={styles.loginInputIcon} />
                      <TextInput
                        style={styles.loginTextInput}
                        placeholder="name@email.com"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={regEmail}
                        onChangeText={setRegEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                    {!!regEmailErr ? <Text style={styles.loginErrorText}>{regEmailErr}</Text> : null}
                  </View>

                  {/* Mobile field */}
                  <View style={styles.loginInputGroup}>
                    <Text style={styles.loginInputLabel}>Mobile Number</Text>
                    <View style={[styles.loginInputWrapper, !!regMobileErr && { borderColor: '#ef4444' }]}>
                      <MaterialIcons name="phone-iphone" size={20} color="#64748b" style={styles.loginInputIcon} />
                      <TextInput
                        style={styles.loginTextInput}
                        placeholder="10-digit number"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={regMobile}
                        onChangeText={setRegMobile}
                        keyboardType="numeric"
                      />
                    </View>
                    {!!regMobileErr ? <Text style={styles.loginErrorText}>{regMobileErr}</Text> : null}
                  </View>

                  {/* Password field */}
                  <View style={styles.loginInputGroup}>
                    <Text style={styles.loginInputLabel}>Password</Text>
                    <View style={[styles.loginInputWrapper, !!regPasswordErr && { borderColor: '#ef4444' }]}>
                      <MaterialIcons name="lock-outline" size={20} color="#64748b" style={styles.loginInputIcon} />
                      <TextInput
                        style={styles.loginTextInput}
                        placeholder="Min. 8 characters"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        secureTextEntry={true}
                        value={regPassword}
                        onChangeText={setRegPassword}
                        autoCapitalize="none"
                      />
                    </View>
                    {!!regPasswordErr ? <Text style={styles.loginErrorText}>{regPasswordErr}</Text> : null}
                  </View>

                  <TouchableOpacity 
                    style={styles.loginBtnPrimary} 
                    onPress={handleRegSubmit}
                    disabled={isRegLoading}
                  >
                    {isRegLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.loginBtnTextPrimary}>Register</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}

              {regStep === 2 ? (
                <View>
                  <Text style={styles.fpModalTitle}>Verify Registration OTP</Text>
                  <Text style={styles.fpModalSub}>Enter the 6-digit registration OTP code sent to your email address below to complete registration.</Text>

                  <View style={styles.loginInputGroup}>
                    <Text style={styles.loginInputLabel}>6-Digit Verification Code</Text>
                    <View style={styles.fpOtpContainer}>
                      {regOtp.map((digit, idx) => (
                        <TextInput
                          key={idx}
                          ref={regOtpRefs[idx]}
                          style={styles.fpOtpInput}
                          maxLength={1}
                          keyboardType="numeric"
                          value={digit}
                          onChangeText={(text) => handleRegOtpChange(text, idx)}
                          onKeyPress={(e) => handleRegOtpKeyPress(e, idx)}
                        />
                      ))}
                    </View>
                    {!!regOtpErr ? <Text style={styles.loginErrorText}>{regOtpErr}</Text> : null}
                  </View>

                  <TouchableOpacity 
                    style={styles.loginBtnPrimary} 
                    onPress={handleRegVerify}
                    disabled={isRegLoading}
                  >
                    {isRegLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.loginBtnTextPrimary}>Verify & Register</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}

              {regStep === 3 ? (
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.fpSuccessIconBadge}>
                    <MaterialIcons name="check" size={32} color="#10b981" />
                  </View>
                  <Text style={styles.fpModalTitle}>Account Created!</Text>
                  <Text style={[styles.fpModalSub, { textAlign: 'center', marginBottom: 24 }]}>
                    Your account has been successfully created. Please sign in with your email or mobile.
                  </Text>

                  <TouchableOpacity 
                    style={styles.loginBtnPrimary} 
                    onPress={() => {
                      setShowReg(false);
                      setLoginIdentifier(regEmail);
                      setLoginPassword('');
                    }}
                  >
                    <Text style={styles.loginBtnTextPrimary}>Go to Sign In</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // DASHBOARD VIEW
  if (activeView === 'dashboard') {
    const totalCodeFiles = history.reduce((acc, item) => acc + (item.code?.files?.length || 0), 0);
    const totalMarketingPosts = history.reduce((acc, item) => acc + (item.marketing?.posts?.length || 0), 0);

    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar style="light" />
        
        {/* Dashboard Header */}
        <View style={styles.dashboardHeader}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <View>
              <Text style={styles.logo}>VisionCraft<Text style={styles.logoAI}>AI</Text></Text>
              <Text style={styles.dashboardTagline}>Welcome back, {userName}!</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setShowSettingsModal(true)} style={[styles.logoutBtn, { marginRight: 15 }]} aria-label="Settings">
                <MaterialIcons name="settings" size={22} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} aria-label="Logout">
                <MaterialIcons name="logout" size={22} color="#f43f5e" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{history.length}</Text>
            <Text style={styles.statLabel}>🚀 Startups</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalCodeFiles}</Text>
            <Text style={styles.statLabel}>💻 Code Files</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalMarketingPosts}</Text>
            <Text style={styles.statLabel}>📣 Posts</Text>
          </View>
        </View>

        {/* Recent Startups or Empty State */}
        <ScrollView style={styles.historyScroll} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.historyTitle}>📂 Saved Blueprints</Text>
          {history.length === 0 ? (
            <View style={styles.dashboardEmptyState}>
              <Text style={styles.dashboardEmptyIcon}>💡</Text>
              <Text style={styles.dashboardEmptyText}>No startup blueprints crafted yet.</Text>
              <Text style={styles.dashboardEmptySub}>Your generated ideas, business plans, code, and marketing assets will appear here.</Text>
              <TouchableOpacity 
                style={styles.dashboardEmptyBtn} 
                onPress={() => setActiveView('wizard')}
              >
                <Text style={styles.dashboardEmptyBtnText}>🚀 Craft Your First Startup</Text>
              </TouchableOpacity>
            </View>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <TouchableOpacity 
                  style={{ flex: 1 }} 
                  onPress={() => {
                    setData(item);
                    setActiveView('project_hub');
                  }}
                >
                  <Text style={styles.historyCardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.historyCardDate}>{item.createdAt || 'Generated'}</Text>
                  <Text style={styles.historyCardSummary} numberOfLines={2}>
                    {item.blueprint?.executive_summary || 'No summary available.'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.historyDeleteBtn}
                  onPress={() => deleteStartup(item.id)}
                >
                  <MaterialIcons name="delete-outline" size={22} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Create Startup FAB */}
        {history.length > 0 && (
          <TouchableOpacity 
            style={styles.fab} 
            onPress={() => {
              setData(null);
              setIdea('');
              setAudience('');
              setProblem('');
              setActiveView('wizard');
            }}
          >
            <Text style={styles.fabText}>+ Craft New</Text>
          </TouchableOpacity>
        )}

        {/* SETTINGS MODAL */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showSettingsModal}
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View style={styles.fpModalOverlay}>
            <View style={styles.fpModalCard}>
              <TouchableOpacity style={styles.fpModalClose} onPress={() => setShowSettingsModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
              
              <Text style={styles.fpModalTitle}>⚙️ Settings</Text>
              <Text style={[styles.fpModalSub, { marginBottom: 20 }]}>Manage your VisionCraft AI account details.</Text>

              <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 25 }}>
                <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Full Name</Text>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '500', marginBottom: 12 }}>{userName}</Text>
                
                <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Account Identifier</Text>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '500', marginBottom: 12 }}>{userIdentifier || 'Logged In'}</Text>

                <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>API Server URL</Text>
                <Text style={{ color: '#ffffff', fontSize: 14 }}>{serverUrl}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.loginBtnPrimary, { backgroundColor: '#e11d48', borderColor: '#e11d48' }]} 
                onPress={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.loginBtnTextPrimary}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // PROJECT HUB SCREEN
  if (activeView === 'project_hub' && data) {
    const codeFilesCount = data.code?.files?.length || 0;
    const advisorSlidesCount = data.advisor?.deck?.length || 0;
    const marketingPostsCount = data.marketing?.posts?.length || 0;

    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.resultsHeader}>
          <TouchableOpacity onPress={() => setActiveView('dashboard')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Dashboard</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={styles.startupName} numberOfLines={1}>{data.name}</Text>
          </View>
          <TouchableOpacity onPress={handleRestart} style={styles.restartBtn}>
            <Text style={styles.restartText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Project Hub Title */}
        <View style={styles.hubTitleSection}>
          <Text style={styles.hubTitle}>🚀 Startup Project Hub</Text>
          <Text style={styles.hubSubtitle}>Explore different categories generated for this startup.</Text>
        </View>

        {/* Hub Grid Categories */}
        <ScrollView style={styles.hubScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Card 1: Blueprint Overview */}
          <TouchableOpacity 
            style={styles.hubCard} 
            onPress={() => {
              setSelectedCategory('blueprint');
              setActiveView('category_detail');
            }}
          >
            <View style={[styles.hubIconBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Text style={styles.hubIconText}>📋</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hubCardTitle}>Blueprint Overview</Text>
              <Text style={styles.hubCardDesc}>Executive summary, problem analysis, solution, revenue model, and stack.</Text>
            </View>
            <View style={styles.hubBadge}>
              <Text style={styles.hubBadgeText}>5 Sections</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Code Boilerplates */}
          <TouchableOpacity 
            style={styles.hubCard} 
            onPress={() => {
              setSelectedCategory('code');
              setActiveView('category_detail');
            }}
          >
            <View style={[styles.hubIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Text style={styles.hubIconText}>💻</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hubCardTitle}>Technical Boilerplate</Text>
              <Text style={styles.hubCardDesc}>Production-ready code files and structural boilerplates for development.</Text>
            </View>
            <View style={styles.hubBadge}>
              <Text style={styles.hubBadgeText}>{codeFilesCount} {codeFilesCount === 1 ? 'File' : 'Files'}</Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Advisor Pitch Deck */}
          <TouchableOpacity 
            style={styles.hubCard} 
            onPress={() => {
              setSelectedCategory('advisor');
              setActiveView('category_detail');
            }}
          >
            <View style={[styles.hubIconBadge, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
              <Text style={styles.hubIconText}>🧠</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hubCardTitle}>Advisor Pitch Deck</Text>
              <Text style={styles.hubCardDesc}>Structured slide decks, target market metrics, and go-to-market strategies.</Text>
            </View>
            <View style={styles.hubBadge}>
              <Text style={styles.hubBadgeText}>{advisorSlidesCount} {advisorSlidesCount === 1 ? 'Slide' : 'Slides'}</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: Marketing Social Copy */}
          <TouchableOpacity 
            style={styles.hubCard} 
            onPress={() => {
              setSelectedCategory('marketing');
              setActiveView('category_detail');
            }}
          >
            <View style={[styles.hubIconBadge, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <Text style={styles.hubIconText}>📣</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hubCardTitle}>Social Marketing Copy</Text>
              <Text style={styles.hubCardDesc}>Ready-made marketing posts and tags for LinkedIn, Instagram, and Twitter.</Text>
            </View>
            <View style={styles.hubBadge}>
              <Text style={styles.hubBadgeText}>{marketingPostsCount} {marketingPostsCount === 1 ? 'Post' : 'Posts'}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // CATEGORY DETAIL SCREEN
  if (activeView === 'category_detail' && data) {
    const fullBlueprintText = `
Executive Summary:
${data.blueprint?.executive_summary}

Problem:
${data.blueprint?.problem_analysis}

Solution:
${data.blueprint?.solution_overview}

Revenue Model:
${data.blueprint?.revenue_model}

Tech Stack:
${data.blueprint?.tech_stack}
`;

    // Map selected category to a human-readable title
    const categoryTitles = {
      blueprint: '📋 Startup Blueprint',
      code: '💻 Developer Code',
      advisor: '🧠 Advisor Slides',
      marketing: '📣 Social Marketing',
    };

    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.resultsHeader}>
          <TouchableOpacity onPress={() => setActiveView('project_hub')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Hub</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={styles.startupName} numberOfLines={1}>{categoryTitles[selectedCategory] || 'Details'}</Text>
          </View>
          <TouchableOpacity onPress={handleRestart} style={styles.restartBtn}>
            <Text style={styles.restartText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* BLUEPRINT DETAILS */}
          {selectedCategory === 'blueprint' && (
            <View style={{ marginBottom: 40 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Overview Details</Text>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(`${data.name} Blueprint`, fullBlueprintText)}>
                  <Text style={styles.actionBtnText}>Share All</Text>
                </TouchableOpacity>
              </View>

              {/* Card 1: Executive Summary */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <Text style={styles.sectionIconText}>🚀</Text>
                  </View>
                  <Text style={styles.sectionCardTitle}>Executive Summary</Text>
                </View>
                <Text style={styles.sectionText}>{data.blueprint?.executive_summary}</Text>
              </View>

              {/* Card 2: Problem */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                    <Text style={styles.sectionIconText}>❗</Text>
                  </View>
                  <Text style={styles.sectionCardTitle}>The Problem</Text>
                </View>
                <Text style={styles.sectionText}>{data.blueprint?.problem_analysis}</Text>
              </View>

              {/* Card 3: Solution */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(74, 222, 128, 0.15)' }]}>
                    <Text style={styles.sectionIconText}>✅</Text>
                  </View>
                  <Text style={styles.sectionCardTitle}>Our Solution</Text>
                </View>
                <Text style={styles.sectionText}>{data.blueprint?.solution_overview}</Text>
              </View>

              {/* Card 4: Revenue Model */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                    <Text style={styles.sectionIconText}>💰</Text>
                  </View>
                  <Text style={styles.sectionCardTitle}>Revenue Model</Text>
                </View>
                <Text style={styles.sectionText}>{data.blueprint?.revenue_model}</Text>
              </View>

              {/* Card 5: Tech Stack */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Text style={styles.sectionIconText}>⚙️</Text>
                  </View>
                  <Text style={styles.sectionCardTitle}>Recommended Tech Stack</Text>
                </View>
                <Text style={styles.sectionText}>{data.blueprint?.tech_stack}</Text>
              </View>
            </View>
          )}

          {/* CODE TAB */}
          {selectedCategory === 'code' && (
            <View style={{ marginBottom: 40 }}>
              <Text style={styles.sectionTitle}>Boilerplate Files</Text>
              {data.code?.files?.length === 0 ? (
                <Text style={styles.emptyText}>No code files generated.</Text>
              ) : (
                data.code?.files?.map((file, index) => {
                  const isCollapsed = !!collapsedFiles[index];
                  return (
                    <View key={index} style={styles.codeCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.sectionCardHeader}>
                          <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)', marginRight: 10 }]}>
                            <Text style={styles.sectionIconText}>📄</Text>
                          </View>
                          <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                        </View>
                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(file.name, file.content)}>
                            <Text style={styles.actionBtnText}>Share</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.collapseBtn} onPress={() => toggleFileCollapse(index)}>
                            <Text style={styles.collapseBtnText}>{isCollapsed ? "Expand" : "Collapse"}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {!isCollapsed && (
                        <Text style={styles.codeText}>{file.content}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ADVISOR TAB */}
          {selectedCategory === 'advisor' && (
            <View style={{ marginBottom: 40 }}>
              <Text style={styles.sectionTitle}>Slides & Strategy</Text>
              {data.advisor?.deck?.length === 0 ? (
                <Text style={styles.emptyText}>No slides generated.</Text>
              ) : (
                data.advisor?.deck?.map((item, index) => (
                  <View key={index} style={styles.advisorCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.sectionCardHeader}>
                        <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(167, 139, 250, 0.15)', marginRight: 10 }]}>
                          <Text style={styles.sectionIconText}>📊</Text>
                        </View>
                        <Text style={styles.advisorTitle} numberOfLines={1}>{item.title}</Text>
                      </View>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item.title, item.content)}>
                        <Text style={styles.actionBtnText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.advisorContent}>{item.content}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* MARKETING TAB */}
          {selectedCategory === 'marketing' && (
            <View style={{ marginBottom: 40 }}>
              <Text style={styles.sectionTitle}>Copy Drafts</Text>
              {data.marketing?.posts?.length === 0 ? (
                <Text style={styles.emptyText}>No posts generated.</Text>
              ) : (
                data.marketing?.posts?.map((post, index) => {
                  const isCollapsed = !!collapsedPosts[index];
                  return (
                    <View key={index} style={styles.postCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.sectionCardHeader}>
                          <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(236, 72, 153, 0.15)', marginRight: 10 }]}>
                            <Text style={styles.sectionIconText}>📣</Text>
                          </View>
                          <Text style={styles.postPlatform}>{post.platform}</Text>
                        </View>
                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(`${post.platform} Post`, post.content)}>
                            <Text style={styles.actionBtnText}>Share</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.collapseBtn} onPress={() => togglePostCollapse(index)}>
                            <Text style={styles.collapseBtnText}>{isCollapsed ? "Expand" : "Collapse"}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {!isCollapsed && (
                        <Text style={styles.postContent}>{post.content}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

        </ScrollView>
      </View>
    );
  }

  // WIZARD SCREEN
  if (activeView === 'wizard') {
    return (
      <ScrollView style={styles.container}>
        <StatusBar style="light" />

        {/* Wizard Header */}
        <View style={styles.wizardHeader}>
          <TouchableOpacity onPress={() => setActiveView('dashboard')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.wizardHeaderText}>Craft Startup</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Templates Panel */}
        <View style={styles.templatesSection}>
          <Text style={styles.templatesTitle}>💡 Quick Try Templates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesContainer}>
            {TEMPLATES.map((tpl, index) => (
              <TouchableOpacity key={index} style={styles.templateCard} onPress={() => selectTemplate(tpl)}>
                <Text style={tpl.label === idea ? styles.templateText : styles.templateText}>{tpl.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>💡 Startup Idea</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. An AI fitness coach app..."
            placeholderTextColor="#555"
            value={idea}
            onChangeText={setIdea}
            multiline
          />

          <Text style={styles.label}>👥 Target Audience</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Busy professionals aged 25-40..."
            placeholderTextColor="#555"
            value={audience}
            onChangeText={setAudience}
          />

          <Text style={styles.label}>❗ Problem Statement</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. People don't know if they exercise correctly..."
            placeholderTextColor="#555"
            value={problem}
            onChangeText={setProblem}
          />

          <TouchableOpacity style={styles.button} onPress={handleGenerate}>
            <Text style={styles.buttonText}>🚀 Craft Startup Blueprint</Text>
          </TouchableOpacity>


        </View>
      </ScrollView>
    );
  }

  // Fallback
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  // WIZARD
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 24,
  },
  logo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  logoAI: {
    color: '#8b5cf6',
  },
  tagline: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
  },
  // TEMPLATES
  templatesSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  templatesTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templatesContainer: {
    flexDirection: 'row',
  },
  templateCard: {
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#4338ca',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
  },
  label: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#111122',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 50,
  },
  button: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // SETTINGS
  settingsToggleBtn: {
    alignSelf: 'center',
    padding: 12,
    marginTop: 12,
  },
  settingsToggleText: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '600',
  },
  settingsContainer: {
    backgroundColor: '#111122',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  settingsInput: {
    backgroundColor: '#07070d',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#475569',
  },
  settingsDesc: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  // LOADING
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  loadingDesc: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  // RESULTS
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#0a0a0f',
  },
  startupName: {
    color: '#a78bfa',
    fontSize: 26,
    fontWeight: 'bold',
  },
  restartBtn: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  restartText: {
    color: '#c084fc',
    fontWeight: 'bold',
  },
  tabBar: {
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1e1b4b',
  },
  activeTab: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#c084fc',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  // CARDS
  codeCard: {
    backgroundColor: '#111122',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1b4b',
    marginBottom: 8,
  },
  fileName: {
    color: '#c084fc',
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  actionBtnText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: 'bold',
  },
  collapseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 6,
    borderRadius: 8,
    backgroundColor: '#3b2f54',
  },
  collapseBtnText: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: 'bold',
  },
  codeText: {
    color: '#4ade80',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
    marginTop: 8,
  },
  advisorCard: {
    backgroundColor: '#111122',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  advisorTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  advisorContent: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  postCard: {
    backgroundColor: '#111122',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  postPlatform: {
    color: '#c084fc',
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  postContent: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  // WIZARD HEADER
  wizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#0a0a0f',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1b4b',
  },
  wizardHeaderText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // offset back button to center text
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1e1b4b',
  },
  backBtnText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // DASHBOARD
  dashboardHeader: {
    paddingTop: 70,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  dashboardTagline: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#111122',
    borderWidth: 1,
    borderColor: '#1e1b4b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statVal: {
    color: '#a78bfa',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  historyScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111122',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  historyCardName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyCardDate: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  historyCardSummary: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  historyDeleteBtn: {
    padding: 8,
    marginLeft: 10,
  },
  // EMPTY STATE
  dashboardEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#111122',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1b4b',
    marginTop: 10,
  },
  dashboardEmptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  dashboardEmptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dashboardEmptySub: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  dashboardEmptyBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  dashboardEmptyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#8b5cf6',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // SECTION CARDS (RESULTS SCREEN)
  sectionCard: {
    backgroundColor: '#111122',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionIconText: {
    fontSize: 16,
  },
  sectionCardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // PROJECT HUB
  hubTitleSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  hubTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  hubSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 6,
  },
  hubScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111122',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e1b4b',
  },
  hubIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  hubIconText: {
    fontSize: 22,
  },
  hubCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hubCardDesc: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 16,
    marginRight: 10,
  },
  hubBadge: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  hubBadgeText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // MOBILE LOGIN STYLES
  loginScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },
  loginDecorContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  loginOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  loginCard: {
    backgroundColor: 'rgba(17, 17, 34, 0.55)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 1,
  },
  loginLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginLogoText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loginLogoTextAI: {
    color: '#8b5cf6',
  },
  loginTitleText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  loginSubtitleText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 28,
  },
  loginErrorSummary: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  loginErrorSummaryText: {
    color: '#fca5a5',
    fontSize: 13,
    textAlign: 'center',
  },
  loginInputGroup: {
    marginBottom: 16,
  },
  loginInputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  loginInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  loginInputIcon: {
    marginRight: 8,
  },
  loginTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  loginPasswordToggle: {
    padding: 4,
  },
  loginStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  loginStrengthBars: {
    flexDirection: 'row',
    width: 80,
    gap: 4,
  },
  loginStrengthBar: {
    height: 4,
    borderRadius: 2,
    flex: 1,
  },
  loginStrengthText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  loginOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  loginRememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginRememberText: {
    color: '#94a3b8',
    fontSize: 13,
    marginLeft: 6,
  },
  loginForgotText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtnGroup: {
    gap: 12,
  },
  loginBtnPrimary: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  loginBtnTextPrimary: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loginBtnSecondary: {
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnTextSecondary: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loginErrorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
  },
  fpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 3, 7, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fpModalCard: {
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  fpModalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  fpModalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fpModalSub: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  fpOtpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  fpOtpInput: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fpResendBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  fpResendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.6,
  },
  fpResendBtnText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  fpResendBtnTextDisabled: {
    color: '#64748b',
  },
  fpSuccessIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutBtn: {
    padding: 8,
  },
});
