import { useCallback, useState } from 'react'

// Límites y formatos permitidos, alineados con la validación que aplica
// el endpoint (400/413/415).
export const TAMANIO_MAXIMO_BYTES = 4 * 1024 * 1024 // 4 MiB
export const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png']

const MENSAJES_HTTP = {
  400: 'La imagen enviada está vacía, es inválida o tiene dimensiones no permitidas.',
  413: 'La imagen supera el tamaño máximo permitido (4 MiB).',
  415: 'El formato de la imagen no es compatible. Use JPG o PNG.',
  502: 'El servicio de reconocimiento (OCR) o la base de datos no están disponibles en este momento.',
  504: 'El servicio de reconocimiento tardó demasiado en responder. Intente nuevamente.',
}

/**
 * Valida el tamaño y formato de una imagen antes de enviarla al endpoint.
 * Devuelve un mensaje de error (string) o null si la imagen es válida.
 */
export const validarImagen = (archivo) => {
  if (!archivo) return 'Debe capturar o seleccionar una imagen.'

  const tipo = archivo.type || ''
  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    return 'Formato no admitido. Solo se permiten imágenes JPG o PNG.'
  }

  if (archivo.size > TAMANIO_MAXIMO_BYTES) {
    return 'La imagen supera el tamaño máximo permitido (4 MiB).'
  }

  if (archivo.size === 0) {
    return 'La imagen está vacía.'
  }

  return null
}

/**
 * Hook para consumir el endpoint REST de reconocimiento de placas.
 *
 * El endpoint se configura mediante la variable de entorno
 * `VITE_OCR_ENDPOINT` (nunca se escribe la URL directamente en el
 * componente). Envía la imagen como cuerpo binario (Blob/File), no como
 * JSON en Base64.
 */
export const useOcrPlaca = () => {
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  const limpiarResultado = useCallback(() => {
    setResultado(null)
    setError(null)
  }, [])

  const detectarPlaca = useCallback(async (archivo) => {
    const mensajeValidacion = validarImagen(archivo)
    if (mensajeValidacion) {
      setError({ mensaje: mensajeValidacion })
      return { exito: false }
    }

    const endpoint = import.meta.env.VITE_OCR_ENDPOINT

    if (!endpoint) {
      setError({
        mensaje:
          'No se configuró VITE_OCR_ENDPOINT. Defina la variable de entorno con la URL del servicio de reconocimiento.',
      })
      return { exito: false }
    }

    setProcesando(true)
    setError(null)
    setResultado(null)

    try {
      const respuesta = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': archivo.type || 'application/octet-stream',
        },
        body: archivo,
      })

      if (!respuesta.ok) {
        const mensaje =
          MENSAJES_HTTP[respuesta.status] ||
          `El servicio respondió con un error (código ${respuesta.status}).`
        setError({ codigo: respuesta.status, mensaje })
        setProcesando(false)
        return { exito: false }
      }

      const datos = await respuesta.json()
      setResultado(datos)
      setProcesando(false)
      return { exito: true, datos }
    } catch (excepcion) {
      setError({
        mensaje:
          'No se pudo contactar al servicio de reconocimiento. Verifique su conexión e intente nuevamente.',
        detalle: excepcion?.message,
      })
      setProcesando(false)
      return { exito: false }
    }
  }, [])

  return {
    procesando,
    resultado,
    error,
    detectarPlaca,
    limpiarResultado,
  }
}

export default useOcrPlaca
