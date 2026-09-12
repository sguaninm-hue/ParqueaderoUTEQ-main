import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Solo se seleccionan columnas públicas. La cédula completa y las claves
// internas nunca se exponen al cliente; para lectura se usa la columna
// generada `cedula_enmascarada`.
const COLUMNAS_PUBLICAS = `
  id,
  placa,
  marca,
  modelo,
  anio,
  color,
  tipo,
  foto_url,
  foto_fuente_url,
  foto_propietario_url,
  cedula_enmascarada,
  propietario_nombre,
  correo_institucional,
  autorizado
`

export const useVehiculos = () => {
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)

  const cargarVehiculos = useCallback(async () => {
    setCargando(true)
    setError('')

    const { data, error: errorSupabase } = await supabase
      .from('vehiculos')
      .select(COLUMNAS_PUBLICAS)
      .order('propietario_nombre', { ascending: true })

    if (errorSupabase) {
      setVehiculos([])
      setError(errorSupabase.message)
    } else {
      setVehiculos(data ?? [])
    }

    setCargando(false)
  }, [])

  useEffect(() => {
    // Carga inicial de datos desde Supabase al montar el hook.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarVehiculos()
  }, [cargarVehiculos])

  /**
   * Crea un vehículo nuevo. `datos` debe incluir `cedula` (texto plano);
   * la base de datos se encarga de calcular `cedula_enmascarada`.
   */
  const crearVehiculo = useCallback(
    async (datos) => {
      setGuardando(true)
      const { error: errorSupabase } = await supabase.from('vehiculos').insert([datos])
      setGuardando(false)

      if (errorSupabase) {
        return { exito: false, mensaje: errorSupabase.message }
      }

      await cargarVehiculos()
      return { exito: true }
    },
    [cargarVehiculos],
  )

  /**
   * Actualiza un vehículo existente. Si `datos.cedula` no viene definido
   * (formulario dejado en blanco), la cédula actual se conserva.
   */
  const actualizarVehiculo = useCallback(
    async (id, datos) => {
      setGuardando(true)
      const { error: errorSupabase } = await supabase.from('vehiculos').update(datos).eq('id', id)
      setGuardando(false)

      if (errorSupabase) {
        return { exito: false, mensaje: errorSupabase.message }
      }

      await cargarVehiculos()
      return { exito: true }
    },
    [cargarVehiculos],
  )

  const eliminarVehiculo = useCallback(
    async (id) => {
      setEliminandoId(id)
      const { error: errorSupabase } = await supabase.from('vehiculos').delete().eq('id', id)
      setEliminandoId(null)

      if (errorSupabase) {
        return { exito: false, mensaje: errorSupabase.message }
      }

      await cargarVehiculos()
      return { exito: true }
    },
    [cargarVehiculos],
  )

  return {
    vehiculos,
    cargando,
    error,
    guardando,
    eliminandoId,
    recargar: cargarVehiculos,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
  }
}

export default useVehiculos
