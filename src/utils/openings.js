const normalizeVariationMoves = (value) => {
  if (!Array.isArray(value)) return []
  return value.filter((move) => typeof move === 'string')
}

const normalizeVariationObject = (value, index = 0) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const rawName = typeof value.name === 'string' && value.name.trim() ? value.name.trim() : ''
  const movesSource = Array.isArray(value.moves)
    ? value.moves
    : Array.isArray(value.variation)
      ? value.variation
      : []
  const moves = normalizeVariationMoves(movesSource)

  return {
    name: rawName || (index === 0 ? 'main' : `variation ${index + 1}`),
    moves,
  }
}

const normalizeVariations = (value) => {
  if (!Array.isArray(value)) return []

  const isSingleVariation = value.every((move) => typeof move === 'string')
  if (isSingleVariation) {
    return [
      {
        name: 'main',
        moves: normalizeVariationMoves(value),
      },
    ]
  }

  return value.reduce((acc, variation, index) => {
    if (Array.isArray(variation)) {
      acc.push({
        name: index === 0 ? 'main' : `variation ${index + 1}`,
        moves: normalizeVariationMoves(variation),
      })
      return acc
    }

    const normalizedObject = normalizeVariationObject(variation, index)
    if (normalizedObject) {
      acc.push(normalizedObject)
    }

    return acc
  }, [])
}

const normalizeSide = (sideData) => {
  if (!sideData || typeof sideData !== 'object' || Array.isArray(sideData)) return {}

  return Object.entries(sideData).reduce((acc, [name, value]) => {
    acc[name] = normalizeVariations(value)
    return acc
  }, {})
}

export const normalizeOpenings = (data) => {
  const hasSideBuckets =
    data && typeof data === 'object' && !Array.isArray(data) && ('white' in data || 'black' in data)

  if (hasSideBuckets) {
    return {
      white: normalizeSide(data.white),
      black: normalizeSide(data.black),
    }
  }

  return {
    white: normalizeSide(data),
    black: {},
  }
}
