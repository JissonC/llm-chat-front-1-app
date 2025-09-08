import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface ChatResponse {
  message: string
}

// Nueva interfaz para los parámetros
interface ChatParams {
  temperature?: number
  top_p?: number
  top_k?: number
  reasoning_effort?: 'high' | 'low' | 'medium' | 'minimal'
}

// Función para llamar al servidor de chat
async function sendMessage (body: { input: string; params?: ChatParams }): Promise<ChatResponse> {
  const response = await fetch('http://localhost:4000/api/completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Error al enviar mensaje')
  }

  const data = await response.json()
  return { message: data.message || data.content || 'Sin respuesta' }
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Array<Message>>([])
  const [inputValue, setInputValue] = useState('')

  // Nuevo estado para los parámetros de configuración
  const [configParams, setConfigParams] = useState<ChatParams>({
    temperature: 1.0,
    top_p: undefined, // Usamos 'undefined' para indicar que no hay valor
    top_k: undefined,
    reasoning_effort: 'low',
  })


  // Función para manejar los cambios en los inputs de configuración
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setConfigParams((prevParams) => {
      const newParams = { ...prevParams }

      // Lógica de validación y de solo permitir top-p o top-k
      if (name === 'top_p') {
        newParams.top_p = value !== '' ? parseFloat(value) : undefined
        if (newParams.top_p !== undefined) {
          newParams.top_k = undefined
        }
      } else if (name === 'top_k') {
        newParams.top_k = value !== '' ? parseInt(value, 10) : undefined
        if (newParams.top_k !== undefined) {
          newParams.top_p = undefined
        }
      } else {
        newParams[name] = value
      }
      return newParams
    })
  }

  const chatMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      const botMessage: Message = {
        id: Date.now().toString() + '-bot',
        content: data.message,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        content: `❌ Error: ${error.message}`,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || chatMutation.isPending) return

    // Validaciones
    if (configParams.temperature && (configParams.temperature < 0 || configParams.temperature > 2)) {
      alert('La temperatura debe estar entre 0 y 2.')
      return
    }
    if (configParams.top_p && (configParams.top_p < 0 || configParams.top_p > 1)) {
      alert('Top-P debe estar entre 0 y 1.')
      return
    }
    if (configParams.top_k && (configParams.top_k < 0 || configParams.top_k > 20)) {
      alert('Top-K debe estar entre 0 y 20.')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    // Crear el objeto completo a enviar
    const requestBody = {
      input: inputValue,
      params: configParams,
    }

    chatMutation.mutate(requestBody)
    setInputValue('')
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h1 className="text-xl font-semibold text-gray-800">
            Chat Assistant
          </h1>
        </div>
        <button
          onClick={clearChat}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
        >
          🗑️ Limpiar
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <span className="text-4xl block mb-2">💬</span>
            <p>¡Hola! Escribe un mensaje para comenzar.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start gap-2 max-w-xs md:max-w-md lg:max-w-lg`}
              >
                {!message.isUser && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    🤖
                  </div>
                )}
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isUser ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.isUser && (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    👤
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                🤖
              </div>
              <div className="bg-white border border-gray-200 rounded-lg rounded-bl-sm px-4 py-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">Escribiendo</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={chatMutation.isPending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || chatMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <span>📤</span>
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}
