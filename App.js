import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useState } from 'react';

const SERVER_URL = 'http://10.168.79.119:8000';

export default function App() {
  const [idea, setIdea] = useState('');
  const [audience, setAudience] = useState('');
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('blueprint');

  const handleGenerate = async () => {
    if (!idea || !audience || !problem) {
      Alert.alert('Missing Fields', 'Please fill in all three fields!');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, audience, problem })
      });
      const result = await response.json();
      setData(result);
    } catch (err) {
      Alert.alert('Connection Error', 'Could not reach the server. Make sure server.py is running!');
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
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingTitle}>Generating Your Startup...</Text>
        <Text style={styles.loadingDesc}>Analyzing idea, building blueprint, crafting code...</Text>
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

    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.startupName}>{data.name}</Text>
          <TouchableOpacity onPress={handleRestart} style={styles.restartBtn}>
            <Text style={styles.restartText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
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

        {/* Content */}
        <ScrollView style={styles.content}>

          {/* BLUEPRINT TAB */}
          {activeTab === 'blueprint' && (
            <View>
              <Text style={styles.sectionTitle}>🚀 Executive Summary</Text>
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
            <View>
              <Text style={styles.sectionTitle}>💻 Generated Code Files</Text>
              {data.code?.files?.map((file, index) => (
                <View key={index} style={styles.codeCard}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.codeText}>{file.content}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ADVISOR TAB */}
          {activeTab === 'advisor' && (
            <View>
              <Text style={styles.sectionTitle}>🧠 Startup Advisor</Text>
              {data.advisor?.deck?.map((item, index) => (
                <View key={index} style={styles.advisorCard}>
                  <Text style={styles.advisorTitle}>{item.title}</Text>
                  <Text style={styles.advisorContent}>{item.content}</Text>
                </View>
              ))}
            </View>
          )}

          {/* MARKETING TAB */}
          {activeTab === 'marketing' && (
            <View>
              <Text style={styles.sectionTitle}>📣 Marketing Posts</Text>
              {data.marketing?.posts?.map((post, index) => (
                <View key={index} style={styles.postCard}>
                  <Text style={styles.postPlatform}>{post.platform}</Text>
                  <Text style={styles.postContent}>{post.content}</Text>
                </View>
              ))}
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

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>💡 Startup Idea</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. An AI fitness coach app..."
          placeholderTextColor="#666"
          value={idea}
          onChangeText={setIdea}
          multiline
        />

        <Text style={styles.label}>👥 Target Audience</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Busy professionals aged 25-40..."
          placeholderTextColor="#666"
          value={audience}
          onChangeText={setAudience}
        />

        <Text style={styles.label}>❗ Problem Statement</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. People don't know if they exercise correctly..."
          placeholderTextColor="#666"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  // WIZARD
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoAI: {
    color: '#8b5cf6',
  },
  tagline: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  form: {
    padding: 20,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 50,
  },
  button: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
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
    color: '#888',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
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
    color: '#8b5cf6',
    fontSize: 24,
    fontWeight: 'bold',
  },
  restartBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  restartText: {
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
  tabBar: {
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
  },
  activeTab: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    color: '#888',
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
  sectionTitle: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionText: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 22,
  },
  codeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  fileName: {
    color: '#8b5cf6',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 13,
  },
  codeText: {
    color: '#88ff88',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  advisorCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  advisorTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
  },
  advisorContent: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 20,
  },
  postCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  postPlatform: {
    color: '#8b5cf6',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 6,
  },
  postContent: {
    color: '#cccccc',
    fontSize: 13,
    lineHeight: 20,
  },
});