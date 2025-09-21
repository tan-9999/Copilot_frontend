const API_BASE_URL = 'https://codebuddy-backend-2e8g.onrender.com/api';


export const sendPrompt = async ({ prompt, workingDirectory, verbose }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        working_directory: workingDirectory,
        verbose
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

export const validateDirectory = async (directory) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-directory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ directory })
    })

    return await response.json()
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

export const validateRepository = async (repoUrl) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-repo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repo_url: repoUrl })
    })

    return await response.json()
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    const data = await response.json()
    return { healthy: response.ok, data }
  } catch (error) {
    return { healthy: false, error: error.message }
  }
}
