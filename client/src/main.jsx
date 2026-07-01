import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

// 1. We create the caching engine right here
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. We wrap your entire app in the engine provider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)