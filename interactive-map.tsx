"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { ZoomIn, ZoomOut, LocateFixed } from "lucide-react"

interface PathElement {
  id: string
  d: string
  fill?: string
  stroke?: string
  strokeWidth?: string
  className?: string
  [key: string]: any
}

// Data for US military bases in Okinawa
const BASE_INFO_DATA: { [key: string]: { name: string; area: number } } = {
  "base-makiminato": { name: "Makiminato Service Area", area: 2.74 },
  "base-kadena": { name: "Kadena Air Base", area: 45.5 },
  "base-kadena-air-base": { name: "Kadena Air Base", area: 45.5 },
  "base-futenma": { name: "Futenma Air Station", area: 4.9 },
  "base-hansen": { name: "Camp Hansen", area: 51.0 },
  "base-schwab": { name: "Camp Schwab (Henoko)", area: 21.6 },
  "base-kinser": { name: "Camp Kinser", area: 2.74 },
  "base-foster": { name: "Camp Foster", area: 6.4 },
  "base-torii": { name: "Torii Station", area: 1.9 },
  "base-courtney": { name: "Camp Courtney", area: 1.35 },
  "base-mctureous": { name: "Camp McTureous", area: 2.31 },
  "base-lester": { name: "Camp Lester", area: 0.56 },
  "base-shields": { name: "Camp Shields", area: 2.43 },
  "base-gonsalves": { name: "Northern Training Area", area: 78.65 },
  "base-white-beach": { name: "White Beach Naval Facility", area: 1.57 },
  "base-awase": { name: "Awase Communications Site", area: 0.6 },
  "base-okuma": { name: "Okuma Rest Center", area: 0.65 },
  "base-butler": { name: "MCB Camp Butler", area: 162 },
  "base-northern": { name: "Northern Training Area", area: 78.65 },
  "base-tsukejima": { name: "Northern Training Area", area: 78.65 },
  "base-north-ta": { name: "Northern Training Area", area: 78.65 },
  "base-henoko": { name: "Henoko", area: 21.6 },
  "base-north-training-area": { name: "Northern Training Area", area: 78.65 },
}

// Info Box Component
const BaseInfoBox = ({ baseId }: { baseId: string | null }) => {
  if (!baseId || !baseId.startsWith("base-")) {
    return null
  }

  const getBaseName = (id: string) => {
    const name = id.replace("base-", "").replace(/-/g, " ")
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const baseData = BASE_INFO_DATA[baseId.toLowerCase()]
  const name = baseData ? baseData.name : getBaseName(baseId)
  const area = baseData ? baseData.area : null

  const isHenoko = baseId.toLowerCase().includes("henoko") || name.toLowerCase().includes("henoko")
  const isNorthernTrainingArea =
    baseId.toLowerCase().includes("north") ||
    baseId.toLowerCase().includes("gonsalves") ||
    name.toLowerCase().includes("northern training") ||
    name.toLowerCase().includes("north training")
  const isKadena = baseId.toLowerCase().includes("kadena")

  const displayArea = area || (isHenoko ? 21.6 : isNorthernTrainingArea ? 78.65 : isKadena ? 45.5 : null)

  return (
    <div className="absolute top-4 right-4 z-10 bg-gray-800 bg-opacity-90 backdrop-blur-sm text-white p-6 rounded-lg shadow-lg w-80 border border-gray-600">
      <h3 className="text-xl font-bold text-yellow-400 mb-2">{name}</h3>
      <div className="w-full h-0.5 bg-yellow-400 mb-4"></div>
      {displayArea !== null ? (
        <div className="text-lg text-gray-300">
          <span className="font-normal">Area: </span>
          <span className="font-mono text-white">{displayArea.toLocaleString()} km²</span>
        </div>
      ) : (
        <div className="text-gray-400 italic text-lg mb-4">Area data not available</div>
      )}
      {(isHenoko || isNorthernTrainingArea || isKadena) && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Similar areas in Tokyo:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            {isHenoko && (
              <>
                <li>
                  Kita Ward (北区) – <span className="font-mono text-white">20.6 km²</span>
                </li>
                <li>
                  Minato Ward (港区) – <span className="font-mono text-white">20.4 km²</span>
                </li>
              </>
            )}
            {isNorthernTrainingArea && (
              <>
                <li>
                  Ota (大田区) – <span className="font-mono text-white">59.5 km²</span>
                </li>
                <li>
                  Setagaya (世田谷区) – <span className="font-mono text-white">58.1 km²</span>
                </li>
                <li>
                  Nerima (練馬区) – <span className="font-mono text-white">48.1 km²</span>
                </li>
                <li>
                  Adachi (足立区) – <span className="font-mono text-white">53.2 km²</span>
                </li>
                <li>
                  Edogawa (江戸川区) – <span className="font-mono text-white">49.1 km²</span>
                </li>
              </>
            )}
            {isKadena && (
              <>
                <li>
                  江戸川区 (Edogawa) – <span className="font-mono text-white">49.1 km²</span>
                </li>
                <li>
                  足立区 (Adachi) – <span className="font-mono text-white">53.2 km²</span>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function InteractiveMap() {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)
  const [paths, setPaths] = useState<PathElement[]>([])
  const [loading, setLoading] = useState(true)
  const [viewBox, setViewBox] = useState("0 0 800 600")
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefs = useRef<{ [key: string]: SVGPathElement | null }>({})
  const [draggablePaths, setDraggablePaths] = useState<{ [key: string]: { x: number; y: number } }>({})
  const initialDraggablePaths = useRef<{ [key: string]: { x: number; y: number } }>({})
  const [activeBaseId, setActiveBaseId] = useState<string | null>(null)

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1.6 })
  const initialTransformRef = useRef<{ x: number; y: number; scale: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })

  const dragInfo = useRef<{
    pathId: string | null
    isDragging: boolean
    startPointerPos: { x: number; y: number }
    initialPathPos: { x: number; y: number }
    finalPathPos?: { x: number; y: number }
  }>({
    pathId: null,
    isDragging: false,
    startPointerPos: { x: 0, y: 0 },
    initialPathPos: { x: 0, y: 0 },
  })

  const hiddenPathId = "base-makiminato"
  const nonInteractiveMapIds = ["okinawa-main-island", "Tokyo-Outline", "Okinawa-Outline"]
  const tokyoWardNames = [
    "shibuya",
    "shinjuku",
    "minato",
    "chiyoda",
    "chuo",
    "taito",
    "sumida",
    "koto",
    "shinagawa",
    "meguro",
    "ota",
    "setagaya",
    "nakano",
    "suginami",
    "toshima",
    "kita",
    "arakawa",
    "itabashi",
    "nerima",
    "adachi",
    "katsushika",
    "edogawa",
    "bunkyo",
  ]
  const tokyoStaticOffset = { x: -350, y: 150 }

  const isDraggablePath = (pathId: string) => pathId.startsWith("base-")
  const isTokyoPath = (pathId: string) =>
    pathId.startsWith("Tokyo") || tokyoWardNames.some((ward) => pathId.toLowerCase().includes(ward))

  const updatePathTransform = useCallback((pathId: string, x: number, y: number) => {
    const pathElement = pathRefs.current[pathId]
    if (pathElement) {
      pathElement.style.transform = `translate(${x}px, ${y}px)`
    }
  }, [])

  const startDrag = useCallback(
    (e: React.PointerEvent, pathId: string) => {
      if (!isDraggablePath(pathId)) return
      e.stopPropagation()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      dragInfo.current = {
        pathId,
        isDragging: true,
        startPointerPos: { x: e.clientX, y: e.clientY },
        initialPathPos: draggablePaths[pathId] || { x: 0, y: 0 },
      }
      setActiveBaseId(pathId)
      const pathElement = pathRefs.current[pathId]
      if (pathElement) pathElement.classList.add("dragging")
    },
    [draggablePaths],
  )

  const dragPath = useCallback(
    (e: React.PointerEvent) => {
      if (!dragInfo.current.isDragging || !dragInfo.current.pathId) return
      e.preventDefault()

      const dx = e.clientX - dragInfo.current.startPointerPos.x
      const dy = e.clientY - dragInfo.current.startPointerPos.y

      const svg_dx = dx / transform.scale
      const svg_dy = dy / transform.scale

      const newX = dragInfo.current.initialPathPos.x + svg_dx
      const newY = dragInfo.current.initialPathPos.y + svg_dy

      dragInfo.current.finalPathPos = { x: newX, y: newY }
      updatePathTransform(dragInfo.current.pathId, newX, newY)
    },
    [transform.scale, updatePathTransform],
  )

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!dragInfo.current.isDragging || !dragInfo.current.pathId) return
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

      const pathId = dragInfo.current.pathId
      if (dragInfo.current.finalPathPos) {
        setDraggablePaths((prev) => ({
          ...prev,
          [pathId]: dragInfo.current.finalPathPos!,
        }))
      }

      const pathElement = pathRefs.current[pathId]
      if (pathElement) pathElement.classList.remove("dragging")

      dragInfo.current = {
        pathId: null,
        isDragging: false,
        startPointerPos: { x: 0, y: 0 },
        initialPathPos: { x: 0, y: 0 },
      }
      if (!hoveredElement) setActiveBaseId(null)
    },
    [hoveredElement],
  )

  const resetView = useCallback(() => {
    setDraggablePaths(initialDraggablePaths.current)
    if (initialTransformRef.current) {
      setTransform(initialTransformRef.current)
    }
    setActiveBaseId(null)
    setHoveredElement(null)
  }, [])

  const zoomToTokyo = useCallback(() => {
    const tokyoOutlinePath = pathRefs.current["Tokyo-Outline"]
    if (!tokyoOutlinePath || !svgRef.current) return

    const pathBBox = tokyoOutlinePath.getBBox()
    const svgContainerRect = svgRef.current.getBoundingClientRect()

    const targetSvgX = tokyoStaticOffset.x + pathBBox.x + pathBBox.width / 2
    const targetSvgY = tokyoStaticOffset.y + pathBBox.y + pathBBox.height / 2

    const scaleX = svgContainerRect.width / pathBBox.width
    const scaleY = svgContainerRect.height / pathBBox.height
    const targetScale = Math.min(scaleX, scaleY) * 0.8 // 80% zoom to have some padding

    const newTx = svgContainerRect.width / 2 - targetSvgX * targetScale
    const newTy = svgContainerRect.height / 2 - targetSvgY * targetScale

    setTransform({
      scale: targetScale,
      x: newTx,
      y: newTy,
    })
  }, [])

  useEffect(() => {
    const loadAndParseSVG = async () => {
      try {
        const response = await fetch("/maps.svg")
        const svgText = await response.text()
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml")
        const svgElement = svgDoc.querySelector("svg")
        setViewBox(svgElement?.getAttribute("viewBox") || "0 0 800 600")

        const allPaths: PathElement[] = Array.from(svgDoc.querySelectorAll("path")).map((path, index) => {
          const pathData: PathElement = {
            id: path.id || `path-${index}`,
            d: path.getAttribute("d") || "",
          }
          Array.from(path.attributes).forEach((attr) => {
            if (!["id", "d"].includes(attr.name)) {
              const key = attr.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
              pathData[key] = attr.value
            }
          })
          return pathData
        })

        setPaths(allPaths)

        const initialDraggable: { [key: string]: { x: number; y: number } } = {}
        allPaths.forEach((path) => {
          if (isDraggablePath(path.id)) initialDraggable[path.id] = { x: 0, y: 0 }
        })
        initialDraggablePaths.current = initialDraggable
        setDraggablePaths(initialDraggable)
      } catch (error) {
        console.error("Error loading SVG:", error)
      } finally {
        setLoading(false)
      }
    }
    loadAndParseSVG()
  }, [])

  useEffect(() => {
    if (svgRef.current && !initialTransformRef.current && !loading) {
      const rect = svgRef.current.getBoundingClientRect()
      const initialScale = 1.6
      const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number)
      const initialX = (rect.width - vbWidth * initialScale) / 2
      const initialY = (rect.height - vbHeight * initialScale) / 2
      const transform = { x: initialX, y: initialY, scale: initialScale }
      setTransform(transform)
      initialTransformRef.current = transform
    }
  }, [loading, viewBox])

  useEffect(() => {
    Object.entries(draggablePaths).forEach(([pathId, pos]) => {
      updatePathTransform(pathId, pos.x, pos.y)
    })
  }, [draggablePaths, updatePathTransform])

  const handleElementHover = (elementId: string) => {
    if (nonInteractiveMapIds.includes(elementId) || elementId === hiddenPathId) return
    setHoveredElement(elementId)
    if (!dragInfo.current.isDragging && isDraggablePath(elementId)) {
      setActiveBaseId(elementId)
    }
  }

  const handleElementLeave = () => {
    setHoveredElement(null)
    if (!dragInfo.current.isDragging) setActiveBaseId(null)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (!svgRef.current) return
    e.preventDefault()
    const { deltaY, clientX, clientY } = e
    const zoomFactor = 0.05
    const minScale = 0.5
    const maxScale = 8

    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = clientX - rect.left
    const mouseY = clientY - rect.top

    setTransform((prev) => {
      const newScale = Math.max(minScale, Math.min(maxScale, prev.scale * (1 - deltaY * zoomFactor)))
      const svgMouseX = (mouseX - prev.x) / prev.scale
      const svgMouseY = (mouseY - prev.y) / prev.scale
      const newX = mouseX - svgMouseX * newScale
      const newY = mouseY - svgMouseY * newScale
      return { scale: newScale, x: newX, y: newY }
    })
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (dragInfo.current.isDragging) return
    panStart.current = { x: e.clientX, y: e.clientY }
    setIsPanning(true)
  }

  const panMap = (e: React.PointerEvent) => {
    if (!isPanning) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
    panStart.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragInfo.current.isDragging) {
      dragPath(e)
    } else if (isPanning) {
      panMap(e)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragInfo.current.isDragging) {
      endDrag(e)
    }
    setIsPanning(false)
  }

  const zoomWithButtons = (factor: number) => {
    if (!svgRef.current) return
    const minScale = 0.5
    const maxScale = 8
    const rect = svgRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    setTransform((prev) => {
      const newScale = Math.max(minScale, Math.min(maxScale, prev.scale * factor))
      const svgMouseX = (centerX - prev.x) / prev.scale
      const svgMouseY = (centerY - prev.y) / prev.scale
      const newX = centerX - svgMouseX * newScale
      const newY = centerY - svgMouseY * newScale
      return { scale: newScale, x: newX, y: newY }
    })
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center text-white text-xl">Loading Map...</div>
    )
  }

  const otherPaths = paths.filter((p) => !isTokyoPath(p.id))
  const tokyoPaths = paths.filter((p) => isTokyoPath(p.id))

  const gStyle = {
    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
    transition: isPanning || dragInfo.current.isDragging ? "none" : "transform 0.75s ease",
  }

  return (
    <div className="h-screen bg-gray-900 relative overflow-hidden cursor-grab" onPointerUp={handlePointerUp}>
      <div className="absolute top-4 right-4 z-30 max-w-sm space-y-4">
        <h1 className="font-bold leading-tight text-white pl-0 text-3xl leading-7 pr-0 mt-[399px]">
          {"沖縄の米軍基地と東京23区の面積を比べてみよう"}
        </h1>
        <div className="bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white p-4 rounded-lg space-y-2 border border-gray-600 pt-5 mt-56 text-xs">
          <p>沖縄面積：2,281 km²（日本の0.6 %）</p>
          <p>米軍基地の約70 %が沖縄に集中</p>
          <p>沖縄の約10 %（約2.28億 m²）が基地用地</p>
          <p>沖縄以外の日本では米軍基地は約0.02 %（約75 km²）</p>
          <hr className="border-gray-500 my-2" />
          <p>Okinawa Area: 2,281 km² (0.6 % of Japan)</p>
          <p>~70 % of U.S. bases located in Okinawa</p>
          <p>~10 % of Okinawa land (≈228 million m²) is U.S. base land</p>
          <p>Rest of Japan: only ~0.02 % (≈75 km²) occupied by U.S. bases</p>
        </div>
      </div>
      <BaseInfoBox baseId={activeBaseId} />

      <div className="absolute bottom-4 left-4 z-20 flex flex-col items-start space-y-2">
        <div className="flex flex-col bg-gray-800/70 rounded-md border border-gray-600">
          <button
            onClick={() => zoomWithButtons(1.2)}
            className="p-2 text-white hover:bg-gray-700/70 rounded-t-md transition-colors"
            aria-label="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <div className="w-full h-px bg-gray-600"></div>
          <button
            onClick={() => zoomWithButtons(1 / 1.2)}
            className="p-2 text-white hover:bg-gray-700/70 rounded-b-md transition-colors"
            aria-label="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
        </div>
        <button
          onClick={zoomToTokyo}
          className="px-4 py-2 text-white rounded-md shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 bg-orange-500"
        >
          <LocateFixed size={18} />
          <span>Zoom in Tokyo</span>
        </button>
        <button
          onClick={resetView}
          className="px-4 py-2 text-white rounded-md shadow-lg hover:bg-blue-700 transition-colors bg-black"
        >
          Reset View
        </button>
      </div>

      <div className="w-full h-full">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={viewBox}
          className="w-full h-full"
          style={{ background: "#1f2937", touchAction: "none" }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerUp}
        >
          <g style={gStyle}>
            <style>{`.dragging { opacity: 0.8; filter: drop-shadow(0 0 10px rgba(255, 255, 0, 0.7)); }`}</style>

            <g id="ghost-marks">
              {otherPaths
                .filter((p) => isDraggablePath(p.id) && p.id !== hiddenPathId)
                .map((path) => (
                  <path
                    key={`ghost-${path.id}`}
                    d={path.d}
                    fill={path.fill ? `${path.fill}40` : "#4b556340"}
                    stroke={path.stroke ? `${path.stroke}40` : "#6b728040"}
                    strokeWidth={path.strokeWidth || "1"}
                    className="pointer-events-none opacity-40"
                  />
                ))}
            </g>

            <g id="okinawa-and-bases">
              {otherPaths.map((path) => {
                if (path.id === hiddenPathId) return null
                const isDraggable = isDraggablePath(path.id)
                const isOutline = path.id.includes("Outline")

                return (
                  <path
                    key={path.id}
                    ref={(el) => {
                      pathRefs.current[path.id] = el
                    }}
                    id={path.id}
                    d={path.d}
                    fill={isOutline ? "none" : path.fill || "#4b5563"}
                    stroke={isOutline ? "white" : path.stroke || "#6b7280"}
                    strokeWidth={path.strokeWidth || "1"}
                    strokeOpacity={isOutline ? "1" : undefined}
                    className={`transition-colors duration-200 ${isDraggable ? `cursor-move ${hoveredElement === path.id ? "fill-yellow-500 stroke-yellow-300" : ""}` : "pointer-events-none"}`}
                    style={{ willChange: "transform" }}
                    onMouseEnter={() => handleElementHover(path.id)}
                    onMouseLeave={handleElementLeave}
                    onPointerDown={(e) => isDraggable && startDrag(e, path.id)}
                  />
                )
              })}
            </g>

            <g id="tokyo-map" style={{ transform: `translate(${tokyoStaticOffset.x}px, ${tokyoStaticOffset.y}px)` }}>
              {tokyoPaths.map((path) => {
                const isOutline = path.id.includes("Outline")
                const isWard = !isOutline

                return (
                  <path
                    key={path.id}
                    ref={(el) => {
                      if (el) pathRefs.current[path.id] = el
                    }}
                    id={path.id}
                    d={path.d}
                    fill={isOutline ? "none" : path.fill || "#ffffff"}
                    fillOpacity={isOutline ? undefined : 0.8}
                    stroke={isOutline ? "white" : "none"}
                    strokeOpacity={isOutline ? "1" : undefined}
                    strokeWidth={path.strokeWidth || "1"}
                    className={`transition-colors duration-200 
        ${isWard ? "cursor-pointer" : "pointer-events-none"}
        ${hoveredElement === path.id && isWard ? "fill-yellow-400" : ""}`}
                    onMouseEnter={() => isWard && handleElementHover(path.id)}
                    onMouseLeave={() => isWard && handleElementLeave()}
                  />
                )
              })}
            </g>
          </g>
        </svg>
      </div>
      <div className="absolute bottom-8 left-[20%] -translate-x-1/2 text-white text-lg font-bold text-center pointer-events-none">
        沖縄本島
      </div>
      <div className="absolute bottom-8 left-[55%] -translate-x-1/2 text-white text-lg font-bold text-center pointer-events-none">
        東京23区
      </div>
    </div>
  )
}
