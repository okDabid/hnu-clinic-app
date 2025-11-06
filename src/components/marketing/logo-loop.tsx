import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoItem {
    name: string;
    logo: string;
}

interface LogoLoopProps {
    logos: LogoItem[];
    className?: string;
    direction?: "left" | "right";
    speedSeconds?: number;
}

export function LogoLoop({ logos, className, direction = "left", speedSeconds = 28 }: LogoLoopProps) {
    const loopItems = [...logos, ...logos];

    return (
        <div className={cn("logo-loop relative overflow-hidden", className)}>
            <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white via-white/90 to-transparent"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white via-white/90 to-transparent"
            />
            <div
                className="logo-loop-track flex w-max gap-10 py-6"
                data-direction={direction}
                style={{ animationDuration: `${speedSeconds}s` }}
            >
                {loopItems.map((item, index) => (
                    <div
                        key={`${item.name}-${index}`}
                        className="flex items-center gap-3 rounded-2xl border border-green-100/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-100 bg-green-50">
                            <Image src={item.logo} alt={item.name} width={40} height={40} className="h-10 w-10 object-contain" />
                        </div>
                        <span className="text-sm font-medium text-green-700">{item.name}</span>
                    </div>
                ))}
            </div>
            <style jsx>{`
                @keyframes logo-loop {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }

                .logo-loop-track {
                    animation: logo-loop linear infinite;
                }

                .logo-loop-track[data-direction="right"] {
                    animation-direction: reverse;
                }

                .logo-loop:hover .logo-loop-track {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}
