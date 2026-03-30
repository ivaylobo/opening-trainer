import styles from './Desk.module.css'

export default function Desk({ boardRef, containerRef, showing }) {
  return (
    <div className={styles.container} ref={containerRef}>
      <div
        className={`${styles.board} ${showing ? styles.showing : ''}`}
        ref={boardRef}
      />
    </div>
  )
}
