import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Algo deu errado</h1>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado. Nossa equipe foi notificada.
            </p>
            {this.state.error && (
              <details className="text-left bg-gray-50 rounded-lg p-4 mb-6 text-xs text-gray-500 overflow-auto max-h-32">
                <summary className="cursor-pointer font-medium mb-1">Detalhes técnicos</summary>
                {this.state.error.message}
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
