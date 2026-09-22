export type RolUsuario = "administradora" | "equipo";
export type ClaseMaterial = "tela" | "insumo";
export type TipoMovimiento = "entrada" | "salida" | "ajuste";
export type EtapaPrenda = "patronaje" | "corte" | "confeccion" | "prueba" | "acabados";
export type EstadoPrenda = "en_proceso" | "terminada" | "disponible" | "reservada" | "entregada";

export interface Perfil {
  id: string;
  nombre: string;
  email: string | null;
  rol: RolUsuario;
  activo: boolean;
  creado_en: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  suministra: string | null;
  dias_entrega: number | null;
  notas: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Fila de la vista materiales_vista: incluye stock calculado y alerta. */
export interface Material {
  id: string;
  clase: ClaseMaterial;
  codigo: string;
  nombre: string;
  tipo: string | null;
  unidad: string;
  proveedor_id: string | null;
  proveedor_nombre: string | null;
  /** null cuando quien mira es del rol equipo */
  costo_unitario: number | null;
  ubicacion: string | null;
  punto_reposicion: number;
  foto_url: string | null;
  notas: string | null;
  activo: boolean;
  composicion: string | null;
  color: string | null;
  ancho_cm: number | null;
  creado_en: string;
  actualizado_en: string;
  stock: number;
  ultimo_movimiento: string | null;
  bajo_minimo: boolean;
  valor_inventario: number | null;
}

export interface Movimiento {
  id: string;
  material_id: string;
  material_codigo: string;
  material_nombre: string;
  material_clase: ClaseMaterial;
  material_unidad: string;
  tipo: TipoMovimiento;
  cantidad: number;
  cantidad_efectiva: number;
  costo_unitario: number | null;
  costo_total: number | null;
  prenda_id: string | null;
  prenda_codigo: string | null;
  prenda_nombre: string | null;
  motivo: string | null;
  fecha: string;
  registrado_por: string | null;
  registrado_por_nombre: string | null;
  anulado: boolean;
  anulado_en: string | null;
  motivo_anulacion: string | null;
}

export interface Prenda {
  id: string;
  codigo: string;
  nombre: string;
  clienta_id: string | null;
  clienta_nombre: string | null;
  coleccion_id: string | null;
  coleccion_nombre: string | null;
  etapa: EtapaPrenda;
  estado: EstadoPrenda;
  responsable_id: string | null;
  responsable_nombre: string | null;
  talla: string | null;
  fecha_estimada_entrega: string | null;
  fecha_entrega_real: string | null;
  precio_venta: number | null;
  foto_url: string | null;
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
  costo_materiales: number | null;
  margen: number | null;
  margen_porcentaje: number | null;
  materiales_asignados: number;
}

export interface Clienta {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  activo: boolean;
  creado_en: string;
}

export interface Coleccion {
  id: string;
  nombre: string;
  temporada: string | null;
  anio: number | null;
  notas: string | null;
  activo: boolean;
  creado_en: string;
}

export interface EntradaHistorial {
  id: number;
  tabla: string;
  registro_id: string;
  accion: "creado" | "actualizado" | "eliminado";
  descripcion: string | null;
  usuario_id: string | null;
  usuario_nombre: string | null;
  ocurrido_en: string;
}

/** Resultado uniforme de las acciones de formulario. */
export type ResultadoAccion =
  | { ok: true; mensaje?: string }
  | { ok: false; error: string };
