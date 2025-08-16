import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Provide a jest alias for tests written for Jest
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).jest = vi

// Polyfill scrollIntoView for JSDOM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(Element.prototype as any).scrollIntoView = vi.fn()

// Polyfill window.scrollTo used by framer-motion animations in tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).scrollTo = vi.fn()

// Mock react-router-dom hooks/components to avoid requiring a Router in unit tests
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    Link: ({ children, ...props }: any) => React.createElement('a', props, children),
    NavLink: ({ children, ...props }: any) => React.createElement('a', props, children),
    MemoryRouter: ({ children }: any) => React.createElement(React.Fragment, null, children),
    BrowserRouter: ({ children }: any) => React.createElement(React.Fragment, null, children),
  }
})