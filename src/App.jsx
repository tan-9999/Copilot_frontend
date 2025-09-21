import { useState, useEffect } from 'react'
import { sendPrompt, validateDirectory, validateRepository, checkBackendHealth } from './services/api'

function App() {
  const [showCover, setShowCover] = useState(true)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI Coding Buddy. I can analyze your codebase, understand project structure, and help with development tasks. Just provide a local directory path or Git repository URL!',
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  
  const [inputMessage, setInputMessage] = useState('')
  const [verboseMode, setVerboseMode] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [workingDirectory, setWorkingDirectory] = useState('https://github.com/microsoft/calculator')
  const [backendStatus, setBackendStatus] = useState({ healthy: false, checking: true })
  const [error, setError] = useState(null)

  // Check backend health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      const health = await checkBackendHealth()
      setBackendStatus({ healthy: health.healthy, checking: false })
      
      if (!health.healthy) {
        setError('Backend is not available. Please start the Flask server.')
      }
    }
    
    checkHealth()
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isTyping) return

    // Clear any previous errors
    setError(null)

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    }
    
    setMessages(prev => [...prev, userMessage])
    const currentPrompt = inputMessage
    setInputMessage('')
    setIsTyping(true)

    try {
      // Send request to backend
      const response = await sendPrompt({
        prompt: currentPrompt,
        workingDirectory: workingDirectory,
        verbose: verboseMode
      })

      if (response.success) {
        // Add AI response with real data
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.finalResponse,
          timestamp: new Date().toLocaleTimeString(),
          functionCalls: response.functionCalls?.map(fc => fc.name) || [],
          tokenCount: response.tokenCounts,
          iterations: response.totalIterations,
          repositoryInfo: response.repositoryInfo
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        // Handle backend errors
        const errorMessage = {
          id: Date.now() + 1,
          type: 'error',
          content: `Error: ${response.error || 'Unknown error occurred'}`,
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('API Error:', error)
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Failed to process request: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, errorMessage])
      
      // Set general error state
      setError(error.message)
    } finally {
      setIsTyping(false)
    }
  }

  const handleDirectoryChange = async () => {
    const newPath = prompt(
      'Enter Git repository URL (e.g., https://github.com/user/repo) or local directory path:', 
      workingDirectory
    )
    if (!newPath) return

    setIsTyping(true)
    try {
      // Check if it's a Git URL
      const isGitUrl = newPath.includes('github.com') || newPath.includes('gitlab.com') || newPath.includes('.git') || newPath.startsWith('https://') || newPath.startsWith('http://')
      
      if (isGitUrl) {
        // Validate Git repository
        const validation = await validateRepository(newPath)
        
        if (validation.valid) {
          setWorkingDirectory(newPath)
          setError(null)
          
          const confirmMessage = {
            id: Date.now(),
            type: 'system',
            content: `✅ Git repository connected: ${newPath}\n🔗 Branch: ${validation.branch || 'main'}\n📊 ${validation.code_files || 0} code files, ${validation.total_files || 0} total files (${validation.size_mb || 0}MB)\n📝 Last commit: ${validation.last_commit || 'Unknown'}`,
            timestamp: new Date().toLocaleTimeString()
          }
          setMessages(prev => [...prev, confirmMessage])
        } else {
          setError(`Repository validation failed: ${validation.error}`)
          
          const errorMessage = {
            id: Date.now(),
            type: 'error',
            content: `❌ Git repository validation failed: ${validation.error}`,
            timestamp: new Date().toLocaleTimeString()
          }
          setMessages(prev => [...prev, errorMessage])
        }
      } else {
        // Handle as local directory
        const validation = await validateDirectory(newPath)
        
        if (validation.valid) {
          setWorkingDirectory(newPath)
          setError(null)
          
          const confirmMessage = {
            id: Date.now(),
            type: 'system',
            content: validation.type === 'git_repository' 
              ? `✅ Git repository connected: ${newPath}\n📊 ${validation.code_files || 0} code files, ${validation.total_files || 0} total files`
              : `✅ Working directory changed to: ${newPath}\n📁 ${validation.fileCount} files, ${validation.dirCount} directories found`,
            timestamp: new Date().toLocaleTimeString()
          }
          setMessages(prev => [...prev, confirmMessage])
        } else {
          setError(`Invalid directory: ${validation.error}`)
          
          const errorMessage = {
            id: Date.now(),
            type: 'error',
            content: `❌ Directory validation failed: ${validation.error}`,
            timestamp: new Date().toLocaleTimeString()
          }
          setMessages(prev => [...prev, errorMessage])
        }
      }
    } catch (error) {
      setError(`Failed to validate: ${error.message}`)
    } finally {
      setIsTyping(false)
    }
  }

  const handleSlideUp = () => {
    setShowCover(false)
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  
  {/* Animated Background Elements */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }}></div>
    </div>
    
    {/* Floating background orbs */}
    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl animate-pulse"></div>
    <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
  </div>

  {/* Main Chat Interface */}
  <div className="relative min-h-screen flex items-center justify-center p-4">
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl h-[650px] flex flex-col overflow-hidden">
      
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-800/50 to-purple-800/50 backdrop-blur-sm px-6 py-4 border-b border-white/10 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Enhanced Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-50"></div>
              <div className="relative w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI Coding Buddy</h1>
              <p className="text-sm text-slate-300">Smart code analysis & assistance</p>
            </div>
          </div>
          
          {/* Enhanced Backend Status Indicator */}
          <div className="flex items-center space-x-2">
            {backendStatus.checking ? (
              <div className="flex items-center space-x-2 text-slate-300">
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
                <span className="text-xs">Checking...</span>
              </div>
            ) : backendStatus.healthy ? (
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-3 h-3 bg-green-400 rounded-full shadow-green-400/50 shadow-lg animate-pulse"></div>
                <span className="text-xs font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-400">
                <div className="w-3 h-3 bg-red-400 rounded-full shadow-red-400/50 shadow-lg animate-pulse"></div>
                <span className="text-xs font-medium">Disconnected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Error Banner */}
      {error && (
        <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 p-4 m-4 rounded-xl">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-3 text-red-400 hover:text-red-300 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Working Directory Section */}
      <div className="bg-slate-800/30 backdrop-blur-sm px-6 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
              {workingDirectory.includes('github.com') || workingDirectory.includes('gitlab.com') || workingDirectory.includes('.git') ? (
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-slate-200">
              {workingDirectory.includes('github.com') || workingDirectory.includes('gitlab.com') || workingDirectory.includes('.git') 
                ? 'Git Repository:' 
                : 'Working Directory:'}
            </span>
          </div>
          <button 
            onClick={handleDirectoryChange}
            disabled={isTyping}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 transition-colors"
          >
            Change
          </button>
        </div>
        <div className="mt-2">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2">
            <code className="text-sm text-slate-300 font-mono break-all">
              {workingDirectory}
            </code>
          </div>
        </div>
      </div>

      {/* Enhanced Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl backdrop-blur-sm border shadow-lg ${
              message.type === 'user' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-white/20' 
                : message.type === 'error'
                ? 'bg-red-500/10 text-red-200 border-red-500/20'
                : message.type === 'system'
                ? 'bg-green-500/10 text-green-200 border-green-500/20'
                : 'bg-slate-700/50 text-slate-200 border-slate-600/30'
            }`}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
              
              {message.functionCalls && message.functionCalls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.functionCalls.map((fn, idx) => (
                    <span key={idx} className="bg-white/10 backdrop-blur-sm text-xs px-3 py-1 rounded-full border border-white/20">
                      <span className='text-green-600'>#</span> {fn}
                    </span>
                  ))}
                </div>
              )}
              
              {message.iterations && (
                <div className="mt-2 text-xs opacity-80 flex items-center space-x-1">
                  <div className="w-3 h-3 bg-current rounded-full opacity-50"></div>
                  <span>{message.iterations} iterations</span>
                </div>
              )}
              
              {message.tokenCount && verboseMode && (
                <div className="mt-3 text-xs opacity-80 flex space-x-4">
                  <div className="flex items-center space-x-1">
                    <span>📥</span>
                    <span>{message.tokenCount.prompt_tokens}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📤</span>
                    <span>{message.tokenCount.response_tokens}</span>
                  </div>
                </div>
              )}
              
              <div className="text-xs mt-2 opacity-60">{message.timestamp}</div>
            </div>
          </div>
        ))}

        {/* Enhanced Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 backdrop-blur-sm px-4 py-3 rounded-2xl max-w-xs border border-slate-600/30">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-slate-300">AI is analyzing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-slate-800/30 backdrop-blur-sm border-t border-white/10 p-4 rounded-b-2xl">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={backendStatus.healthy ? "Ask me about your code..." : "Backend disconnected - check Flask server"}
              disabled={!backendStatus.healthy || isTyping}
              className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping || !backendStatus.healthy}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
          >
            {isTyping ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  </div>

      {/* Cover Page Overlay - Enhanced Version */}
<div className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center transition-transform duration-1000 ease-out overflow-hidden ${
  showCover ? 'translate-y-0' : '-translate-y-full'
}`}>
  
  {/* Animated Background Grid */}
  <div className="absolute inset-0 opacity-20">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
    <div className="absolute inset-0" style={{
      backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
      backgroundSize: '20px 20px'
    }}></div>
  </div>

  {/* Floating Elements */}
  <div className="absolute inset-0 overflow-hidden">
    {/* Large floating orbs */}
    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
    <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
    <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
    
    {/* Small floating particles */}
    <div className="absolute top-16 left-16 w-3 h-3 bg-white/30 rounded-full animate-bounce"></div>
    <div className="absolute top-24 right-32 w-2 h-2 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
    <div className="absolute bottom-28 left-24 w-4 h-4 bg-purple-400/30 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
    <div className="absolute bottom-16 right-16 w-3 h-3 bg-cyan-400/40 rounded-full animate-bounce" style={{ animationDelay: '2.5s' }}></div>
  </div>

  {/* Main Content */}
  <div className="relative z-10 text-center text-white px-6 max-w-4xl">
    
    {/* Logo Container with Enhanced Glassmorphism */}
    <div className="mb-12 flex justify-center">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
        
        {/* Main logo container */}
        <div className="relative w-28 h-28 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
          <svg className="w-14 h-14 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
        </div>
      </div>
    </div>

    {/* Enhanced Typography */}
    <div className="space-y-6 mb-12">
      {/* Main Headline with Gradient Text */}
      <h1 className="text-7xl md:text-8xl font-black tracking-tight mb-4">
        <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-2xl">
          Code Buddy
        </span>
      </h1>
      
      {/* Animated underline */}
      <div className="flex justify-center">
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
      </div>
    </div>

    {/* Enhanced Subtext */}
    <div className="space-y-8 mb-16">
      <p className="text-xl md:text-2xl font-light leading-relaxed text-slate-200 max-w-3xl mx-auto">
        Your intelligent coding companion that 
        <span className="text-blue-300 font-medium"> understands</span>,
        <span className="text-purple-300 font-medium"> analyzes</span>, and
        <span className="text-cyan-300 font-medium"> executes</span> your code like a pro
      </p>

      {/* Feature highlights with icons */}
      <div className="flex flex-wrap justify-center gap-8 text-lg">
        <div className="flex items-center space-x-2 text-blue-200">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <span className="text-sm">📁</span>
          </div>
          <span>Smart Exploration</span>
        </div>
        <div className="flex items-center space-x-2 text-purple-200">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <span className="text-sm">🔍</span>
          </div>
          <span>Code Analysis</span>
        </div>
        <div className="flex items-center space-x-2 text-cyan-200">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <span className="text-sm">⚡</span>
          </div>
          <span>Git Integration</span>
        </div>
      </div>
    </div>

    {/* Enhanced Call to Action */}
    <div className="space-y-6">
      <button
        onClick={handleSlideUp}
        className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
      >
        {/* Button glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-full blur"></div>
        
        <span className="relative flex items-center justify-center space-x-3">
          <span>Get Started</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </button>

      {/* Enhanced swipe indicator */}
      <div className="flex flex-col items-center space-y-3 text-slate-300">
        <div className="flex items-center space-x-2 text-sm">
          <span>or swipe up</span>
          <div className="w-8 h-12 border-2 border-slate-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
        
        <svg className="w-6 h-6 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
        </svg>
      </div>
    </div>
  </div>

  {/* Enhanced Touch/Mouse handler */}
  <div 
    className="absolute bottom-0 left-0 right-0 h-32 cursor-pointer group"
    onClick={handleSlideUp}
    onTouchStart={(e) => {
      const startY = e.touches[0].clientY
      const handleTouchMove = (e) => {
        const currentY = e.touches[0].clientY
        if (startY - currentY > 50) {
          handleSlideUp()
          document.removeEventListener('touchmove', handleTouchMove)
        }
      }
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', () => {
        document.removeEventListener('touchmove', handleTouchMove)
      }, { once: true })
    }}
  >
    {/* Visual indicator for swipe area */}
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors"></div>
  </div>
</div>

      {/* Verbose Toggle - Only show when cover is hidden */}
      {!showCover && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setVerboseMode(!verboseMode)}
            className={`px-4 py-2 rounded-full shadow-lg transition-all ${
              verboseMode 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            <span className="text-sm font-medium">
              {verboseMode ? 'Verbose ON' : 'Verbose OFF'}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

export default App







// import { useState } from 'react'

// function App() {
//   const [showCover, setShowCover] = useState(true)
//   const [messages, setMessages] = useState([
//     {
//       id: 1,
//       type: 'ai',
//       content: 'Hello! I\'m your AI Coding Buddy. I can analyze your codebase, understand project structure, and help with development tasks. Just tell me what you need help with!',
//       timestamp: new Date().toLocaleTimeString()
//     }
//   ])
  
//   const [inputMessage, setInputMessage] = useState('')
//   const [verboseMode, setVerboseMode] = useState(false)
//   const [isTyping, setIsTyping] = useState(false)
//   const [workingDirectory, setWorkingDirectory] = useState('D:\\Hackathon\\calculator')

//   const handleSendMessage = (e) => {
//     e.preventDefault()
//     if (!inputMessage.trim()) return

//     const userMessage = {
//       id: Date.now(),
//       type: 'user',
//       content: inputMessage,
//       timestamp: new Date().toLocaleTimeString()
//     }
    
//     setMessages(prev => [...prev, userMessage])
//     setInputMessage('')
//     setIsTyping(true)

//     setTimeout(() => {
//       const aiMessage = {
//         id: Date.now() + 1,
//         type: 'ai',
//         content: `Let me help you with that...\n\n*Analyzing request and calling necessary functions automatically*\n\nBased on your request: "${inputMessage}", I'll examine the relevant files and provide you with the information you need.`,
//         timestamp: new Date().toLocaleTimeString(),
//         functionCalls: ['get_file', 'read_file'],
//         tokenCount: verboseMode ? { prompt: 45, response: 120 } : null
//       }
//       setMessages(prev => [...prev, aiMessage])
//       setIsTyping(false)
//     }, 2000)
//   }

//   const handleSlideUp = () => {
//     setShowCover(false)
//   }

//   return (
//     <div className="relative min-h-screen bg-gray-100">
      
//       {/* Main Chat Interface (always rendered underneath) */}
//       <div className="min-h-screen flex items-center justify-center p-4">
//         <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl h-[650px] flex flex-col">
          
//           {/* Header */}
//           <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
//                 <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-lg font-semibold text-gray-800">AI Coding Buddy</h1>
//                 <p className="text-sm text-gray-500">Smart code analysis & assistance</p>
//               </div>
//             </div>
//           </div>

//           {/* Working Directory Section */}
//           <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-2">
//                 <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
//                 </svg>
//                 <span className="text-sm font-medium text-gray-600">Working Directory:</span>
//               </div>
//               <button 
//                 onClick={() => {
//                   const newPath = prompt('Enter new working directory:', workingDirectory)
//                   if (newPath) setWorkingDirectory(newPath)
//                 }}
//                 className="text-xs text-blue-500 hover:text-blue-600 font-medium"
//               >
//                 Change
//               </button>
//             </div>
//             <div className="mt-1">
//               <div className="bg-white border border-gray-200 rounded-md px-3 py-2">
//                 <code className="text-sm text-gray-800 font-mono break-all">
//                   {workingDirectory}
//                 </code>
//               </div>
//             </div>
//           </div>

//           {/* Messages Area */}
//           <div className="flex-1 overflow-y-auto p-4 space-y-4">
//             {messages.map((message) => (
//               <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
//                 <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
//                   message.type === 'user' 
//                     ? 'bg-blue-500 text-white' 
//                     : 'bg-gray-200 text-gray-800'
//                 }`}>
//                   <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  
//                   {message.functionCalls && (
//                     <div className="mt-2 flex flex-wrap gap-1">
//                       {message.functionCalls.map((fn, idx) => (
//                         <span key={idx} className="bg-gray-300 text-xs px-2 py-1 rounded-full text-gray-700">
//                           🤖 {fn}
//                         </span>
//                       ))}
//                     </div>
//                   )}
                  
//                   {message.tokenCount && verboseMode && (
//                     <div className="mt-2 text-xs opacity-75 flex space-x-3">
//                       <span>📥 {message.tokenCount.prompt}</span>
//                       <span>📤 {message.tokenCount.response}</span>
//                     </div>
//                   )}
                  
//                   <div className="text-xs mt-1 opacity-75">{message.timestamp}</div>
//                 </div>
//               </div>
//             ))}

//             {isTyping && (
//               <div className="flex justify-start">
//                 <div className="bg-gray-200 px-4 py-2 rounded-lg max-w-xs">
//                   <div className="flex items-center space-x-2">
//                     <div className="flex space-x-1">
//                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                     </div>
//                     <span className="text-xs text-gray-500">AI is analyzing...</span>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Input Area */}
//           <div className="border-t border-gray-200 p-4">
//             <form onSubmit={handleSendMessage} className="flex space-x-3">
//               <input
//                 type="text"
//                 value={inputMessage}
//                 onChange={(e) => setInputMessage(e.target.value)}
//                 placeholder="e.g., 'What's in my project?', 'Explain main.py', 'Run the calculator'"
//                 className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//               <button
//                 type="submit"
//                 disabled={!inputMessage.trim() || isTyping}
//                 className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
//               >
//                 Send
//               </button>
//             </form>
            
            
//           </div>
//         </div>
//       </div>

//       {/* Cover Page Overlay */}
//       <div className={`fixed inset-0 bg-gradient-to-br from-black via-white to-gray-800 flex items-center justify-center transition-transform duration-1000 ease-out ${
//         showCover ? 'translate-y-0' : '-translate-y-full'
//       }`}>
        
//         {/* Background Pattern */}
//         <div className="absolute inset-0 opacity-10">
//           <div className="absolute top-10 left-10 w-20 h-20 border border-white rounded-full animate-pulse"></div>
//           <div className="absolute top-32 right-20 w-16 h-16 border border-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
//           <div className="absolute bottom-20 left-20 w-12 h-12 border border-white rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
//           <div className="absolute bottom-32 right-10 w-24 h-24 border border-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
//         </div>

//         <div className="text-center text-white z-10 px-6">
//           {/* Logo/Icon */}
//           <div className="mb-8 flex justify-center">
//             <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white border-opacity-30">
//               <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
//                 <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
//               </svg>
//             </div>
//           </div>

//           {/* Main Headline */}
//           <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight ">
//             Code Buddy
//           </h1>

//           {/* Catchy Subtext */}
//           <p className="text-xl md:text-2xl font-light mb-8 text-blue-100 max-w-2xl mx-auto leading-relaxed">
//             Your intelligent coding companion that understands, analyzes, and executes your code like a pro
//           </p>

//           <p className="text-lg md:text-xl font-light mb-12 text-blue-200 max-w-xl mx-auto">
//             ✨ Smart file exploration • 🔍 Code analysis • ⚡ Instant execution
//           </p>

//           {/* Call to Action */}
//           <div className="space-y-4">
//             <button
//               onClick={handleSlideUp}
//               className="group bg-black text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
//             >
//               <span className="flex items-center justify-center space-x-2">
//                 <span>Get Started</span>
//                 <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
//                 </svg>
//               </span>
//             </button>

//             {/* Swipe up indicator */}
//             <div className="flex flex-col items-center space-y-2 animate-bounce">
//               <p className="text-sm text-blue-200">or swipe up</p>
//               <svg className="w-6 h-6 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
//                 <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
//               </svg>
//             </div>
//           </div>
//         </div>

//         {/* Touch/Mouse handler for slide up */}
//         <div 
//           className="absolute bottom-0 left-0 right-0 h-32 cursor-pointer"
//           onClick={handleSlideUp}
//           onTouchStart={(e) => {
//             const startY = e.touches[0].clientY
//             const handleTouchMove = (e) => {
//               const currentY = e.touches[0].clientY
//               if (startY - currentY > 50) { // Swipe up threshold
//                 handleSlideUp()
//                 document.removeEventListener('touchmove', handleTouchMove)
//               }
//             }
//             document.addEventListener('touchmove', handleTouchMove)
//             document.addEventListener('touchend', () => {
//               document.removeEventListener('touchmove', handleTouchMove)
//             }, { once: true })
//           }}
//         />
//       </div>

//       {/* Verbose Toggle - Only show when cover is hidden */}
//       {!showCover && (
//         <div className="fixed bottom-6 right-6 z-50">
//           <button
//             onClick={() => setVerboseMode(!verboseMode)}
//             className={`px-4 py-2 rounded-full shadow-lg transition-all ${
//               verboseMode 
//                 ? 'bg-green-500 hover:bg-green-600 text-white' 
//                 : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
//             }`}
//           >
//             <span className="text-sm font-medium">
//               {verboseMode ? 'Verbose ON' : 'Verbose OFF'}
//             </span>
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }

// export default App


