import { useEffect } from 'react'
import Button from '../Button/Button'
import styles from './CompletionDialog.module.css'

export default function CompletionDialog({
  open,
  openingName,
  side,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  const sideLabel = side === 'white' ? 'White' : 'Black'
  const detail = openingName
    ? `${openingName} for ${sideLabel} is complete.`
    : `The ${sideLabel} line is complete.`

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-dialog-title"
      >
        <div className={styles.kicker}>Training complete</div>
        <h3 className={styles.title} id="completion-dialog-title">
          You finished the line
        </h3>
        <p className={styles.text}>{detail}</p>
        <p className={styles.subtext}>Press OK to reset and start again.</p>
        <Button variant="primary" autoFocus className={styles.action} onClick={onConfirm}>
          OK
        </Button>
      </div>
    </div>
  )
}
