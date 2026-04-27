import React, { useState } from 'react'
import { AppProvider } from './context/AppContext'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import BodyMetrics from './pages/BodyMetrics'
import Meals from './pages/Meals'
import Exercise from './pages/Exercise'
import Charts from './pages/Charts'
import Settings from './pages/Settings'

const PAGES = {
  dashboard: Dashboard,
  body: BodyMetrics,
  meals: Meals,
  exercise: Exercise,
  charts: Charts,
  settings: Settings,
}

function AppInner() {
  const [page, setPage] = useState('dashboard')
  const Page = PAGES[page] || Dashboard

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24 pt-4 px-4 max-w-lg mx-auto w-full">
        <Page onNav={setPage} />
      </main>
      <NavBar page={page} onNav={setPage} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
