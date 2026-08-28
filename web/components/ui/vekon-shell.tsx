import { VekonBrandMark } from "@/components/ui/vekon-brand-mark";
import { VekonBadge } from "@/components/ui/vekon-badge";
import { studyConfig } from "@/lib/research/study-config";

interface VekonShellProps {
  children: React.ReactNode;
  badge?: string;
  showFooter?: boolean;
}

export function VekonShell({ children, badge, showFooter = true }: VekonShellProps) {
  return (
    <div className="vekon-page">
      <div className="vekon-grid-bg" aria-hidden />
      <div className="vekon-shell">
        <header className="vekon-header">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <VekonBrandMark />
              <div>
                <p className="text-sm font-bold tracking-tight text-[#0f2847]">Vekon Research</p>
                <p className="text-xs text-[#5a6b82]">{studyConfig.studyTitle}</p>
              </div>
            </div>
            {badge && (
              <VekonBadge variant="accent" >
                {badge}
              </VekonBadge>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">{children}</main>

        {showFooter && (
          <footer className="pb-10 text-center text-xs leading-relaxed text-[#5a6b82]">
            <p>Vekon Research · Pesquisa com seres humanos · LGPD · Res. CNS 510/2016</p>
            <p className="mt-1">Dados transmitidos com criptografia (HTTPS). IP não coletado.</p>
          </footer>
        )}
      </div>
    </div>
  );
}
