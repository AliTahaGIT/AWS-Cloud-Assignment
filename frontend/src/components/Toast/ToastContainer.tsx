import React from 'react'
import { createPortal } from 'react-dom'
import Toast from './Toast'
import type { ToastData } from '../../types/toast'
import './ToastContainer.css'

interface ToastContainerProps {
  toasts: ToastData[]
  onRemoveToast: (id: string) => void
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  if (toasts.length === 0) return null

  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={onRemoveToast}
        />
      ))}
    </div>,
    document.body
  )
}

export default ToastContainer