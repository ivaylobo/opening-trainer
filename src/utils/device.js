export const isTouchLikeDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const coarsePointer =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches

  return coarsePointer || navigator.maxTouchPoints > 0 || 'ontouchstart' in window
}
