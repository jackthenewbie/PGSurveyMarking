import { useEffect, useRef, useState } from "react"

export const DEFAULT_MODE = "screenshot"
export const DEFAULT_SURFACE_SIZE = { width: 0, height: 0 }

export function useLinkedMapSource({ resetAnnotationState }) {
  const blobRef = useRef(null)
  const streamRef = useRef(null)
  const sourceRequestIdRef = useRef(0)
  const [mode, setMode] = useState(DEFAULT_MODE)
  const [mediaSource, setMediaSource] = useState(null)
  const [surfaceSize, setSurfaceSize] = useState(DEFAULT_SURFACE_SIZE)

  useEffect(() => {
    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current)
        blobRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.onended = null
          track.stop()
        })
        streamRef.current = null
      }
    }
  }, [])

  function disposeCurrentMedia() {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current)
      blobRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.onended = null
        track.stop()
      })
      streamRef.current = null
    }
  }

  function nextSourceRequestId() {
    sourceRequestIdRef.current += 1
    return sourceRequestIdRef.current
  }

  function clearSource() {
    nextSourceRequestId()
    disposeCurrentMedia()
    setMediaSource(null)
    setSurfaceSize(DEFAULT_SURFACE_SIZE)
    resetAnnotationState()
  }

  function updateSurfaceSize(width, height) {
    if (!width || !height) return
    setSurfaceSize((current) =>
      current.width === width && current.height === height ? current : { width, height }
    )
  }

  function changeMode(nextMode) {
    if (nextMode === mode) return
    clearSource()
    setMode(nextMode)
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return

    const requestId = nextSourceRequestId()
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      if (sourceRequestIdRef.current !== requestId) {
        URL.revokeObjectURL(url)
        return
      }

      disposeCurrentMedia()
      blobRef.current = url
      setMode("screenshot")
      setMediaSource({ kind: "image", src: url })
      setSurfaceSize({ width: image.naturalWidth, height: image.naturalHeight })
      resetAnnotationState()
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
    }
    image.src = url
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (file) loadFile(file)
    event.target.value = ""
  }

  async function startScreenShare() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Screen capture is not supported in this browser.")
    }

    const requestId = nextSourceRequestId()
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    })

    if (sourceRequestIdRef.current !== requestId) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    const [videoTrack] = stream.getVideoTracks()

    if (!videoTrack) {
      stream.getTracks().forEach((track) => track.stop())
      throw new Error("The selected share source did not provide a video track.")
    }

    disposeCurrentMedia()
    streamRef.current = stream
    videoTrack.onended = () => {
      if (streamRef.current !== stream) return
      clearSource()
    }

    const settings = videoTrack.getSettings()
    setMode("stream")
    setMediaSource({ kind: "stream", stream })
    setSurfaceSize({
      width: Number(settings.width) || 0,
      height: Number(settings.height) || 0,
    })
    resetAnnotationState()
  }

  return {
    changeMode,
    clearSource,
    handleFileChange,
    hasSource: mediaSource != null,
    mediaSource,
    mode,
    startScreenShare,
    surfaceSize,
    updateSurfaceSize,
  }
}
