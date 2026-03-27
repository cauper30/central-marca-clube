import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, MessageSquare, CheckCircle, Loader2 } from "lucide-react";

export default function PublicLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: "" as string, name: "", email: "", area: "", message: "" });

  useEffect(() => {
    supabase
      .from("links")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setLinks(data || []);
        setLoading(false);
      });
  }, []);

  const handleLinkClick = async (link: any) => {
    // Increment click count (best effort)
    supabase
      .from("links")
      .update({ click_count: (link.click_count || 0) + 1 })
      .eq("id", link.id)
      .then(() => {});
    window.open(link.url, "_blank");
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type || !form.message.trim()) return;
    setSubmitting(true);
    await supabase.from("feedback").insert({
      type: form.type as any,
      name: form.name || null,
      email: form.email || null,
      area: form.area || null,
      message: form.message,
    });
    setSubmitting(false);
    setSubmitted(true);
    setForm({ type: "", name: "", email: "", area: "", message: "" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">
            CP
          </div>
          <h1 className="text-2xl font-bold text-foreground">Clube Pirassununga</h1>
          <p className="text-sm text-muted-foreground">Links úteis</p>
        </div>

        {/* Links */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : links.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Nenhum link disponível</p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-muted"
              >
                <span className="font-medium text-foreground">{link.title}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* Feedback section */}
        <div className="pt-4">
          {!showForm && !submitted && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowForm(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Reclamações e Sugestões
            </Button>
          )}

          {submitted && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center">
              <CheckCircle className="h-8 w-8 text-success" />
              <p className="font-medium text-foreground">Obrigado pelo seu feedback!</p>
              <p className="text-sm text-muted-foreground">Sua mensagem foi enviada com sucesso.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSubmitted(false); setShowForm(false); }}>
                Enviar outro
              </Button>
            </div>
          )}

          {showForm && !submitted && (
            <form onSubmit={handleSubmitFeedback} className="space-y-4 rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">Envie seu feedback</h3>

              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reclamacao">Reclamação</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="elogio">Elogio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome (opcional)</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>E-mail (opcional)</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Área (opcional)</Label>
                <Select value={form.area} onValueChange={(v) => setForm((f) => ({ ...f, area: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piscina">Piscina</SelectItem>
                    <SelectItem value="restaurante">Restaurante</SelectItem>
                    <SelectItem value="esportes">Esportes</SelectItem>
                    <SelectItem value="eventos">Eventos</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mensagem *</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  required
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || !form.type || !form.message.trim()} className="flex-1">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Enviar
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
