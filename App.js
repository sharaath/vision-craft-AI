import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Share
} from 'react-native';
import { useState, useEffect } from 'react';

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
        setData(result);
        // By default, collapse files but keep first one open for readability
        const initialCollapsed = {};
        if (result.code?.files) {
          result.code.files.forEach((_, idx) => {
            initialCollapsed[idx] = idx !== 0; // Collapsed if not the first file
          });
        }
        setCollapsedFiles(initialCollapsed);
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

  // RESULTS SCREEN
  if (data) {
    const tabs = [
      { key: 'blueprint', label: '📋 Blueprint' },
      { key: 'code', label: '💻 Code' },
      { key: 'advisor', label: '🧠 Advisor' },
      { key: 'marketing', label: '📣 Marketing' },
    ];

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

    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.resultsHeader}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.startupName}>{data.name}</Text>
          </View>
          <TouchableOpacity onPress={handleRestart} style={styles.restartBtn}>
            <Text style={styles.restartText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingRight: 32 }}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>

          {/* BLUEPRINT TAB */}
          {activeTab === 'blueprint' && (
            <View style={{ marginBottom: 40 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🚀 Executive Summary</Text>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(`${data.name} Blueprint`, fullBlueprintText)}>
                  <Text style={styles.actionBtnText}>Share All</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionText}>{data.blueprint?.executive_summary}</Text>

              <Text style={styles.sectionTitle}>❗ Problem</Text>
              <Text style={styles.sectionText}>{data.blueprint?.problem_analysis}</Text>

              <Text style={styles.sectionTitle}>✅ Solution</Text>
              <Text style={styles.sectionText}>{data.blueprint?.solution_overview}</Text>

              <Text style={styles.sectionTitle}>💰 Revenue Model</Text>
              <Text style={styles.sectionText}>{data.blueprint?.revenue_model}</Text>

              <Text style={styles.sectionTitle}>⚙️ Tech Stack</Text>
              <Text style={styles.sectionText}>{data.blueprint?.tech_stack}</Text>
            </View>
          )}

          {/* CODE TAB */}
          {activeTab === 'code' && (
            <View style={{ marginBottom: 40 }}>
              <Text style={styles.sectionTitle}>💻 Generated Code Files</Text>
              {data.code?.files?.length === 0 ? (
                <Text style={styles.emptyText}>No code files generated.</Text>
              ) : (
                data.code?.files?.map((file, index) => {
                  const isCollapsed = !!collapsedFiles[index];
                  return (
                    <View key={index} style={styles.codeCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
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
          {activeTab === 'advisor' && (
            <View style={{ marginBottom: 40 }}>
              <Text style={styles.sectionTitle}>🧠 Startup Advisor Deck</Text>
              {data.advisor?.deck?.length === 0 ? (
                <Text style={styles.emptyText}>No slides generated.</Text>
              ) : (
                data.advisor?.deck?.map((item, index) => (
                  <View key={index} style={styles.advisorCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.advisorTitle} numberOfLines={1}>{item.title}</Text>
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
          {activeTab === 'marketing' && (
            <View style={{ marginBottom: 40 }}>
              <Text style={styles.sectionTitle}>📣 Marketing Posts</Text>
              {data.marketing?.posts?.length === 0 ? (
                <Text style={styles.emptyText}>No posts generated.</Text>
              ) : (
                data.marketing?.posts?.map((post, index) => {
                  const isCollapsed = !!collapsedPosts[index];
                  return (
                    <View key={index} style={styles.postCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.postPlatform}>{post.platform}</Text>
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
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>VisionCraft<Text style={styles.logoAI}>AI</Text></Text>
        <Text style={styles.tagline}>Transform Your Idea Into a Real Startup</Text>
      </View>

      {/* Templates Panel */}
      <View style={styles.templatesSection}>
        <Text style={styles.templatesTitle}>💡 Quick Try Templates</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesContainer}>
          {TEMPLATES.map((tpl, index) => (
            <TouchableOpacity key={index} style={styles.templateCard} onPress={() => selectTemplate(tpl)}>
              <Text style={styles.templateText}>{tpl.label}</Text>
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
});
