import { Download, ArrowRight } from 'lucide-react';
import { site, statusLabels } from '@/config/site';

export interface AvatarList {
  image: string;
}

const statusLine = `Proyecto ${statusLabels[site.projectStatus].toLowerCase()} · Windows y Android en preparación`;
const titleLines = site.tagline.match(/[^.]+\./g) ?? [site.tagline];

export default function HeroSection({ avatarList }: { avatarList: AvatarList[] }) {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative overflow-hidden bg-background">
      <div className="bg-dots pointer-events-none absolute inset-0" aria-hidden="true" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[7%] top-28 hidden animate-float lg:block"
      >
        <div className="h-24 w-24 rounded-2xl border-2 border-primary/30 bg-white shadow-sm">
          <div className="m-3 h-8 w-8 rounded-md bg-primary/15" />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-44 hidden animate-float lg:block [animation-delay:1.8s]"
      >
        <div className="relative h-20 w-20 rounded-full border-[6px] border-foreground/10">
          <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary" />
        </div>
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 pb-14 pt-16 text-center md:px-6 md:pb-20 md:pt-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
          {statusLine}
        </p>

        <h1
          id="hero-title"
          className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {titleLines.map((line, index) => (
            <span key={line} className="block">
              {line}
              {index < titleLines.length - 1 ? ' ' : null}
            </span>
          ))}
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {site.description}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#descargas"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Descargar HookHub
          </a>
          <a
            href="#caracteristicas"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors duration-300 hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Explorar características
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="flex -space-x-2">
            {avatarList.map((avatar) => (
              <img
                key={avatar.image}
                src={avatar.image}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-background object-cover shadow-sm"
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Hecho para creadores de contenido</p>
        </div>
      </div>
    </section>
  );
}
