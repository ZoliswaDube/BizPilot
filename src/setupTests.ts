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

// Mock HTMLCanvasElement.getContext to silence Chart.js warnings in JSDOM
if (typeof HTMLCanvasElement !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(HTMLCanvasElement.prototype as any).getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: [] })),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    canvas: (() => {
      const c = document.createElement('canvas')
      c.width = 100
      c.height = 100
      return c
    })(),
  }))
}

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