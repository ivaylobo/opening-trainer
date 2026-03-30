import { configureStore } from '@reduxjs/toolkit'
import trainerReducer from './trainerSlice'

export const store = configureStore({
  reducer: {
    trainer: trainerReducer,
  },
})
