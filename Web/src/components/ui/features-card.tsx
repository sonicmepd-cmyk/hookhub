'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  BarChart3,
  PenLine,
  Compass,
  Plug,
  Video,
  Terminal,
  Layers,
  Monitor,
  Smartphone,
  Rocket,
  Download,
  Newspaper,
  GitBranch,
  Scale,
  Lightbulb,
} from 'lucide-react';
import { site, statusLabels, type DownloadStatus } from '@/config/site';

const statusTextTone: Record<DownloadStatus, string> = {
  available: 'text-[#15803d]',
  coming_soon: 'text-[#b45309]',
  in_development: 'text-primary',
};

const statusBadgeTone: Record<DownloadStatus, string> = {
  available: 'border-[#15803d]/30 bg-[#15803d]/10 text-[#15803d]',
  coming_soon: 'border-[#b45309]/30 bg-[#b45309]/10 text-[#b45309]',
  in_development: 'border-primary/30 bg-primary/10 text-primary',
};

const features = [
  {
    id: 'analytics',
    title: 'Analytics',
    description:
      'Analiza el rendimiento de tu contenido y de los canales que conectes para decidir con datos, no con intuición.',
    status: 'in_development' as DownloadStatus,
    icon: BarChart3,
  },
  {
    id: 'ai',
    title: 'HookHub AI',
    description:
      'Asistencia con distintos proveedores y modelos de inteligencia artificial: eliges el proveedor que prefieras.',
    status: 'in_development' as DownloadStatus,
    icon: Sparkles,
  },
  {
    id: 'ideas',
    title: 'Ideas y guiones',
    description:
      'Desarrolla ideas, ganchos y guiones para tu contenido a partir de tu propio contexto.',
    status: 'in_development' as DownloadStatus,
    icon: PenLine,
  },
  {
    id: 'strategy',
    title: 'Estrategia personalizada',
    description:
      'HookHub mantiene el contexto y tus preferencias como creador para adaptarse a tu forma de trabajar.',
    status: 'in_development' as DownloadStatus,
    icon: Compass,
  },
  {
    id: 'integrations',
    title: 'Integraciones',
    description:
      'Conexiones autorizadas con plataformas sociales para reunir tu información en un solo lugar.',
    status: 'coming_soon' as DownloadStatus,
    icon: Plug,
  },
  {
    id: 'video',
    title: 'Video Studio',
    description:
      'Generación de vídeos y motion graphics como función futura del ecosistema HookHub.',
    status: 'coming_soon' as DownloadStatus,
    icon: Video,
  },
];

const platformIcons: Record<string, typeof Monitor> = {
  windows: Monitor,
  android: Smartphone,
  future: Rocket,
};

const terminalLines: { text: string; cls: string }[] = [
  { text: '// Vista conceptual: aún no existe producto ni CLI', cls: 'text-muted-foreground' },
  { text: '$ hookhub estado', cls: 'text-primary' },
  { text: '· Windows       en desarrollo', cls: 'text-foreground' },
  { text: '· Android       próximamente', cls: 'text-foreground' },
  { text: '· Otras         sin definir', cls: 'text-foreground' },
  { text: '· Repositorio   sin publicar', cls: 'text-foreground' },
  { text: '✓ Estado real reflejado en esta web', cls: 'text-[#15803d]' },
];

const stats = [
  { label: 'Versiones publicadas', value: '0', icon: Download },
  { label: 'Novedades publicadas', value: '0', icon: Newspaper },
  { label: 'Repositorio', value: 'Sin publicar', icon: GitBranch },
  { label: 'Licencia', value: 'Pendiente', icon: Scale },
];

export const Component = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRow, setSelectedRow] = useState(0);

  const activeFeature = features[activeTab];

  const projectRows = [
    ...site.platforms.map((platform) => ({
      label: platform.name,
      value: statusLabels[platform.status],
      note:
        platform.id === 'windows'
          ? 'Escritorio'
          : platform.id === 'android'
            ? 'Móvil'
            : 'Sin definir todavía',
    })),
    {
      label: 'Repositorio',
      value: site.links.repository.url ? 'Publicado' : 'Sin publicar',
      note: 'Pendiente de publicar',
    },
  ];

  return (
    <section
      id="caracteristicas"
      aria-labelledby="features-title"
      className="w-full overflow-hidden border-block border-border bg-soft px-4 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-16">
        <div className="flex max-w-3xl flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
            <Sparkles className="h-4 w-4 text-foreground" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-wider text-muted-foreground">
              Funciones previstas
            </span>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-primary">
            Características
          </p>
          <h2 id="features-title" className="text-3xl font-bold tracking-tight md:text-5xl">
            Todo tu ciclo de creador, en una sola herramienta
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Estas son las capacidades previstas para HookHub. Las funciones en desarrollo o
            planificadas se indican con su estado real.
          </p>
        </div>

        <div className="grid auto-rows-[minmax(280px,auto)] grid-cols-1 gap-4 md:grid-cols-4">
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:border-muted-foreground/40 hover:shadow-md md:col-span-2 md:row-span-2 md:p-8">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-soft px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-foreground" aria-hidden="true" />
                6 funciones previstas
              </div>
              <h3 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl">
                Funciones de HookHub
              </h3>
              <p className="text-sm text-muted-foreground">
                Pulsa para ver cada función y su estado real.
              </p>
            </div>

            <div className="relative mt-6 grid grid-cols-2 gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeTab === index;
                return (
                  <button
                    key={feature.id}
                    type="button"
                    data-feature={feature.id}
                    aria-pressed={isActive}
                    onClick={() => setActiveTab(index)}
                    className={cn(
                      'feature-card relative flex flex-col rounded-xl border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                      isActive
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border bg-soft hover:border-muted-foreground/40',
                    )}
                  >
                    <Icon
                      className={cn(
                        'mb-2 h-5 w-5 transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold text-foreground">{feature.title}</span>
                    <span
                      className={cn(
                        'mt-1 text-[10px] font-semibold',
                        statusTextTone[feature.status],
                      )}
                    >
                      {statusLabels[feature.status]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              data-feature-panel
              className="mt-6 rounded-xl border border-border bg-soft p-4"
            >
              <p className="mb-1 font-mono text-[11px] text-muted-foreground">
                Función seleccionada
              </p>
              <p className="text-lg font-bold text-foreground">{activeFeature.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {activeFeature.description}
              </p>
              <span
                className={cn(
                  'mt-3 inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                  statusBadgeTone[activeFeature.status],
                )}
              >
                {statusLabels[activeFeature.status]}
              </span>
            </div>
          </div>

          <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:border-muted-foreground/40 hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg border border-border bg-soft p-2">
                <BarChart3 className="h-5 w-5 text-foreground" aria-hidden="true" />
              </div>
              <span className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                {statusLabels[site.projectStatus]}
              </span>
            </div>
            <h3 className="mb-1 text-sm font-bold text-foreground">Estado del proyecto</h3>
            <p className="mb-4 text-xs text-muted-foreground">Plataformas y repositorio</p>

            <div className="space-y-2">
              {projectRows.map((row, index) => (
                <button
                  key={row.label}
                  type="button"
                  aria-pressed={selectedRow === index}
                  onClick={() => setSelectedRow(index)}
                  className={cn(
                    'w-full rounded-lg border p-2 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    selectedRow === index
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-soft hover:border-muted-foreground/40',
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </p>
                  <div className="mt-0.5 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-foreground">{row.value}</span>
                    <span className="text-[10px] text-muted-foreground">{row.note}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:border-muted-foreground/40 hover:shadow-md">
            <div className="mb-4 w-fit rounded-lg border border-border bg-soft p-2">
              <Layers className="h-5 w-5 text-foreground" aria-hidden="true" />
            </div>
            <h3 className="mb-1 text-sm font-bold text-foreground">Plataformas</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Se anunciarán antes de publicar
            </p>

            <div className="grid grid-cols-3 gap-2">
              {site.platforms.map((platform) => {
                const Icon = platformIcons[platform.icon];
                return (
                  <div
                    key={platform.id}
                    className="group/pt flex flex-col items-center gap-1 rounded-lg border border-border bg-soft p-3 text-center transition-all duration-200 hover:border-muted-foreground/40"
                  >
                    <Icon
                      className="h-5 w-5 text-foreground transition-transform duration-200 group-hover/pt:scale-110"
                      aria-hidden="true"
                    />
                    <p className="text-[10px] font-semibold text-foreground">
                      {platform.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {statusLabels[platform.status]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:border-muted-foreground/40 hover:shadow-md md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg border border-border bg-soft p-2">
                <Terminal className="h-5 w-5 text-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Estado por consola</h3>
            </div>

            <div className="max-h-40 overflow-auto rounded-lg border border-border bg-soft p-4 font-mono text-xs leading-relaxed">
              {terminalLines.map((line, index) => (
                <div key={index} className="flex gap-2">
                  <span
                    className="w-6 shrink-0 select-none text-right text-muted-foreground"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span className={line.cls}>{line.text}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Simulación conceptual: hoy no existe un producto ni una CLI publicados.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background p-4 shadow-sm transition-all duration-300 hover:border-muted-foreground/40 hover:shadow-md"
              >
                <Icon className="mb-3 h-4 w-4 text-foreground" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p
                  className={cn(
                    'mt-1 font-bold text-foreground',
                    stat.value.length > 3 ? 'text-base' : 'text-xl',
                  )}
                >
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Component;
