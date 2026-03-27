import { useState, useMemo } from "react";
import { EventWithDetails } from "@/hooks/useEvents";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  events: EventWithDetails[];
  loading: boolean;
  onEventClick: (event: EventWithDetails) => void;
}

export default function EventCalendarView({ events, loading, onEventClick }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart, { locale: ptBR });
    const end = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getEventsForDay = (day: Date) =>
    events.filter((e) => {
      if (!e.event_date) return false;
      const eventStart = new Date(e.event_date + "T12:00:00");
      const eventEnd = e.event_end_date ? new Date(e.event_end_date + "T12:00:00") : eventStart;
      return day >= new Date(format(eventStart, "yyyy-MM-dd") + "T00:00:00") &&
             day <= new Date(format(eventEnd, "yyyy-MM-dd") + "T23:59:59");
    });

  if (loading) {
    return <Skeleton className="h-[500px] rounded-xl" />;
  }

  const statusColors: Record<string, string> = {
    planejamento: "#1565C0",
    confirmado: "#2E7D32",
    em_andamento: "#F57F17",
    concluido: "#4CAF50",
    cancelado: "#B71C1C",
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-semibold text-foreground capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] border border-border/50 p-1 ${
                  !isCurrentMonth ? "bg-muted/30" : "bg-card"
                }`}
              >
                <div className={`mb-0.5 text-xs font-medium ${
                  isToday
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => onEventClick(e)}
                      className="block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-white transition-opacity hover:opacity-80"
                      style={{ backgroundColor: statusColors[e.status] || "#616161" }}
                      title={e.name}
                    >
                      {e.name}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
