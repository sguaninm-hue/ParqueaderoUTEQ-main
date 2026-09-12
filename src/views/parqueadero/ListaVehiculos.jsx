import React, { useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CToast,
  CToastBody,
  CToastClose,
  CToaster,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilPlus, cilTrash } from '@coreui/icons'

import { useVehiculos } from '../../hooks/useVehiculos'
import VehiculoFormModal from './VehiculoFormModal'
import ConfirmarEliminarModal from './ConfirmarEliminarModal'

const VEHICULOS_POR_PAGINA = 10

const ListaVehiculos = () => {
  const {
    vehiculos,
    cargando,
    error,
    guardando,
    eliminandoId,
    recargar,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
  } = useVehiculos()

  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [busquedaAnterior, setBusquedaAnterior] = useState('')

  // Reinicia la paginación cuando cambia el texto de búsqueda. Se ajusta
  // durante el renderizado (patrón recomendado por React) en lugar de un
  // useEffect, para evitar una renderización en cascada innecesaria.
  if (busqueda !== busquedaAnterior) {
    setBusquedaAnterior(busqueda)
    setPagina(1)
  }

  const [modalFormularioVisible, setModalFormularioVisible] = useState(false)
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null)

  const [modalEliminarVisible, setModalEliminarVisible] = useState(false)
  const [vehiculoAEliminar, setVehiculoAEliminar] = useState(null)
  const [errorEliminar, setErrorEliminar] = useState('')

  const [toast, setToast] = useState(0)

  const mostrarToast = (color, mensaje) => {
    setToast(
      <CToast autohide delay={4000} visible color={color} className="text-white align-items-center">
        <div className="d-flex">
          <CToastBody>{mensaje}</CToastBody>
          <CToastClose className="me-2 m-auto" white />
        </div>
      </CToast>,
    )
  }

  const vehiculosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return vehiculos

    return vehiculos.filter((vehiculo) =>
      [
        vehiculo.placa,
        vehiculo.marca,
        vehiculo.modelo,
        vehiculo.color,
        vehiculo.propietario_nombre,
        vehiculo.correo_institucional,
      ].some((valor) => valor?.toLowerCase().includes(texto)),
    )
  }, [vehiculos, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(vehiculosFiltrados.length / VEHICULOS_POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)

  const vehiculosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * VEHICULOS_POR_PAGINA
    return vehiculosFiltrados.slice(inicio, inicio + VEHICULOS_POR_PAGINA)
  }, [vehiculosFiltrados, paginaActual])

  const abrirModalAgregar = () => {
    setVehiculoSeleccionado(null)
    setModalFormularioVisible(true)
  }

  const abrirModalEditar = (vehiculo) => {
    setVehiculoSeleccionado(vehiculo)
    setModalFormularioVisible(true)
  }

  const cerrarModalFormulario = () => {
    setModalFormularioVisible(false)
    setVehiculoSeleccionado(null)
  }

  const manejarGuardar = async (idODatos, datosSiEsEdicion) => {
    const esEdicion = Boolean(datosSiEsEdicion)
    const resultado = esEdicion
      ? await actualizarVehiculo(idODatos, datosSiEsEdicion)
      : await crearVehiculo(idODatos)

    if (resultado.exito) {
      mostrarToast(
        'success',
        esEdicion ? 'Vehículo actualizado correctamente.' : 'Vehículo registrado correctamente.',
      )
      cerrarModalFormulario()
    }

    return resultado
  }

  const abrirModalEliminar = (vehiculo) => {
    setVehiculoAEliminar(vehiculo)
    setErrorEliminar('')
    setModalEliminarVisible(true)
  }

  const cerrarModalEliminar = () => {
    setModalEliminarVisible(false)
    setVehiculoAEliminar(null)
    setErrorEliminar('')
  }

  const confirmarEliminacion = async () => {
    if (!vehiculoAEliminar) return
    const resultado = await eliminarVehiculo(vehiculoAEliminar.id)

    if (resultado.exito) {
      mostrarToast('success', 'Vehículo eliminado correctamente.')
      cerrarModalEliminar()
    } else {
      setErrorEliminar(resultado.mensaje || 'No se pudo eliminar el vehículo.')
    }
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <strong>Vehículos y propietarios</strong>
            <div className="small text-body-secondary">Administración de UTEQ Smart Parking</div>
          </div>

          <div className="d-flex gap-2">
            <CButton color="secondary" variant="outline" onClick={recargar} disabled={cargando}>
              Actualizar
            </CButton>
            <CButton color="success" onClick={abrirModalAgregar} disabled={cargando}>
              <CIcon icon={cilPlus} className="me-1" />
              Agregar vehículo
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-wrap">
            <CFormInput
              type="search"
              placeholder="Buscar placa, vehículo o propietario..."
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              style={{ maxWidth: '420px' }}
            />

            <span className="text-body-secondary">{vehiculosFiltrados.length} vehículos</span>
          </div>

          {cargando && (
            <div className="text-center py-5">
              <CSpinner color="success" />
              <p className="mt-3">Cargando vehículos...</p>
            </div>
          )}

          {!cargando && error && (
            <CAlert color="danger">No se pudieron cargar los vehículos: {error}</CAlert>
          )}

          {!cargando && !error && (
            <>
              <CTable align="middle" bordered hover responsive striped>
                <CTableHead color="dark">
                  <CTableRow>
                    <CTableHeaderCell>Foto del vehículo</CTableHeaderCell>
                    <CTableHeaderCell>Placa</CTableHeaderCell>
                    <CTableHeaderCell>Vehículo</CTableHeaderCell>
                    <CTableHeaderCell>Año / color</CTableHeaderCell>
                    <CTableHeaderCell>Foto del propietario</CTableHeaderCell>
                    <CTableHeaderCell>Propietario</CTableHeaderCell>
                    <CTableHeaderCell>Cédula</CTableHeaderCell>
                    <CTableHeaderCell>Correo</CTableHeaderCell>
                    <CTableHeaderCell>Estado</CTableHeaderCell>
                    <CTableHeaderCell>Acciones</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {vehiculosPaginados.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={10} className="text-center py-4">
                        No se encontraron vehículos.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    vehiculosPaginados.map((vehiculo) => (
                      <CTableRow key={vehiculo.id}>
                        <CTableDataCell>
                          {vehiculo.foto_url ? (
                            <a
                              href={vehiculo.foto_fuente_url || vehiculo.foto_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Abrir fuente de la imagen"
                            >
                              <img
                                src={vehiculo.foto_url}
                                alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                                width="100"
                                height="65"
                                style={{ objectFit: 'cover', borderRadius: '8px' }}
                              />
                            </a>
                          ) : (
                            <span className="text-body-secondary small">Sin foto</span>
                          )}
                        </CTableDataCell>

                        <CTableDataCell>
                          <CBadge color="dark" className="fs-6">
                            {vehiculo.placa}
                          </CBadge>
                        </CTableDataCell>

                        <CTableDataCell>
                          <strong>{vehiculo.marca}</strong>
                          <div className="small text-body-secondary">{vehiculo.modelo}</div>
                        </CTableDataCell>

                        <CTableDataCell>
                          {vehiculo.anio}
                          <div className="small text-body-secondary">{vehiculo.color}</div>
                        </CTableDataCell>

                        <CTableDataCell className="text-center">
                          {vehiculo.foto_propietario_url ? (
                            <img
                              src={vehiculo.foto_propietario_url}
                              alt={`Fotografía de ${vehiculo.propietario_nombre}`}
                              width="60"
                              height="60"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              style={{
                                objectFit: 'cover',
                                borderRadius: '50%',
                                border: '2px solid var(--cui-border-color)',
                              }}
                            />
                          ) : (
                            <span className="text-body-secondary small">Sin foto</span>
                          )}
                        </CTableDataCell>

                        <CTableDataCell>{vehiculo.propietario_nombre}</CTableDataCell>

                        <CTableDataCell>{vehiculo.cedula_enmascarada}</CTableDataCell>

                        <CTableDataCell>
                          <a href={`mailto:${vehiculo.correo_institucional}`}>
                            {vehiculo.correo_institucional}
                          </a>
                        </CTableDataCell>

                        <CTableDataCell>
                          <CBadge color={vehiculo.autorizado ? 'success' : 'danger'}>
                            {vehiculo.autorizado ? 'Autorizado' : 'No autorizado'}
                          </CBadge>
                        </CTableDataCell>

                        <CTableDataCell>
                          <div className="d-flex gap-2">
                            <CButton
                              color="info"
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalEditar(vehiculo)}
                              title="Editar"
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton
                              color="danger"
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalEliminar(vehiculo)}
                              disabled={eliminandoId === vehiculo.id}
                              title="Eliminar"
                            >
                              {eliminandoId === vehiculo.id ? (
                                <CSpinner size="sm" />
                              ) : (
                                <CIcon icon={cilTrash} />
                              )}
                            </CButton>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-between align-items-center">
                <small className="text-body-secondary">
                  Página {paginaActual} de {totalPaginas}
                </small>

                <div className="d-flex gap-2">
                  <CButton
                    color="secondary"
                    variant="outline"
                    disabled={paginaActual === 1}
                    onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
                  >
                    Anterior
                  </CButton>

                  <CButton
                    color="success"
                    variant="outline"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
                  >
                    Siguiente
                  </CButton>
                </div>
              </div>
            </>
          )}
        </CCardBody>
      </CCard>

      <VehiculoFormModal
        visible={modalFormularioVisible}
        vehiculo={vehiculoSeleccionado}
        guardando={guardando}
        onClose={cerrarModalFormulario}
        onGuardar={manejarGuardar}
      />

      <ConfirmarEliminarModal
        visible={modalEliminarVisible}
        vehiculo={vehiculoAEliminar}
        eliminando={eliminandoId !== null}
        error={errorEliminar}
        onCancelar={cerrarModalEliminar}
        onConfirmar={confirmarEliminacion}
      />

      <CToaster placement="top-end" push={toast} />
    </>
  )
}

export default ListaVehiculos
