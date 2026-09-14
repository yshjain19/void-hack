import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { casesApi } from './api'

export interface ToolItem {
  label: string
  path: string
  icon?: any
}

interface CaseContextType {
  activeCaseId: string | null
  activeCaseTitle: string | null
  setActiveCase: (id: string, title?: string) => void
  clearActiveCase: () => void
  isCaseSelectorOpen: boolean
  targetTool: ToolItem | null
  openCaseSelector: (tool?: ToolItem) => void
  closeCaseSelector: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
}

const CaseContext = createContext<CaseContextType | undefined>(undefined)

const STORAGE_KEY_ID = 'cybertrace_active_case_id'
const STORAGE_KEY_TITLE = 'cybertrace_active_case_title'

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [activeCaseId, setActiveCaseIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_ID) || localStorage.getItem('forensiq_active_case_id')
  })
  const [activeCaseTitle, setActiveCaseTitleState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_TITLE) || localStorage.getItem('forensiq_active_case_title')
  })
  const [isCaseSelectorOpen, setIsCaseSelectorOpen] = useState(false)
  const [targetTool, setTargetTool] = useState<ToolItem | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const setActiveCase = (id: string, title?: string) => {
    setActiveCaseIdState(id)
    localStorage.setItem(STORAGE_KEY_ID, id)
    if (title) {
      setActiveCaseTitleState(title)
      localStorage.setItem(STORAGE_KEY_TITLE, title)
    }
  }

  const clearActiveCase = () => {
    setActiveCaseIdState(null)
    setActiveCaseTitleState(null)
    localStorage.removeItem(STORAGE_KEY_ID)
    localStorage.removeItem(STORAGE_KEY_TITLE)
  }

  const openCaseSelector = (tool?: ToolItem) => {
    setTargetTool(tool || null)
    setIsCaseSelectorOpen(true)
  }

  const closeCaseSelector = () => {
    setIsCaseSelectorOpen(false)
    setTargetTool(null)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev)
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Sync active case from URL if navigating to a case page
  useEffect(() => {
    const match = location.pathname.match(/^\/cases\/([^/]+)/)
    if (match && match[1] && match[1] !== 'new') {
      const caseIdFromUrl = match[1]
      if (caseIdFromUrl !== activeCaseId) {
        setActiveCaseIdState(caseIdFromUrl)
        localStorage.setItem(STORAGE_KEY_ID, caseIdFromUrl)
      }
    }
  }, [location.pathname, activeCaseId])

  // If no active case is cached, automatically fetch the most recent case so tools work immediately
  useEffect(() => {
    if (!activeCaseId) {
      casesApi
        .list({ limit: 1 })
        .then(res => {
          const items = res.data?.items
          if (items && items.length > 0) {
            const first = items[0]
            setActiveCase(first.id, first.title)
          }
        })
        .catch(() => {
          // ignore error if backend unreachable
        })
    }
  }, [])

  return (
    <CaseContext.Provider
      value={{
        activeCaseId,
        activeCaseTitle,
        setActiveCase,
        clearActiveCase,
        isCaseSelectorOpen,
        targetTool,
        openCaseSelector,
        closeCaseSelector,
        mobileMenuOpen,
        setMobileMenuOpen,
        toggleMobileMenu,
      }}
    >
      {children}
    </CaseContext.Provider>
  )
}

export function useCase() {
  const context = useContext(CaseContext)
  if (!context) {
    throw new Error('useCase must be used within a CaseProvider')
  }
  return context
}
