type Props = { children: React.ReactNode };

export function BentoGrid({ children }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 auto-rows-[minmax(240px,auto)]">
      {children}
    </div>
  );
}
