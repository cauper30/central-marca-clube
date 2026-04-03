import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Send, ShieldCheck, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Task, useTaskStatuses, useProfiles } from "@/hooks/useTasks";
import {
  useChecklists, useSubtasks, useComments, useApprovals, useTaskActivity,
  useToggleChecklist, useToggleSubtask, useAddComment, useSubmitApproval, useUpdateTask,
  useCustomFieldValues, useCustomFields,
} from "@/hooks/useTaskDetails";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const priorityColors: Record<string, string> = {
  urgente: "bg-red-100 text-red-800",
  alta: "bg-orange-100 text-orange-800",
  media: "bg-blue-100 text-blue-800",
  baixa: "bg-gray-100 text-gray-600",
};

interface Props {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export default function TaskDrawer({ task, open, onClose }: Props) {
  const { user, profile } = useAuth();
  const [comment, setComment] = useState("");
  const { data: statuses = [] } = useTaskStatuses();
  const { data: profiles = [] } = useProfiles();
  const { data: checklists = [] } = useChecklists(task?.id || null);
  const { data: subtasks = [] } = useSubtasks(task?.id || null);
  const { data: comments = [] } = useComments(task?.id || null);
  const { data: approvals = [] } = useApprovals(task?.id || null);
  const { data: activity = [] } = useTaskActivity(task?.id || null);
  const { data: cfValues = [] } = useCustomFieldValues(task?.id || null);
  const { data: customFields = [] } = useCustomFields();

  const toggleChecklist = useToggleChecklist();
  const toggleSubtask = useToggleSubtask();
  const addComment = useAddComment();
  const submitApproval = useSubmitApproval();
  const updateTask = useUpdateTask();

  if (!task) return null;

  const checklistProgress = checklists.length > 0
    ? Math.round((checklists.filter((c) => c.is_completed).length / checklists.length) * 100) : 0;

  const handleStatusChange = (statusId: string) => {
    updateTask.mutate({ id: task.id, status_id: statusId, actor_id: user?.id });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateTask.mutate({ id: task.id, assigned_to: assigneeId === "none" ? null : assigneeId, actor_id: user?.id });
  };

  const handleAddComment = () => {
    if (!comment.trim() || !user) return;
    // Extract @mentions
    const mentionRegex = /@(\w+)/g;
    const mentionNames = [...comment.matchAll(mentionRegex)].map((m) => m[1]);
    const mentionIds = profiles
      .filter((p) => mentionNames.some((n) => p.full_name.toLowerCase().includes(n.toLowerCase())))
      .map((p) => p.id);

    addComment.mutate({
      task_id: task.id,
      author_id: user.id,
      content: comment.trim(),
      mentions: mentionIds,
    });
    setComment("");
  };

  const handleSubmitApproval = () => {
    if (!user) return;
    submitApproval.mutate(
      { task_id: task.id, requested_by: user.id },
      { onSuccess: () => toast.success("Enviado para aprovação!") }
    );
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[420px] max-w-full p-0 sm:max-w-[420px]">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-5">
            <SheetHeader>
              <SheetTitle className="text-lg leading-tight pr-6">{task.title}</SheetTitle>
            </SheetHeader>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {task.task_types && (
                <Badge variant="outline" style={{ borderColor: task.task_types.color, color: task.task_types.color }}>
                  {task.task_types.name}
                </Badge>
              )}
              <Badge className={priorityColors[task.priority]} variant="secondary">{task.priority}</Badge>
              {task.task_tags?.map((tt) => (
                <Badge key={tt.tag_id} variant="secondary" style={{ backgroundColor: tt.tags?.color, color: "#fff" }}>
                  {tt.tags?.name}
                </Badge>
              ))}
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            )}

            <Separator />

            {/* Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Select value={task.status_id} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Responsável</span>
                <Select value={task.assigned_to || "none"} onValueChange={handleAssigneeChange}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {task.due_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prazo</span>
                  <div className="flex items-center gap-1 text-sm">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(task.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              )}
            </div>

            {/* Custom fields */}
            {cfValues.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Campos Personalizados</h4>
                  {cfValues.map((cfv: any) => (
                    <div key={cfv.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{cfv.custom_fields?.name}</span>
                      <span>{cfv.value || "—"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Checklist */}
            {checklists.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Checklist</h4>
                    <span className="text-xs text-muted-foreground">{checklistProgress}%</span>
                  </div>
                  <Progress value={checklistProgress} className="h-1.5" />
                  <div className="space-y-1">
                    {checklists.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer rounded p-1 hover:bg-muted/50">
                        <Checkbox
                          checked={c.is_completed}
                          onCheckedChange={(checked) =>
                            toggleChecklist.mutate({ id: c.id, is_completed: !!checked, task_id: task.id, user_id: user?.id })
                          }
                        />
                        <span className={c.is_completed ? "line-through text-muted-foreground" : ""}>{c.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Subtasks */}
            {subtasks.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Subtarefas</h4>
                  {subtasks.map((s: any) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer rounded p-1 hover:bg-muted/50">
                      <Checkbox
                        checked={s.is_completed}
                        onCheckedChange={(checked) =>
                          toggleSubtask.mutate({ id: s.id, is_completed: !!checked, task_id: task.id, user_id: user?.id })
                        }
                      />
                      <span className={s.is_completed ? "line-through text-muted-foreground" : ""}>{s.title}</span>
                      {s.profiles && (
                        <span className="ml-auto text-xs text-muted-foreground">{s.profiles.full_name}</span>
                      )}
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Approvals */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Aprovações</h4>
                <Button size="sm" variant="outline" onClick={handleSubmitApproval} className="h-7 text-xs">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Submeter para Aprovação
                </Button>
              </div>
              {approvals.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma aprovação solicitada</p>
              ) : (
                approvals.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded border border-border p-2 text-xs">
                    <span>{a.requested?.full_name}</span>
                    <Badge variant={a.status === "aprovado" ? "default" : a.status === "reprovado" ? "destructive" : "secondary"} className="text-[10px]">
                      {a.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            {/* Comments */}
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" /> Comentários
              </h4>
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum comentário</p>
              )}
              {comments.map((c: any) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {c.profiles?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{c.profiles?.full_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(c.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm pl-7 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escreva um comentário... use @nome para mencionar"
                  rows={2}
                  className="text-sm"
                />
                <Button size="icon" className="shrink-0 h-10 w-10" onClick={handleAddComment} disabled={!comment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Activity */}
            {activity.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Atividade</h4>
                  {activity.map((a: any) => (
                    <div key={a.id} className="flex items-start gap-2 text-xs">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                      <div>
                        <span className="font-medium">{a.profiles?.full_name}</span>{" "}
                        <span className="text-muted-foreground">{a.action}</span>
                        <p className="text-muted-foreground">
                          {format(new Date(a.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
