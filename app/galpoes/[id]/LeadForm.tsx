"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Props = {
  galpaoId: string;
  galpaoTitulo: string;
};

export default function LeadForm({ galpaoId, galpaoTitulo }: Props) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("leads").insert({
      nome: nome.trim(),
      telefone: telefone.trim(),
      empresa: empresa.trim() || null,
      galpao_id: galpaoId,
      galpao_titulo: galpaoTitulo,
    });

    setLoading(false);

    if (error) {
      setErro("Erro ao enviar. Tente pelo WhatsApp.");
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-900">Contato recebido</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          Retornaremos em breve pelo número informado.
        </p>
      </div>
    );
  }

  const inp = "w-full border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-900 bg-white placeholder:text-gray-300";

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <p className="text-xs text-gray-400 mb-3">Ou deixe seu contato</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          placeholder="Nome *"
          className={inp}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Telefone *"
          className={inp}
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Empresa"
          className={inp}
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
        />
        {erro && <p className="text-xs text-red-500">{erro}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-gray-900 text-gray-900 px-6 py-2.5 text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-40"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
