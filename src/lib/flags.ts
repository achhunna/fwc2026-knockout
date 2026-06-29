export function getFlagPath(isoCode: string): string {
  const slug = isoCode.includes('-')
    ? isoCode.split('-').pop()!.toLowerCase()
    : isoCode.toLowerCase()

  return `/img/flags/${slug}.svg`
}
