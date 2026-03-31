import { createSelector, createSlice } from '@reduxjs/toolkit'

const initialState = {
  openings: { white: {}, black: {} },
  openingsLoaded: false,
  currentSide: 'white',
  selectedOpeningBySide: {
    white: { opening: '', variation: 0 },
    black: { opening: '', variation: 0 },
  },
  feedback: { text: '', type: '' },
  isShowing: false,
  isPaused: false,
  isBoardReady: false,
  openingComplete: false,
  currentOpening: [],
  moveIndex: 0,
}

const ensureValidSelection = (state, side) => {
  const sideOpenings = state.openings[side] || {}
  const names = Object.keys(sideOpenings)
  const selected = state.selectedOpeningBySide[side] || { opening: '', variation: 0 }

  if (!names.length) {
    state.selectedOpeningBySide[side] = { opening: '', variation: 0 }
    return
  }

  const opening = names.includes(selected.opening) ? selected.opening : names[0]
  const variations = Array.isArray(sideOpenings[opening]) ? sideOpenings[opening] : []
  const maxVariation = Math.max(0, variations.length - 1)
  const variation =
    Number.isInteger(selected.variation) &&
    selected.variation >= 0 &&
    selected.variation <= maxVariation
      ? selected.variation
      : 0

  state.selectedOpeningBySide[side] = { opening, variation }
}

const trainerSlice = createSlice({
  name: 'trainer',
  initialState,
  reducers: {
    setOpenings(state, action) {
      state.openings = action.payload
      state.openingsLoaded = true
      ensureValidSelection(state, 'white')
      ensureValidSelection(state, 'black')
    },
    toggleSide(state) {
      state.currentSide = state.currentSide === 'white' ? 'black' : 'white'
      ensureValidSelection(state, state.currentSide)
    },
    setSelectedOpening(state, action) {
      const { side, opening, variation = 0 } = action.payload || {}
      if (!side) return
      const current = state.selectedOpeningBySide[side] || { opening: '', variation: 0 }

      state.selectedOpeningBySide[side] = {
        opening: typeof opening === 'string' ? opening : current.opening,
        variation: Number.isInteger(variation) ? variation : current.variation,
      }

      ensureValidSelection(state, side)
    },
    setFeedback(state, action) {
      const { text = '', type = '' } = action.payload || {}
      state.feedback = { text, type }
    },
    setShowing(state, action) {
      state.isShowing = Boolean(action.payload)
    },
    setPaused(state, action) {
      state.isPaused = Boolean(action.payload)
    },
    setBoardReady(state, action) {
      state.isBoardReady = Boolean(action.payload)
    },
    startSession(state, action) {
      const moves = Array.isArray(action.payload?.moves) ? action.payload.moves : []

      state.isShowing = false
      state.isPaused = false
      state.openingComplete = false
      state.currentOpening = moves
      state.moveIndex = 0
      state.feedback = { text: '', type: '' }
    },
    setMoveIndex(state, action) {
      state.moveIndex = Number(action.payload) || 0
    },
    setOpeningComplete(state, action) {
      state.openingComplete = Boolean(action.payload)
    },
  },
})

export const {
  setOpenings,
  toggleSide,
  setSelectedOpening,
  setFeedback,
  setShowing,
  setPaused,
  setBoardReady,
  startSession,
  setMoveIndex,
  setOpeningComplete,
} = trainerSlice.actions

export default trainerSlice.reducer

const selectTrainer = (state) => state.trainer

export const selectOpenings = (state) => selectTrainer(state).openings
export const selectOpeningsLoaded = (state) => selectTrainer(state).openingsLoaded
export const selectCurrentSide = (state) => selectTrainer(state).currentSide
export const selectSelectedOpeningBySide = (state) => selectTrainer(state).selectedOpeningBySide
export const selectFeedback = (state) => selectTrainer(state).feedback
export const selectIsShowing = (state) => selectTrainer(state).isShowing
export const selectIsPaused = (state) => selectTrainer(state).isPaused
export const selectIsBoardReady = (state) => selectTrainer(state).isBoardReady
export const selectOpeningComplete = (state) => selectTrainer(state).openingComplete
export const selectCurrentOpening = (state) => selectTrainer(state).currentOpening
export const selectMoveIndex = (state) => selectTrainer(state).moveIndex

export const selectOpeningNames = createSelector(
  [selectOpenings, selectCurrentSide],
  (openings, side) => Object.keys(openings[side] || {}),
)

export const selectOpeningGroups = createSelector(
  [selectOpenings, selectCurrentSide],
  (openings, side) => openings[side] || {},
)

export const selectSelectedOpening = createSelector(
  [selectSelectedOpeningBySide, selectCurrentSide],
  (selectedBySide, side) => selectedBySide[side] || { opening: '', variation: 0 },
)
