import Header from './components/Header/Header'
import Desk from './components/Desk/Desk'
import CompletionDialog from './components/ui/CompletionDialog/CompletionDialog'
import useOpeningsLoader from './hooks/useOpeningsLoader'
import useTrainerBoard from './hooks/useTrainerBoard'
import styles from './App.module.css'

function App() {
  useOpeningsLoader()

  const {
    boardRef,
    boardContainerRef,
    currentSide,
    openingNames,
    selectedOpening,
    selectedVariation,
    variationOptions,
    showVariationSelect,
    feedback,
    openingComplete,
    isShowing,
    isPaused,
    onSideToggle,
    onSelectChange,
    onVariationChange,
    onCompletionAcknowledge,
    onReset,
    onShow,
    onPause,
  } = useTrainerBoard()

  return (
    <div className={styles.app}>
      <h2 className={styles.title}>Opening Trainer</h2>
      <Header
        currentSide={currentSide}
        openingNames={openingNames}
        selectedOpening={selectedOpening}
        selectedVariation={selectedVariation}
        variationOptions={variationOptions}
        showVariationSelect={showVariationSelect}
        onSideToggle={onSideToggle}
        onSelectChange={onSelectChange}
        onVariationChange={onVariationChange}
        onReset={onReset}
        onShow={onShow}
        onPause={onPause}
        isShowing={isShowing}
        isPaused={isPaused}
      />
      <Desk boardRef={boardRef} containerRef={boardContainerRef} showing={isShowing} />
      <div
        className={`${styles.feedback} ${feedback.type ? styles[feedback.type] : ''}`}
      >
        {feedback.text}
      </div>
      <CompletionDialog
        open={openingComplete}
        openingName={selectedOpening}
        side={currentSide}
        onConfirm={onCompletionAcknowledge}
      />
    </div>
  )
}

export default App
