import Button from '../ui/Button/Button'
import Select from '../ui/Select/Select'
import styles from './Header.module.css'

export default function Header({
  currentSide,
  openingNames,
  selectedOpening,
  selectedVariation,
  variationOptions,
  showVariationSelect,
  onSideToggle,
  onSelectChange,
  onVariationChange,
  onReset,
  onShow,
  onPause,
  isShowing,
  isPaused,
}) {
  const nextSide = currentSide === 'white' ? 'black' : 'white'

  return (
    <header className={styles.controls}>
      <Button
        variant="sideToggle"
        tone={nextSide}
        onClick={onSideToggle}
        aria-label={`Switch repertoire to ${nextSide}`}
      >
        {nextSide === 'white' ? 'White' : 'Black'}
      </Button>
      <Select
        options={openingNames}
        value={selectedOpening}
        onChange={onSelectChange}
        aria-label="Select opening"
      />
      {showVariationSelect ? (
        <Select
          options={variationOptions}
          value={selectedVariation}
          onChange={onVariationChange}
          aria-label="Select variation"
        />
      ) : null}
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
