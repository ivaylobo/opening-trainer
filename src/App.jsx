import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header/Header'
import Desk from './components/Desk/Desk'
import styles from './App.module.css'

const STEP_DELAY_MS = 2000

const normalizeOpenings = (data) => {
  const hasSideBuckets =
    data && typeof data === 'object' && !Array.isArray(data) && ('white' in data || 'black' in data)

  if (hasSideBuckets) {
    return {
      white: data.white || {},
      black: data.black || {},
    }
  }

  return {
    white: data || {},
    black: {},
  }
}

function App() {
  const [openings, setOpenings] = useState({ white: {}, black: {} })
  const [openingsLoaded, setOpeningsLoaded] = useState(false)
  const [currentSide, setCurrentSide] = useState('white')
  const [selectedOpeningBySide, setSelectedOpeningBySide] = useState({
    white: '',
    black: '',
  })
  const [feedback, setFeedbackState] = useState({ text: '', type: '' })
  const [isShowing, setIsShowing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isBoardReady, setIsBoardReady] = useState(false)

  const openingsRef = useRef(openings)
  const currentSideRef = useRef(currentSide)
  const selectedOpeningBySideRef = useRef(selectedOpeningBySide)
  const isShowingRef = useRef(isShowing)
  const isPausedRef = useRef(isPaused)
  const openingCompleteRef = useRef(false)

  const boardRef = useRef(null)
  const boardContainerRef = useRef(null)
  const boardInstanceRef = useRef(null)

  const gameRef = useRef(null)
  const moveIndexRef = useRef(0)
  const currentOpeningRef = useRef([])

  const previewGameRef = useRef(null)
  const previewMovesRef = useRef([])
  const previewIndexRef = useRef(0)

  const previewTimerRef = useRef(null)
  const replyTimerRef = useRef(null)
  const resetRef = useRef(() => {})

  useEffect(() => {
    openingsRef.current = openings
  }, [openings])

  useEffect(() => {
    currentSideRef.current = currentSide
  }, [currentSide])

  useEffect(() => {
    selectedOpeningBySideRef.current = selectedOpeningBySide
  }, [selectedOpeningBySide])

  useEffect(() => {
    isShowingRef.current = isShowing
  }, [isShowing])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  const setFeedback = useCallback((text, type = '') => {
    setFeedbackState({ text, type })
  }, [])

  const setShowing = useCallback((value) => {
    isShowingRef.current = value
    setIsShowing(value)
  }, [])

  const setPaused = useCallback((value) => {
    isPausedRef.current = value
    setIsPaused(value)
  }, [])

  const clearPendingTimers = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }

    if (replyTimerRef.current) {
      clearTimeout(replyTimerRef.current)
      replyTimerRef.current = null
    }
  }, [])

  const getSideOpenings = useCallback(() => {
    return openingsRef.current[currentSideRef.current] || {}
  }, [])

  const getPlayerColor = useCallback(() => {
    return currentSideRef.current === 'white' ? 'w' : 'b'
  }, [])

  const applyCastlingRook = useCallback((move) => {
    const board = boardInstanceRef.current
    if (!board || !move || typeof move.flags !== 'string' || move.piece !== 'k') return

    if (move.flags.indexOf('k') !== -1) {
      const rookFrom = move.color === 'w' ? 'h1' : 'h8'
      const rookTo = move.color === 'w' ? 'f1' : 'f8'
      board.move(`${rookFrom}-${rookTo}`)
    } else if (move.flags.indexOf('q') !== -1) {
      const rookFrom = move.color === 'w' ? 'a1' : 'a8'
      const rookTo = move.color === 'w' ? 'd1' : 'd8'
      board.move(`${rookFrom}-${rookTo}`)
    }
  }, [])

  const renderMove = useCallback(
    (move, chessInstance) => {
      const board = boardInstanceRef.current
      if (!board) return

      if (move) {
        board.move(`${move.from}-${move.to}`)
        applyCastlingRook(move)
        return
      }

      board.position(chessInstance.fen())
    },
    [applyCastlingRook],
  )

  const finishOpening = useCallback(() => {
    if (openingCompleteRef.current) return

    openingCompleteRef.current = true
    setFeedback('Opening complete!', 'correct')

    setTimeout(() => {
      alert('You successfully finished the opening')
      resetRef.current()
    }, 1000)
  }, [setFeedback])

  const playOpponentMove = useCallback(
    (delayMs = 0) => {
      if (
        isShowingRef.current ||
        openingCompleteRef.current ||
        moveIndexRef.current >= currentOpeningRef.current.length
      ) {
        return
      }

      const game = gameRef.current
      if (!game || game.turn() === getPlayerColor()) {
        return
      }

      const runMove = () => {
        const nextMoveSan = currentOpeningRef.current[moveIndexRef.current]
        const autoMove = game.move(nextMoveSan)

        renderMove(autoMove, game)
        moveIndexRef.current += 1

        if (moveIndexRef.current >= currentOpeningRef.current.length) {
          finishOpening()
        }
      }

      if (delayMs > 0) {
        replyTimerRef.current = setTimeout(() => {
          replyTimerRef.current = null
          runMove()
        }, delayMs)
        return
      }

      runMove()
    },
    [finishOpening, getPlayerColor, renderMove],
  )

  const start = useCallback(() => {
    setShowing(false)
    setPaused(false)
    openingCompleteRef.current = false
    clearPendingTimers()

    const board = boardInstanceRef.current
    const Chess = window.Chess

    if (!board || !Chess) return

    gameRef.current = new Chess()
    moveIndexRef.current = 0
    currentOpeningRef.current =
      getSideOpenings()[selectedOpeningBySideRef.current[currentSideRef.current]] || []

    board.orientation(currentSideRef.current)
    board.position('start')
    setFeedback('')

    if (!currentOpeningRef.current.length) {
      setFeedback('No openings available for this side.', 'wrong')
      return
    }

    playOpponentMove()
  }, [clearPendingTimers, getSideOpenings, playOpponentMove, setFeedback, setPaused, setShowing])

  const reset = useCallback(() => {
    start()
  }, [start])

  useEffect(() => {
    resetRef.current = reset
  }, [reset])

  const scheduleNextPreviewMove = useCallback(() => {
    if (!isShowingRef.current || isPausedRef.current) return

    if (previewIndexRef.current >= previewMovesRef.current.length) {
      setShowing(false)
      setPaused(false)
      start()
      return
    }

    const san = previewMovesRef.current[previewIndexRef.current]
    previewTimerRef.current = setTimeout(() => {
      const previewGame = previewGameRef.current
      const board = boardInstanceRef.current
      if (!previewGame || !board) return

      const move = previewGame.move(san)
      if (move) {
        board.move(`${move.from}-${move.to}`)
        applyCastlingRook(move)
      } else {
        board.position(previewGame.fen())
      }
      previewIndexRef.current += 1
      scheduleNextPreviewMove()
    }, STEP_DELAY_MS)
  }, [applyCastlingRook, setPaused, setShowing, start])

  const showOpening = useCallback(() => {
    if (isShowingRef.current) return

    const board = boardInstanceRef.current
    const Chess = window.Chess
    if (!board || !Chess) return

    setShowing(true)
    setPaused(false)

    previewGameRef.current = new Chess()
    previewMovesRef.current =
      getSideOpenings()[selectedOpeningBySideRef.current[currentSideRef.current]] || []
    previewIndexRef.current = 0

    board.orientation(currentSideRef.current)
    board.position('start')
    previewGameRef.current.reset()
    setFeedback('')

    if (!previewMovesRef.current.length) {
      setShowing(false)
      setPaused(false)
      return
    }

    scheduleNextPreviewMove()
  }, [getSideOpenings, scheduleNextPreviewMove, setFeedback, setPaused, setShowing])

  const togglePause = useCallback(() => {
    if (!isShowingRef.current) return

    if (!isPausedRef.current) {
      setPaused(true)
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current)
        previewTimerRef.current = null
      }
      return
    }

    setPaused(false)
    scheduleNextPreviewMove()
  }, [scheduleNextPreviewMove, setPaused])

  const onDrop = useCallback(
    (source, target) => {
      if (isShowingRef.current || openingCompleteRef.current) return 'snapback'

      const game = gameRef.current
      if (!game) return 'snapback'

      const move = game.move({
        from: source,
        to: target,
        promotion: 'q',
      })

      if (!move) return 'snapback'

      const expected = currentOpeningRef.current[moveIndexRef.current]

      if (move.san !== expected) {
        setFeedback(`Wrong: ${move.san} | expected: ${expected}`, 'wrong')
        game.undo()
        return 'snapback'
      }

      moveIndexRef.current += 1
      setFeedback('Good!', 'correct')
      applyCastlingRook(move)

      if (moveIndexRef.current >= currentOpeningRef.current.length) {
        finishOpening()
        return undefined
      }

      if (game.turn() !== getPlayerColor()) {
        playOpponentMove(300)
      }

      return undefined
    },
    [applyCastlingRook, finishOpening, getPlayerColor, playOpponentMove, setFeedback],
  )

  const syncBoardSize = useCallback(() => {
    const container = boardContainerRef.current
    const board = boardInstanceRef.current

    if (!container) return

    const isMobile = window.innerWidth < 768
    const topOffset = container.getBoundingClientRect().top
    const horizontalPadding = isMobile ? 24 : 48
    const verticalPadding = isMobile ? 20 : 28
    const reservedFeedbackSpace = isMobile ? 88 : 96
    const maxWidth = Math.max(180, window.innerWidth - horizontalPadding)
    const maxHeight = Math.max(180, window.innerHeight - topOffset - reservedFeedbackSpace - verticalPadding)
    const boardSize = Math.min(maxWidth, maxHeight, 920)

    container.style.width = `${Math.floor(boardSize)}px`

    if (board) {
      board.resize()
    }
  }, [])

  const openingNames = useMemo(() => {
    const sideOpenings = openings[currentSide] || {}
    return Object.keys(sideOpenings)
  }, [openings, currentSide])

  const selectedOpening = selectedOpeningBySide[currentSide] || ''

  useEffect(() => {
    const sideOpenings = openings[currentSide] || {}
    const names = Object.keys(sideOpenings)
    const previousSelection = selectedOpeningBySide[currentSide]
    const nextSelection =
      names.length === 0
        ? ''
        : sideOpenings[previousSelection]
          ? previousSelection
          : names[0]

    setSelectedOpeningBySide((prev) => {
      if ((prev[currentSide] || '') === nextSelection) {
        return prev
      }
      return { ...prev, [currentSide]: nextSelection }
    })
  }, [currentSide, openings, selectedOpeningBySide])

  useEffect(() => {
    let cancelled = false

    fetch('/debuts.json')
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return
        setOpenings(normalizeOpenings(data))
        setOpeningsLoaded(true)
      })
      .catch((error) => console.error('Error loading debuts.json:', error))

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!openingsLoaded || boardInstanceRef.current || !boardRef.current) return

    const Chessboard = window.Chessboard
    if (!Chessboard) return

    boardInstanceRef.current = Chessboard(boardRef.current, {
      draggable: true,
      position: 'start',
      orientation: currentSideRef.current,
      onDrop,
      pieceTheme: 'assets/chesspieces/wikipedia/{piece}.png',
    })

    setIsBoardReady(true)
    syncBoardSize()
  }, [openingsLoaded, onDrop, syncBoardSize])

  useEffect(() => {
    if (!isBoardReady) return

    syncBoardSize()
    window.addEventListener('resize', syncBoardSize)

    return () => window.removeEventListener('resize', syncBoardSize)
  }, [isBoardReady, syncBoardSize])

  useEffect(() => {
    if (!isBoardReady) return
    start()
  }, [currentSide, isBoardReady, selectedOpening, start])

  useEffect(() => {
    return () => clearPendingTimers()
  }, [clearPendingTimers])

  const handleSideToggle = () => {
    setCurrentSide((prev) => (prev === 'white' ? 'black' : 'white'))
  }

  const handleSelectChange = (value) => {
    setSelectedOpeningBySide((prev) => ({
      ...prev,
      [currentSideRef.current]: value,
    }))
  }

  return (
    <div className={styles.app}>
      <h2 className={styles.title}>Opening Trainer</h2>
      <Header
        currentSide={currentSide}
        openingNames={openingNames}
        selectedOpening={selectedOpening}
        onSideToggle={handleSideToggle}
        onSelectChange={handleSelectChange}
        onReset={reset}
        onShow={showOpening}
        onPause={togglePause}
        isShowing={isShowing}
        isPaused={isPaused}
      />
      <Desk boardRef={boardRef} containerRef={boardContainerRef} showing={isShowing} />
      <div
        className={`${styles.feedback} ${feedback.type ? styles[feedback.type] : ''}`}
      >
        {feedback.text}
      </div>
    </div>
  )
}

export default App
