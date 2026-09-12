import React, { useEffect, useRef, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCamera,
  cilCarAlt,
  cilCloudUpload,
  cilImage,
  cilReload,
  cilXCircle,
} from '@coreui/icons'

import { useCamara } from '../../hooks/useCamara'
import { useOcrPlaca, validarImagen } from '../../hooks/useOcrPlaca'
import ResultadoOcr from './ResultadoOcr'

/**
 * Vista "Monitoreo de entrada" (/parqueadero/monitoreo-entrada).
 *
 * Permite capturar una imagen con la cámara del dispositivo o seleccionar
 * una fotografía almacenada, enviarla al endpoint REST de reconocimiento
 * de placas (VITE_OCR_ENDPOINT) y mostrar el resultado: datos del
 * vehículo/propietario si está registrado en Supabase, o el aviso
 * correspondiente si no lo está o si ocurre algún otro estado.
 */
const MonitoreoEntrada = () => {
  const {
    videoRef,
    camaraActiva,
    errorCamara,
    dispositivos,
    dispositivoSeleccionado,
    activarCamara,
    detenerCamara,
    capturarFoto,
    seleccionarDispositivo,
  } = useCamara()
  const { procesando, resultado, error, detectarPlaca, limpiarResultado } = useOcrPlaca()

  const [imagen, setImagen] = useState(null) // { blob, previewUrl, origen }
  const [errorImagen, setErrorImagen] = useState('')
  const inputArchivoRef = useRef(null)

  // Libera la URL de vista previa cuando se reemplaza o al desmontar,
  // para no dejar objetos Blob colgados en memoria.
  useEffect(() => {
    return () => {
      if (imagen?.previewUrl) URL.revokeObjectURL(imagen.previewUrl)
    }
  }, [imagen])

  const reemplazarImagen = (archivo, origen) => {
    limpiarResultado()
    setErrorImagen('')
    setImagen((anterior) => {
      if (anterior?.previewUrl) URL.revokeObjectURL(anterior.previewUrl)
      return { blob: archivo, previewUrl: URL.createObjectURL(archivo), origen }
    })
  }

  const manejarCapturarFoto = async () => {
    try {
      const blob = await capturarFoto()
      reemplazarImagen(blob, 'camara')
    } catch (excepcion) {
      setErrorImagen(excepcion?.message || 'No se pudo capturar la foto.')
    }
  }

  const manejarSeleccionArchivo = (evento) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = '' // permite volver a seleccionar el mismo archivo
    if (!archivo) return

    const mensaje = validarImagen(archivo)
    if (mensaje) {
      setErrorImagen(mensaje)
      return
    }

    reemplazarImagen(archivo, 'archivo')
  }

  const manejarDetectarPlaca = () => {
    if (!imagen) return
    detectarPlaca(imagen.blob)
  }

  const manejarProcesarOtraImagen = () => {
    if (imagen?.previewUrl) URL.revokeObjectURL(imagen.previewUrl)
    setImagen(null)
    setErrorImagen('')
    limpiarResultado()
  }

  return (
    <CRow className="align-items-stretch">
      {/* Columna izquierda: captura del vehículo */}
      <CCol md={6} className="mb-4">
        <CCard className="h-100">
          <CCardHeader>
            <strong>Monitoreo de entrada</strong>
            <div className="small text-body-secondary">Captura del vehículo</div>
          </CCardHeader>
          <CCardBody>
            {errorCamara && <CAlert color="danger">{errorCamara}</CAlert>}

            <div
              className="bg-dark rounded mb-3 d-flex align-items-center justify-content-center overflow-hidden"
              style={{ aspectRatio: '16 / 9' }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-100 h-100"
                style={{ objectFit: 'cover', display: camaraActiva ? 'block' : 'none' }}
              />
              {!camaraActiva && (
                <div className="text-white-50 text-center">
                  <CIcon icon={cilCamera} size="xxl" />
                  <div className="small mt-2">Cámara desactivada</div>
                </div>
              )}
            </div>

            {dispositivos.length > 1 && (
              <CFormSelect
                className="mb-3"
                value={dispositivoSeleccionado}
                onChange={(evento) => seleccionarDispositivo(evento.target.value)}
                aria-label="Seleccionar cámara"
              >
                <option value="">Cámara por defecto (posterior en móviles)</option>
                {dispositivos.map((dispositivo) => (
                  <option key={dispositivo.deviceId} value={dispositivo.deviceId}>
                    {dispositivo.label}
                  </option>
                ))}
              </CFormSelect>
            )}

            <div className="d-flex flex-wrap gap-2 mb-3">
              {!camaraActiva ? (
                <CButton color="success" onClick={() => activarCamara()}>
                  <CIcon icon={cilCamera} className="me-1" />
                  Activar cámara
                </CButton>
              ) : (
                <CButton color="secondary" variant="outline" onClick={detenerCamara}>
                  Detener cámara
                </CButton>
              )}

              <CButton color="primary" onClick={manejarCapturarFoto} disabled={!camaraActiva}>
                <CIcon icon={cilImage} className="me-1" />
                Capturar foto
              </CButton>

              <CButton
                color="secondary"
                variant="outline"
                onClick={() => inputArchivoRef.current?.click()}
              >
                <CIcon icon={cilCloudUpload} className="me-1" />
                Subir imagen
              </CButton>
              <input
                ref={inputArchivoRef}
                type="file"
                accept="image/jpeg,image/png"
                hidden
                onChange={manejarSeleccionArchivo}
              />
            </div>

            {errorImagen && <CAlert color="danger">{errorImagen}</CAlert>}

            {imagen && (
              <div className="mb-3">
                <div className="small text-body-secondary mb-1">
                  Vista previa (
                  {imagen.origen === 'camara'
                    ? 'capturada con la cámara'
                    : 'seleccionada del dispositivo'}
                  )
                </div>
                <img
                  src={imagen.previewUrl}
                  alt="Vista previa del vehículo"
                  className="img-fluid rounded border"
                  style={{ maxHeight: '220px', objectFit: 'contain' }}
                />
              </div>
            )}

            <div className="d-flex flex-wrap gap-2">
              <CButton
                color="success"
                onClick={manejarDetectarPlaca}
                disabled={!imagen || procesando}
              >
                {procesando ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Procesando...
                  </>
                ) : (
                  'Detectar placa'
                )}
              </CButton>

              {imagen && (
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={manejarProcesarOtraImagen}
                  disabled={procesando}
                >
                  <CIcon icon={cilReload} className="me-1" />
                  Limpiar
                </CButton>
              )}
            </div>

            <div className="small text-body-secondary mt-3">
              Formatos admitidos: JPG, PNG. Tamaño máximo: 4 MiB.
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Columna derecha: resultados */}
      <CCol md={6} className="mb-4">
        <CCard className="h-100">
          <CCardHeader>
            <strong>Resultado del reconocimiento</strong>
          </CCardHeader>
          <CCardBody>
            {!resultado && !error && !procesando && (
              <div className="text-center text-body-secondary py-5">
                <CIcon icon={cilCarAlt} size="xxl" className="mb-2" />
                <p className="mb-0">
                  Capture o seleccione una imagen y presione &quot;Detectar placa&quot; para ver el
                  resultado.
                </p>
              </div>
            )}

            {procesando && (
              <div className="text-center py-5">
                <CSpinner color="success" />
                <p className="mt-3">Analizando la imagen...</p>
              </div>
            )}

            {error && !procesando && (
              <CAlert color="danger">
                <div className="fw-semibold mb-1 d-flex align-items-center gap-2">
                  <CIcon icon={cilXCircle} />
                  No se pudo completar el reconocimiento
                </div>
                <div>{error.mensaje}</div>
                {imagen && (
                  <CButton
                    color="danger"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={manejarDetectarPlaca}
                  >
                    <CIcon icon={cilReload} className="me-1" />
                    Reintentar
                  </CButton>
                )}
              </CAlert>
            )}

            {resultado && !procesando && (
              <ResultadoOcr resultado={resultado} onProcesarOtra={manejarProcesarOtraImagen} />
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default MonitoreoEntrada
