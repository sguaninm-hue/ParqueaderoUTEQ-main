import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook para controlar la cámara del dispositivo mediante
 * `navigator.mediaDevices.getUserMedia()`.
 *
 * - Usa la cámara posterior (`facingMode: 'environment'`) cuando está
 *   disponible, típico en dispositivos móviles.
 * - Permite listar y elegir entre varias cámaras conectadas al mismo
 *   dispositivo (por ejemplo, la webcam integrada de una laptop y un
 *   teléfono vinculado como webcam mediante apps como DroidCam, Iriun
 *   o Camo).
 * - Libera automáticamente la cámara al desmontar el componente (por
 *   ejemplo, al cambiar de vista), y también expone `detenerCamara`
 *   para liberarla manualmente.
 */
export const useCamara = () => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [camaraActiva, setCamaraActiva] = useState(false)
  const [errorCamara, setErrorCamara] = useState('')
  const [dispositivos, setDispositivos] = useState([]) // [{ deviceId, label }]
  const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState('')

  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCamaraActiva(false)
  }, [])

  /**
   * Enumera las cámaras disponibles. Los `label` solo vienen completos
   * después de haber concedido permiso de cámara al menos una vez, por
   * eso se vuelve a llamar tras activar la cámara.
   */
  const listarDispositivos = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return

    try {
      const lista = await navigator.mediaDevices.enumerateDevices()
      const camaras = lista
        .filter((dispositivo) => dispositivo.kind === 'videoinput')
        .map((dispositivo, indice) => ({
          deviceId: dispositivo.deviceId,
          label: dispositivo.label || `Cámara ${indice + 1}`,
        }))
      setDispositivos(camaras)
    } catch {
      // Si falla la enumeración simplemente no se muestra el selector;
      // la cámara por defecto (facingMode) sigue funcionando igual.
    }
  }, [])

  const activarCamara = useCallback(
    async (deviceId) => {
      setErrorCamara('')

      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorCamara('Este dispositivo o navegador no admite acceso a la cámara.')
        return
      }

      // Si se detiene una cámara previa antes de activar la nueva.
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      const restriccionesVideo = deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: { ideal: 'environment' } }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: restriccionesVideo,
          audio: false,
        })

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setCamaraActiva(true)

        const pistaActiva = stream.getVideoTracks()[0]
        if (pistaActiva) {
          setDispositivoSeleccionado(pistaActiva.getSettings().deviceId || deviceId || '')
        }

        // Ahora que hay permiso concedido, los labels ya vienen completos.
        listarDispositivos()
      } catch (excepcion) {
        setErrorCamara(
          excepcion?.name === 'NotAllowedError'
            ? 'Se denegó el permiso de acceso a la cámara. Habilítelo en la configuración del navegador.'
            : 'No se pudo acceder a la cámara del dispositivo.',
        )
        setCamaraActiva(false)
      }
    },
    [listarDispositivos],
  )

  /**
   * Cambia a otra cámara ya listada en `dispositivos` (por ejemplo, al
   * elegir una opción del selector). Si la cámara ya está activa, la
   * reinicia con el nuevo dispositivo.
   */
  const seleccionarDispositivo = useCallback(
    (deviceId) => {
      setDispositivoSeleccionado(deviceId)
      if (camaraActiva) {
        activarCamara(deviceId)
      }
    },
    [camaraActiva, activarCamara],
  )

  /**
   * Captura el fotograma actual del video y lo devuelve como Blob JPEG,
   * junto con una URL de vista previa (`URL.createObjectURL`).
   */
  const capturarFoto = useCallback(() => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current
      if (!video || !camaraActiva) {
        reject(new Error('La cámara no está activa.'))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const contexto = canvas.getContext('2d')
      contexto.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo generar la imagen capturada.'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        0.92,
      )
    })
  }, [camaraActiva])

  // Lista las cámaras disponibles apenas el navegador lo permita (los
  // labels pueden venir vacíos hasta que se conceda permiso).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    listarDispositivos()
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', listarDispositivos)
      return () => navigator.mediaDevices.removeEventListener('devicechange', listarDispositivos)
    }
  }, [listarDispositivos])

  // Libera la cámara automáticamente cuando el componente se desmonta
  // (por ejemplo, al navegar a otra vista del panel).
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return {
    videoRef,
    camaraActiva,
    errorCamara,
    dispositivos,
    dispositivoSeleccionado,
    activarCamara,
    detenerCamara,
    capturarFoto,
    seleccionarDispositivo,
  }
}

export default useCamara
