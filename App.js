import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Share
} from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

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
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, wizard, loading, project_hub, category_detail
  const [selectedCategory, setSelectedCategory] = useState('blueprint');

  // Load history from AsyncStorage on startup
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem('VISIONCRAFTAI_HISTORY');
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load history', e);
      }
    };
    loadHistory();
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

  // DASHBOARD VIEW
  if (activeView === 'dashboard') {
    const totalCodeFiles = history.reduce((acc, item) => acc + (item.code?.files?.length || 0), 0);
    const totalMarketingPosts = history.reduce((acc, item) => acc + (item.marketing?.posts?.length || 0), 0);

    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
        <StatusBar style="light" />
        
        {/* Dashboard Header */}
        <View style={styles.dashboardHeader}>
          <Text style={styles.logo}>VisionCraft<Text style={styles.logoAI}>AI</Text></Text>
          <Text style={styles.dashboardTagline}>Your Personal AI Incubator</Text>
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

          {/* Settings Toggle */}
          <TouchableOpacity 
            style={styles.settingsToggleBtn} 
            onPress={() => setShowSettings(!showSettings)}
          >
            <Text style={styles.settingsToggleText}>
              {showSettings ? "⚙️ Hide API Settings" : "⚙️ Configure API Server"}
            </Text>
          </TouchableOpacity>

          {/* Settings Panel */}
          {showSettings && (
            <View style={styles.settingsContainer}>
              <Text style={styles.settingsLabel}>Backend API Server URL</Text>
              <TextInput
                style={styles.settingsInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="e.g. http://localhost:8000"
                placeholderTextColor="#555"
              />
              <Text style={styles.settingsDesc}>
                Using localtunnel? Use the tunnel URL. Using local environment? Use your computer's IP (e.g. http://192.168.1.5:8000).
              </Text>
            </View>
          )}
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
});
