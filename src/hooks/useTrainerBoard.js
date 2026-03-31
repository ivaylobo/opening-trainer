import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectCurrentSide,
  selectCurrentOpening,
  selectFeedback,
  selectOpeningGroups,
  selectOpeningNames,
  selectIsBoardReady,
  selectIsPaused,
  selectIsShowing,
  selectMoveIndex,
  selectOpeningComplete,
  selectOpenings,
  selectOpeningsLoaded,
  selectSelectedOpening,
  selectSelectedOpeningBySide,
  setBoardReady,
  setFeedback,
  setMoveIndex,
  setOpeningComplete,
  setPaused,
  setSelectedOpening,
  setShowing,
  startSession,
  toggleSide,
} from '../store/trainerSlice'
import { isTouchLikeDevice } from '../utils/device'

const STEP_DELAY_MS = 2000

export default function useTrainerBoard() {
  const dispatch = useDispatch()

  const openings = useSelector(selectOpenings)
  const openingsLoaded = useSelector(selectOpeningsLoaded)
  const currentSide = useSelector(selectCurrentSide)
  const selectedOpeningBySide = useSelector(selectSelectedOpeningBySide)
  const selectedOpening = useSelector(selectSelectedOpening)
  const openingGroups = useSelector(selectOpeningGroups)
  const openingNames = useSelector(selectOpeningNames)
  const feedback = useSelector(selectFeedback)
  const isShowing = useSelector(selectIsShowing)
  const isPaused = useSelector(selectIsPaused)
  const isBoardReady = useSelector(selectIsBoardReady)
  const openingComplete = useSelector(selectOpeningComplete)
  const currentOpening = useSelector(selectCurrentOpening)
  const moveIndex = useSelector(selectMoveIndex)

  const openingsRef = useRef(openings)
  const currentSideRef = useRef(currentSide)
  const selectedOpeningBySideRef = useRef(selectedOpeningBySide)
  const isShowingRef = useRef(isShowing)
  const isPausedRef = useRef(isPaused)
  const openingCompleteRef = useRef(openingComplete)
  const currentOpeningRef = useRef(currentOpening)
  const moveIndexRef = useRef(moveIndex)

  const boardRef = useRef(null)
  const boardContainerRef = useRef(null)
  const boardInstanceRef = useRef(null)

  const gameRef = useRef(null)
  const previewGameRef = useRef(null)
  const previewMovesRef = useRef([])
  const previewIndexRef = useRef(0)

  const previewTimerRef = useRef(null)
  const replyTimerRef = useRef(null)
  const resetRef = useRef(() => {})
  const scheduleNextPreviewMoveRef = useRef(() => {})
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

  useEffect(() => {
    openingCompleteRef.current = openingComplete
  }, [openingComplete])

  useEffect(() => {
    currentOpeningRef.current = currentOpening
  }, [currentOpening])

  useEffect(() => {
    moveIndexRef.current = moveIndex
  }, [moveIndex])

  const setFeedbackState = useCallback(
    (text, type = '') => {
      dispatch(setFeedback({ text, type }))
    },
    [dispatch],
  )

  const setShowingState = useCallback(
    (value) => {
      isShowingRef.current = value
      dispatch(setShowing(value))
    },
    [dispatch],
  )

  const setPausedState = useCallback(
    (value) => {
      isPausedRef.current = value
      dispatch(setPaused(value))
    },
    [dispatch],
  )

  const setMoveIndexState = useCallback(
    (value) => {
      moveIndexRef.current = value
      dispatch(setMoveIndex(value))
    },
    [dispatch],
  )

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

  const getSelectedOpeningMoves = useCallback((side) => {
    const resolvedSide = side || currentSideRef.current
    const sideOpenings = openingsRef.current[resolvedSide] || {}
    const selection = selectedOpeningBySideRef.current[resolvedSide] || {
      opening: '',
      variation: 0,
    }
    const variations = Array.isArray(sideOpenings[selection.opening])
      ? sideOpenings[selection.opening]
      : []
    const variationIndex =
      Number.isInteger(selection.variation) &&
      selection.variation >= 0 &&
      selection.variation < variations.length
        ? selection.variation
        : 0
    const selectedVariation = variations[variationIndex]

    return Array.isArray(selectedVariation?.moves) ? selectedVariation.moves : []
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

  const startRef = useRef(() => {})

  const finishOpening = useCallback(() => {
    if (openingCompleteRef.current) return

    openingCompleteRef.current = true
    dispatch(setOpeningComplete(true))
    setFeedbackState('Opening complete!', 'correct')

    setTimeout(() => {
      alert('You successfully finished the opening')
      resetRef.current()
    }, 1000)
  }, [dispatch, setFeedbackState])

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

        if (!autoMove) return

        renderMove(autoMove, game)
        const nextIndex = moveIndexRef.current + 1
        setMoveIndexState(nextIndex)

        if (nextIndex >= currentOpeningRef.current.length) {
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
    [finishOpening, getPlayerColor, renderMove, setMoveIndexState],
  )

  const startSessionRuntime = useCallback(
    (moves) => {
      setShowingState(false)
      setPausedState(false)
      openingCompleteRef.current = false
      currentOpeningRef.current = moves
      setMoveIndexState(0)
      dispatch(setOpeningComplete(false))
      dispatch(startSession({ moves }))
      clearPendingTimers()
    },
    [clearPendingTimers, dispatch, setMoveIndexState, setPausedState, setShowingState],
  )

  const startStable = useCallback(() => {
    clearTouchDrag()

    const board = boardInstanceRef.current
    const Chess = window.Chess
    if (!board || !Chess) return

    const nextOpening = getSelectedOpeningMoves(currentSideRef.current)

    gameRef.current = new Chess()
    startSessionRuntime(nextOpening)

    board.orientation(currentSideRef.current)
    board.position('start')

    if (!nextOpening.length) {
      setFeedbackState('No openings available for this side.', 'wrong')
      return
    }

    playOpponentMove()
  }, [
    clearTouchDrag,
    getSelectedOpeningMoves,
    playOpponentMove,
    setFeedbackState,
    startSessionRuntime,
  ])

  useEffect(() => {
    startRef.current = startStable
  }, [startStable])

  const reset = useCallback(() => {
    startRef.current()
  }, [])

  useEffect(() => {
    resetRef.current = reset
  }, [reset])

  const scheduleNextPreviewMove = useCallback(() => {
    if (!isShowingRef.current || isPausedRef.current) return

    if (previewIndexRef.current >= previewMovesRef.current.length) {
      setShowingState(false)
      setPausedState(false)
      startRef.current()
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
      scheduleNextPreviewMoveRef.current()
    }, STEP_DELAY_MS)
  }, [applyCastlingRook, setPausedState, setShowingState])

  useEffect(() => {
    scheduleNextPreviewMoveRef.current = scheduleNextPreviewMove
  }, [scheduleNextPreviewMove])

  const showOpening = useCallback(() => {
    if (isShowingRef.current) return

    const board = boardInstanceRef.current
    const Chess = window.Chess
    if (!board || !Chess) return

    setShowingState(true)
    setPausedState(false)

    previewGameRef.current = new Chess()
    previewMovesRef.current = getSelectedOpeningMoves(currentSideRef.current)
    previewIndexRef.current = 0

    board.orientation(currentSideRef.current)
    board.position('start')
    previewGameRef.current.reset()
    setFeedbackState('')

    if (!previewMovesRef.current.length) {
      setShowingState(false)
      setPausedState(false)
      return
    }

    scheduleNextPreviewMoveRef.current()
  }, [getSelectedOpeningMoves, setFeedbackState, setPausedState, setShowingState])

  const togglePausePreview = useCallback(() => {
    if (!isShowingRef.current) return

    if (!isPausedRef.current) {
      setPausedState(true)
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current)
        previewTimerRef.current = null
      }
      return
    }

    setPausedState(false)
    scheduleNextPreviewMoveRef.current()
  }, [setPausedState])

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
        setFeedbackState(`Wrong: ${move.san} | expected: ${expected}`, 'wrong')
        game.undo()
        return 'snapback'
      }

      const nextIndex = moveIndexRef.current + 1
      setMoveIndexState(nextIndex)
      setFeedbackState('Good!', 'correct')

      if (applyMoveOnBoard) {
        const board = boardInstanceRef.current
        if (board) {
          board.position(game.fen(), false)
        }
      } else {
        applyCastlingRook(move)
      }

      if (nextIndex >= currentOpeningRef.current.length) {
        finishOpening()
        return 'ok'
      }

      if (game.turn() !== getPlayerColor()) {
        playOpponentMove(300)
      }

      return 'ok'
    },
    [applyCastlingRook, finishOpening, getPlayerColor, playOpponentMove, setFeedbackState, setMoveIndexState],
  )

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

    dispatch(setBoardReady(true))
    syncBoardSize()
  }, [dispatch, onDrop, openingsLoaded, syncBoardSize])

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
    startRef.current()
  }, [currentSide, isBoardReady, selectedOpening?.opening, selectedOpening?.variation])

  useEffect(() => {
    return () => {
      clearPendingTimers()
      clearTouchDrag()
    }
  }, [clearPendingTimers, clearTouchDrag])

  const handleSideToggle = useCallback(() => {
    dispatch(toggleSide())
  }, [dispatch])

  const handleSelectChange = useCallback(
    (value) => {
      dispatch(
        setSelectedOpening({
          side: currentSideRef.current,
          opening: value,
          variation: 0,
        }),
      )
    },
    [dispatch],
  )

  const handleVariationChange = useCallback(
    (value) => {
      dispatch(
        setSelectedOpening({
          side: currentSideRef.current,
          opening: selectedOpeningBySideRef.current[currentSideRef.current]?.opening || '',
          variation: Number(value) || 0,
        }),
      )
    },
    [dispatch],
  )

  const selectedOpeningName = selectedOpening?.opening || ''
  const selectedVariations = Array.isArray(openingGroups[selectedOpeningName])
    ? openingGroups[selectedOpeningName]
    : []
  const variationOptions = selectedVariations.map((variation, index) => ({
    value: String(index),
    label:
      typeof variation?.name === 'string' && variation.name.trim()
        ? variation.name
        : `variation ${index + 1}`,
  }))
  const showVariationSelect = selectedVariations.length > 1

  return {
    boardRef,
    boardContainerRef,
    currentSide,
    openingNames,
    selectedOpening: selectedOpeningName,
    selectedVariation: String(selectedOpening?.variation || 0),
    variationOptions,
    showVariationSelect,
    feedback,
    isShowing,
    isPaused,
    onSideToggle: handleSideToggle,
    onSelectChange: handleSelectChange,
    onVariationChange: handleVariationChange,
    onReset: reset,
    onShow: showOpening,
    onPause: togglePausePreview,
  }
}
