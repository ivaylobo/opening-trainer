export const normalizeOpenings = (data) => {
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
