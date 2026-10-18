/**
 * Configuración central de la web oficial de HookHub.
 *
 * Todo dato que cambia con el tiempo (enlaces, plataformas, versiones,
 * novedades) vive aquí. Los componentes solo leen de este archivo.
 *
 * REGLAS DE HONESTIDAD:
 * - No inventar URLs. Si algo no existe, se deja `null` y la interfaz
 *   muestra el control deshabilitado con aviso visible.
 * - No inventar versiones, fechas ni instaladores.
 */

export type DownloadStatus = 'available' | 'coming_soon' | 'in_development';

export interface Platform {
  /** Identificador estable */
  id: string;
  /** Nombre visible */
  name: string;
  /** Descripción breve de la plataforma */
  description: string;
  /** Icono a representar (mapeado en el componente) */
  icon: 'windows' | 'android' | 'future';
  status: DownloadStatus;
  /** Versión publicada (solo si status es 'available') */
  version?: string;
  /** URL real del instalador (solo si status es 'available') */
  url?: string;
  /** Nota adicional mostrada junto al estado */
  note?: string;
}

export interface NewsEntry {
  /** Nombre de la versión o del anuncio */
  title: string;
  /** Fecha en formato ISO (YYYY-MM-DD) */
  date: string;
  /** Resumen corto */
  summary: string;
  /** Lista de cambios */
  changes: string[];
  /** Enlace a la publicación original (GitHub Release, etc.) */
  url?: string;
}

export interface ExternalLink {
  /** URL real o null si aún no existe */
  url: string | null;
  /** Etiqueta accesible / texto visible */
  label: string;
  /** Motivo mostrado cuando la URL no está disponible */
  unavailableReason?: string;
}

export const site = {
  name: 'HookHub',
  tagline: 'Tu contenido. Tu estrategia. Tu crecimiento.',
  description:
    'Herramientas inteligentes para analizar contenido, desarrollar ideas y organizar tu estrategia como creador.',
  /** Estado global del proyecto para la web */
  projectStatus: 'in_development' as const,
  /** URL del sitio en producción. null hasta conocer el dominio real. */
  url: null as string | null,

  /** Enlaces externos. null = aún no definidos; los botones saldrán deshabilitados. */
  links: {
    repository: {
      url: null,
      label: 'Ver en GitHub',
      unavailableReason: 'El repositorio aún no se ha publicado.',
    } satisfies ExternalLink,
    issues: {
      url: null,
      label: 'Reportar errores',
      unavailableReason: 'Disponible cuando el repositorio sea público.',
    } satisfies ExternalLink,
    featureRequests: {
      url: null,
      label: 'Proponer funciones',
      unavailableReason: 'Disponible cuando el repositorio sea público.',
    } satisfies ExternalLink,
    roadmap: {
      url: null,
      label: 'Consultar el roadmap',
      unavailableReason: 'Se publicará junto con el repositorio.',
    } satisfies ExternalLink,
    contributing: {
      url: null,
      label: 'Contribuir',
      unavailableReason: 'Se publicarán las guías de contribución con el repositorio.',
    } satisfies ExternalLink,
  },

  /** Plataformas de descarga */
  platforms: [
    {
      id: 'windows',
      name: 'Windows',
      description: 'Aplicación de escritorio para Windows.',
      icon: 'windows',
      status: 'in_development',
      note: 'La primera versión se publicará aquí cuando esté lista.',
    },
    {
      id: 'android',
      name: 'Android',
      description: 'Aplicación móvil para Android.',
      icon: 'android',
      status: 'coming_soon',
      note: 'Prevista para una fase posterior a la versión de escritorio.',
    },
    {
      id: 'other',
      name: 'Otras plataformas',
      description: 'Linux, macOS u otras, sin definir todavía.',
      icon: 'future',
      status: 'coming_soon',
      note: 'Sin definir. Se anunciará si se incorporan nuevas plataformas.',
    },
  ] as Platform[],

  /** Novedades y versiones. Vacío hasta el primer release real. */
  news: [] as NewsEntry[],

  /** Licencia */
  license: {
    name: null as string | null,
    url: null as string | null,
    label: 'Licencia pendiente de definición',
  },
};

/** Insignia de estado legible para humanos */
export const statusLabels: Record<DownloadStatus, string> = {
  available: 'Disponible',
  coming_soon: 'Próximamente',
  in_development: 'En desarrollo',
};

/** Color de la insignia (token CSS) por estado */
export const statusTones: Record<DownloadStatus, 'positive' | 'warning' | 'accent'> = {
  available: 'positive',
  coming_soon: 'warning',
  in_development: 'accent',
};
