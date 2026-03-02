import { useMemo, useState } from 'react'
import rawColors from 'dictionary-of-colour-combinations'

const ALL_COLORS = rawColors.map((color, index) => ({ ...color, _index: index }))

function buildPalettes(colors) {
  const byPalette = new Map()
  colors.forEach((color) => {
    color.combinations.forEach((paletteId) => {
      if (!byPalette.has(paletteId)) byPalette.set(paletteId, [])
      byPalette.get(paletteId).push(color)
    })
  })
  return Array.from(byPalette.entries())
    .map(([id, colorsInPalette]) => ({ id: Number(id), colors: colorsInPalette }))
    .sort((a, b) => a.id - b.id)
}

const ALL_PALETTES = buildPalettes(ALL_COLORS)
const PALETTES_BY_ID = new Map(ALL_PALETTES.map((palette) => [palette.id, palette]))

function getReadableTextColor([r, g, b]) {
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luma > 0.5 ? '#111' : '#fff'
}

function HexButton({ hex, compact = false }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (event) => {
    event.stopPropagation()
    await navigator.clipboard.writeText(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{ ...styles.hexButton, ...(compact ? styles.hexButtonCompact : {}), ...(copied ? styles.hexButtonCopied : {}) }}
      title={`Copy ${hex}`}
    >
      {copied ? 'Copied' : hex}
    </button>
  )
}

function Home({ onOpenColor }) {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Dictionary of Colour Combinations</h1>
      <p style={styles.byline}>
        Wada Sanzo {'>>'}{' '}
        <a
          href="https://github.com/mattdesl/dictionary-of-colour-combinations"
          target="_blank"
          rel="noreferrer"
          style={styles.bylineLink}
        >
          Matt DesLauriers
        </a>
      </p>
      <p style={styles.subtitle}>
        {ALL_COLORS.length} colors across {ALL_PALETTES.length} palettes
      </p>

      <div style={styles.colorGrid}>
        {ALL_COLORS.map((color) => (
          <button
            key={`${color.name}-${color.hex}-${color._index}`}
            type="button"
            onClick={() => onOpenColor(color)}
            style={{ ...styles.colorCard, background: color.hex }}
            title={`Open palettes containing ${color.name}`}
          >
            <HexButton hex={color.hex} compact />
            <span style={{ ...styles.colorLabel, color: getReadableTextColor(color.rgb) }}>{color.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ColorDetail({ color, onBackHome, onOpenPalette }) {
  const palettes = useMemo(
    () => color.combinations.map((paletteId) => PALETTES_BY_ID.get(paletteId)).filter(Boolean),
    [color]
  )

  return (
    <div style={styles.page}>
      <button type="button" onClick={onBackHome} style={styles.backButton}>
        ← All colors
      </button>

      <div style={styles.detailHeader}>
        <div style={{ ...styles.heroSwatch, background: color.hex }}>
          <span style={{ ...styles.heroName, color: getReadableTextColor(color.rgb) }}>{color.name}</span>
          <HexButton hex={color.hex} />
        </div>
        <div style={styles.meta}>
          <p><strong>RGB:</strong> {color.rgb.join(', ')}</p>
          <p><strong>CMYK:</strong> {color.cmyk.join(', ')}</p>
          <p><strong>LAB:</strong> {color.lab.map((value) => value.toFixed(1)).join(', ')}</p>
          <p><strong>Swatch #:</strong> {color.swatch}</p>
          <p><strong>Palettes:</strong> {palettes.length}</p>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>Palettes featuring {color.name}</h2>
      <div style={styles.paletteList}>
        {palettes.map((palette) => (
          <button
            key={palette.id}
            type="button"
            onClick={() => onOpenPalette(palette)}
            style={styles.paletteCard}
            title={`Open palette #${palette.id}`}
          >
            <div style={styles.paletteCardTop}>
              <span>Palette #{palette.id}</span>
              <span>{palette.colors.length} colors</span>
            </div>
            <div style={styles.paletteSwatches}>
              {palette.colors.map((paletteColor) => (
                <span
                  key={`${palette.id}-${paletteColor.name}-${paletteColor._index}`}
                  style={{ ...styles.paletteSwatch, background: paletteColor.hex }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function PaletteDetail({ palette, color, onBackToColor }) {
  return (
    <div style={styles.page}>
      <button type="button" onClick={onBackToColor} style={styles.backButton}>
        ← {color.name}
      </button>

      <h1 style={styles.title}>Palette #{palette.id}</h1>
      <p style={styles.subtitle}>Click any hex to copy</p>

      <div style={styles.paletteDetailGrid}>
        {palette.colors.map((paletteColor) => (
          <div key={`${palette.id}-${paletteColor.name}-${paletteColor._index}`} style={styles.paletteColorTile}>
            <div style={{ ...styles.paletteDetailSwatch, background: paletteColor.hex }}>
              <span style={{ ...styles.paletteDetailName, color: getReadableTextColor(paletteColor.rgb) }}>
                {paletteColor.name}
              </span>
            </div>
            <HexButton hex={paletteColor.hex} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedPalette, setSelectedPalette] = useState(null)

  if (selectedColor && selectedPalette) {
    return (
      <PaletteDetail
        color={selectedColor}
        palette={selectedPalette}
        onBackToColor={() => setSelectedPalette(null)}
      />
    )
  }

  if (selectedColor) {
    return (
      <ColorDetail
        color={selectedColor}
        onBackHome={() => setSelectedColor(null)}
        onOpenPalette={(palette) => setSelectedPalette(palette)}
      />
    )
  }

  return <Home onOpenColor={(color) => setSelectedColor(color)} />
}

const styles = {
  page: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '28px 20px 56px',
  },
  title: {
    fontSize: 28,
    lineHeight: 1.1,
    marginBottom: 8,
    color: '#f0f0f0',
  },
  subtitle: {
    color: '#8a8a8a',
    marginBottom: 20,
  },
  byline: {
    color: '#b0b0b0',
    marginBottom: 4,
    fontSize: 14,
  },
  bylineLink: {
    color: '#d0d0d0',
    textDecoration: 'underline',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 12,
  },
  colorCard: {
    border: 'none',
    borderRadius: 0,
    minHeight: 96,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    cursor: 'pointer',
    textAlign: 'left',
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: 600,
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 0,
    padding: '2px 6px',
    maxWidth: '100%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  hexButton: {
    border: '1px solid #383838',
    borderRadius: 0,
    background: '#181818',
    color: '#d6d6d6',
    fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
    fontSize: 12,
    padding: '4px 7px',
    cursor: 'pointer',
  },
  hexButtonCompact: {
    fontSize: 10,
    padding: '2px 6px',
    background: 'rgba(0, 0, 0, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.28)',
    color: '#fff',
  },
  hexButtonCopied: {
    background: '#1f3a27',
    border: '1px solid #3f9457',
    color: '#9df3b6',
  },
  backButton: {
    border: '1px solid #2f2f2f',
    background: 'transparent',
    color: '#d6d6d6',
    borderRadius: 0,
    padding: '8px 12px',
    marginBottom: 18,
    cursor: 'pointer',
  },
  detailHeader: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  heroSwatch: {
    width: 210,
    minHeight: 210,
    borderRadius: 0,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  heroName: {
    fontSize: 18,
    fontWeight: 700,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
  },
  meta: {
    color: '#c5c5c5',
    display: 'grid',
    gap: 6,
    alignContent: 'start',
  },
  sectionTitle: {
    color: '#ececec',
    marginBottom: 12,
  },
  paletteList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  },
  paletteCard: {
    border: '1px solid #252525',
    background: '#151515',
    borderRadius: 0,
    padding: 14,
    cursor: 'pointer',
    color: '#ddd',
    textAlign: 'left',
  },
  paletteCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
    fontSize: 13,
    color: '#999',
  },
  paletteSwatches: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  paletteSwatch: {
    width: 40,
    height: 40,
    borderRadius: 0,
  },
  paletteDetailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 12,
  },
  paletteColorTile: {
    background: '#121212',
    border: '1px solid #252525',
    borderRadius: 0,
    padding: 10,
    display: 'grid',
    gap: 10,
  },
  paletteDetailSwatch: {
    minHeight: 120,
    borderRadius: 0,
    padding: 8,
    display: 'flex',
    alignItems: 'flex-end',
  },
  paletteDetailName: {
    fontSize: 12,
    fontWeight: 600,
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 0,
    padding: '2px 6px',
  },
}
