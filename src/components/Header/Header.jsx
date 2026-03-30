import Button from '../ui/Button/Button'
import Select from '../ui/Select/Select'
import styles from './Header.module.css'

export default function Header({
  currentSide,
  openingNames,
  selectedOpening,
  onSideToggle,
  onSelectChange,
  onReset,
  onShow,
  onPause,
  isShowing,
  isPaused,
}) {
  return (
    <header className={styles.controls}>
      <Button
        variant="sideToggle"
        tone={currentSide}
        onClick={onSideToggle}
        aria-label={`Current repertoire: ${currentSide}`}
      >
        {currentSide === 'white' ? 'White' : 'Black'}
      </Button>
      <Select
        options={openingNames}
        value={selectedOpening}
        onChange={onSelectChange}
        aria-label="Select opening"
      />
      <Button variant="ghost" onClick={onReset}>
        Restart
      </Button>
      <Button variant="primary" onClick={onShow}>
        Show
      </Button>
      {isShowing ? (
        <Button onClick={onPause}>{isPaused ? 'Resume' : 'Pause'}</Button>
      ) : null}
    </header>
  )
}
