import { Construction } from "lucide-react";

interface Props {
  title: string;
  phase?: string;
}

export default function PlaceholderPage({ title, phase = "Em breve" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Construction className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{phase}</p>
    </div>
  );
}
