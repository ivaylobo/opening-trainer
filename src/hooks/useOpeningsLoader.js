import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setOpenings } from '../store/trainerSlice'
import { normalizeOpenings } from '../utils/openings'

export default function useOpeningsLoader() {
  const dispatch = useDispatch()

  useEffect(() => {
    let cancelled = false

    fetch('/debuts.json')
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return
        dispatch(setOpenings(normalizeOpenings(data)))
      })
      .catch((error) => console.error('Error loading debuts.json:', error))

    return () => {
      cancelled = true
    }
  }, [dispatch])
}
