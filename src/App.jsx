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

const isTouchLikeDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const coarsePointer =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches

  return coarsePointer || navigator.maxTouchPoints > 0 || 'ontouchstart' in window
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
  const boardPixelSizeRef = useRef(0)
  const viewportWidthRef = useRef(0)
  const touchDragRef = useRef({
    active: false,
    sourceSquare: '',
    pieceEl: null,
    ghostEl: null,
    ghostWidth: 0,
    ghostHeight: 0,
  })

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

  const attemptPlayerMove = useCallback(
    (source, target, { applyMoveOnBoard = false } = {}) => {
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

      if (applyMoveOnBoard) {
        const board = boardInstanceRef.current
        if (board) {
          board.position(game.fen(), false)
        }
      } else {
        applyCastlingRook(move)
      }

      if (moveIndexRef.current >= currentOpeningRef.current.length) {
        finishOpening()
        return 'ok'
      }

      if (game.turn() !== getPlayerColor()) {
        playOpponentMove(300)
      }

      return 'ok'
    },
    [applyCastlingRook, finishOpening, getPlayerColor, playOpponentMove, setFeedback],
  )

  const clearTouchDrag = useCallback(() => {
    const dragState = touchDragRef.current

    if (dragState.pieceEl) {
      dragState.pieceEl.style.opacity = ''
    }

    if (dragState.ghostEl) {
      dragState.ghostEl.remove()
    }

    touchDragRef.current = {
      active: false,
      sourceSquare: '',
      pieceEl: null,
      ghostEl: null,
      ghostWidth: 0,
      ghostHeight: 0,
    }
  }, [])

  const onTouchStartBoard = useCallback(
    (event) => {
      if (!isTouchLikeDevice()) return
      if (isShowingRef.current || openingCompleteRef.current) return

      const target = event.target
      if (!(target instanceof Element)) return

      const pieceEl = target.closest('[class*="piece-"]')
      if (!(pieceEl instanceof HTMLElement)) return

      const squareEl = pieceEl.closest('[data-square]')
      if (!(squareEl instanceof HTMLElement)) return

      const sourceSquare = squareEl.getAttribute('data-square')
      if (!sourceSquare) return

      const touch = event.changedTouches[0]
      if (!touch) return

      clearTouchDrag()

      const pieceRect = pieceEl.getBoundingClientRect()
      const ghostEl = pieceEl.cloneNode(true)
      if (!(ghostEl instanceof HTMLElement)) return

      ghostEl.style.position = 'fixed'
      ghostEl.style.left = '0'
      ghostEl.style.top = '0'
      ghostEl.style.width = `${pieceRect.width}px`
      ghostEl.style.height = `${pieceRect.height}px`
      ghostEl.style.pointerEvents = 'none'
      ghostEl.style.zIndex = '9999'
      ghostEl.style.opacity = '0.92'
      ghostEl.style.transform = `translate(${touch.clientX - pieceRect.width / 2}px, ${
        touch.clientY - pieceRect.height / 2
      }px)`
      document.body.appendChild(ghostEl)

      pieceEl.style.opacity = '0'

      touchDragRef.current = {
        active: true,
        sourceSquare,
        pieceEl,
        ghostEl,
        ghostWidth: pieceRect.width,
        ghostHeight: pieceRect.height,
      }

      event.preventDefault()
    },
    [clearTouchDrag],
  )

  const onTouchMoveBoard = useCallback((event) => {
    const dragState = touchDragRef.current
    if (!dragState.active || !dragState.ghostEl) return

    const touch = event.changedTouches[0]
    if (!touch) return

    dragState.ghostEl.style.transform = `translate(${touch.clientX - dragState.ghostWidth / 2}px, ${
      touch.clientY - dragState.ghostHeight / 2
    }px)`

    event.preventDefault()
  }, [])

  const onTouchEndBoard = useCallback(
    (event) => {
      const dragState = touchDragRef.current
      if (!dragState.active) return

      const touch = event.changedTouches[0]
      const sourceSquare = dragState.sourceSquare
      let targetSquare = ''

      if (touch) {
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY)
        if (dropTarget instanceof Element) {
          const targetSquareEl = dropTarget.closest('[data-square]')
          targetSquare = targetSquareEl?.getAttribute('data-square') || ''
        }
      }

      if (!sourceSquare || !targetSquare) {
        clearTouchDrag()
        event.preventDefault()
        return
      }

      const result = attemptPlayerMove(sourceSquare, targetSquare, {
        applyMoveOnBoard: true,
      })

      if (result === 'snapback') {
        const board = boardInstanceRef.current
        const game = gameRef.current
        if (board && game) {
          board.position(game.fen(), false)
        }
      }

      clearTouchDrag()
      event.preventDefault()
    },
    [attemptPlayerMove, clearTouchDrag],
  )

  const onTouchCancelBoard = useCallback(
    (event) => {
      if (!touchDragRef.current.active) return
      clearTouchDrag()
      event.preventDefault()
    },
    [clearTouchDrag],
  )

  const onDrop = useCallback(
    (source, target) => {
      const result = attemptPlayerMove(source, target)
      return result === 'snapback' ? 'snapback' : undefined
    },
    [attemptPlayerMove],
  )

  const syncBoardSize = useCallback(() => {
    const container = boardContainerRef.current
    const board = boardInstanceRef.current

    if (!container) return

    const isMobile = window.innerWidth < 768
    let nextBoardSize = 0

    if (isMobile) {
      container.style.width = '100%'
      nextBoardSize = Math.floor(container.getBoundingClientRect().width)
    } else {
      const topOffset = container.getBoundingClientRect().top
      const horizontalPadding = 48
      const verticalPadding = 28
      const reservedFeedbackSpace = 96
      const maxWidth = Math.max(180, window.innerWidth - horizontalPadding)
      const maxHeight = Math.max(
        180,
        window.innerHeight - topOffset - reservedFeedbackSpace - verticalPadding,
      )
      const boardSize = Math.min(maxWidth, maxHeight, 920)

      container.style.width = `${Math.floor(boardSize)}px`
      nextBoardSize = Math.floor(boardSize)
    }

    if (!board || nextBoardSize <= 0 || boardPixelSizeRef.current === nextBoardSize) return

    boardPixelSizeRef.current = nextBoardSize
    board.resize()
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
    const touchDevice = isTouchLikeDevice()

    boardInstanceRef.current = Chessboard(boardRef.current, {
      draggable: !touchDevice,
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
    viewportWidthRef.current = window.innerWidth

    const handleResize = () => {
      const nextViewportWidth = window.innerWidth
      const isMobile = nextViewportWidth < 768

      if (isMobile && nextViewportWidth === viewportWidthRef.current) {
        return
      }

      viewportWidthRef.current = nextViewportWidth
      syncBoardSize()
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [isBoardReady, syncBoardSize])

  useEffect(() => {
    if (!isBoardReady || !isTouchLikeDevice() || !boardRef.current) return

    const boardElement = boardRef.current

    boardElement.addEventListener('touchstart', onTouchStartBoard, { passive: false })
    window.addEventListener('touchmove', onTouchMoveBoard, { passive: false })
    window.addEventListener('touchend', onTouchEndBoard, { passive: false })
    window.addEventListener('touchcancel', onTouchCancelBoard, { passive: false })

    return () => {
      boardElement.removeEventListener('touchstart', onTouchStartBoard)
      window.removeEventListener('touchmove', onTouchMoveBoard)
      window.removeEventListener('touchend', onTouchEndBoard)
      window.removeEventListener('touchcancel', onTouchCancelBoard)
      clearTouchDrag()
    }
  }, [
    clearTouchDrag,
    isBoardReady,
    onTouchCancelBoard,
    onTouchEndBoard,
    onTouchMoveBoard,
    onTouchStartBoard,
  ])

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
