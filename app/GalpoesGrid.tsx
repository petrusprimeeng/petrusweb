"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Galpao = {
  id: string;
  titulo: string;
  tipo: string;
  categoria: string;
  uso_terreno: string | null;
  valor: number | null;
  cidade: string;
  bairro: string | null;
  area_construida_m2: number | null;
  area_total_m2: number | null;
  pe_direito_m: number | null;
  numero_docas: number;
  acesso_carreta: boolean;
  vagas_estacionamento: number;
  descricao: string | null;
  galpao_imagens: { storage_path: string; ordem: number }[];
};

type Categoria = "galpao" | "loja" | "terreno";
type Negocio = "todos" | "venda" | "locacao";
type UsoTerreno = "todos" | "galpao" | "loja" | "ambos";

type Props = {
  galpoes: Galpao[];
  supabaseUrl: string;
  initialCategoria?: Categoria;
  initialNegocio?: Negocio;
  initialCidade?: string;
  excludeId?: string;
};

const btnToggle = (active: boolean) =>
  `px-3 py-1.5 text-xs font-medium border transition-colors ${
    active
      ? "bg-gray-900 text-white border-gray-900"
      : "border-gray-300 text-gray-500 hover:border-gray-600 hover:text-gray-900"
  }`;

const inputCls =
  "border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-gray-900 bg-white w-full";

export default function GalpoesGrid({
  galpoes,
  supabaseUrl,
  initialCategoria,
  initialNegocio,
  initialCidade,
  excludeId,
}: Props) {
  const [categoria, setCategoria] = useState<Categoria>(initialCategoria ?? "galpao");
  const [negocio, setNegocio] = useState<Negocio>(initialNegocio ?? "todos");
  const [cidade, setCidade] = useState(initialCidade ?? "todas");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [peMin, setPeMin] = useState("");
  const [docasMin, setDocasMin] = useState("");
  const [acessoCarreta, setAcessoCarreta] = useState(false);
  const [vagasMin, setVagasMin] = useState("");
  const [usoTerreno, setUsoTerreno] = useState<UsoTerreno>("todos");

  function resetFiltros() {
    setNegocio("todos"); setCidade("todas");
    setAreaMin(""); setAreaMax(""); setValorMin(""); setValorMax("");
    setPeMin(""); setDocasMin(""); setAcessoCarreta(false);
    setVagasMin(""); setUsoTerreno("todos");
  }

  function mudarCategoria(cat: Categoria) {
    setCategoria(cat);
    resetFiltros();
  }

  const porCategoria = useMemo(() => ({
    galpao: galpoes.filter((g) => g.categoria === "galpao" && g.id !== excludeId),
    loja:   galpoes.filter((g) => g.categoria === "loja"   && g.id !== excludeId),
    terreno: galpoes.filter((g) => g.categoria === "terreno" && g.id !== excludeId),
  }), [galpoes, excludeId]);

  const cidades = useMemo(() => {
    const s = new Set(porCategoria[categoria].map((g) => g.cidade).filter(Boolean));
    return Array.from(s).sort();
  }, [porCategoria, categoria]);

  const filtrosAtivos = useMemo(() => {
    let n = 0;
    if (negocio !== "todos") n++;
    if (cidade !== "todas") n++;
    if (areaMin || areaMax) n++;
    if (valorMin || valorMax) n++;
    if (peMin) n++;
    if (docasMin) n++;
    if (acessoCarreta) n++;
    if (vagasMin) n++;
    if (usoTerreno !== "todos") n++;
    return n;
  }, [negocio, cidade, areaMin, areaMax, valorMin, valorMax, peMin, docasMin, acessoCarreta, vagasMin, usoTerreno]);

  const filtrados = useMemo(() => {
    return porCategoria[categoria].filter((g) => {
      if (negocio === "venda"   && g.tipo !== "venda"   && g.tipo !== "venda_locacao") return false;
      if (negocio === "locacao" && g.tipo !== "locacao" && g.tipo !== "venda_locacao") return false;
      if (cidade !== "todas" && g.cidade !== cidade) return false;
      const areaRef = categoria === "terreno" ? (g.area_total_m2 ?? 0) : (g.area_construida_m2 ?? 0);
      if (areaMin && areaRef < Number(areaMin)) return false;
      if (areaMax && areaRef > Number(areaMax)) return false;
      if (valorMin && (g.valor ?? 0) < Number(valorMin)) return false;
      if (valorMax && (g.valor ?? 0) > Number(valorMax)) return false;
      if (categoria === "terreno" && usoTerreno !== "todos" && g.uso_terreno !== usoTerreno) return false;
      if (categoria === "galpao") {
        if (peMin    && (g.pe_direito_m  ?? 0) < Number(peMin))   return false;
        if (docasMin && (g.numero_docas  ?? 0) < Number(docasMin)) return false;
        if (acessoCarreta && !g.acesso_carreta) return false;
      }
      if (categoria === "loja" && vagasMin && (g.vagas_estacionamento ?? 0) < Number(vagasMin)) return false;
      return true;
    });
  }, [porCategoria, categoria, negocio, cidade, areaMin, areaMax, valorMin, valorMax, peMin, docasMin, acessoCarreta, vagasMin, usoTerreno]);

  return (
    <div>
      {/* Painel de filtros — sempre visível */}
      <div className="mt-8 border border-gray-200">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="flex flex-col gap-0.5 w-4" aria-hidden>
              <span className="block h-px bg-current w-full" />
              <span className="block h-px bg-current w-3/4" />
              <span className="block h-px bg-current w-1/2" />
            </span>
            Filtros
            {filtrosAtivos > 0 && (
              <span className="bg-gray-900 text-white text-xs px-1.5 py-0.5 font-medium">
                {filtrosAtivos}
              </span>
            )}
          </span>
          {filtrosAtivos > 0 && (
            <button
              onClick={resetFiltros}
              className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Campos */}
        <div className="px-4 py-4 space-y-4">

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">Categoria</span>
            <div className="flex flex-wrap gap-1.5">
              {([
                { key: "galpao",  label: "Galpões"  },
                { key: "loja",    label: "Lojas"     },
                { key: "terreno", label: "Terrenos"  },
              ] as { key: Categoria; label: string }[]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => mudarCategoria(t.key)}
                  className={btnToggle(categoria === t.key)}
                >
                  {t.label}
                  <span className={`ml-1.5 ${categoria === t.key ? "text-gray-300" : "text-gray-400"}`}>
                    {porCategoria[t.key].length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Negócio */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500">Negócio</span>
            <div className="flex flex-wrap gap-1.5">
              {(["todos", "venda", "locacao"] as Negocio[]).map((n) => (
                <button key={n} onClick={() => setNegocio(n)} className={btnToggle(negocio === n)}>
                  {n === "todos" ? "Todos" : n === "venda" ? "Venda" : "Locação"}
                </button>
              ))}
            </div>
          </div>

          {/* Uso do terreno */}
          {categoria === "terreno" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-500">Uso indicado</span>
              <div className="flex flex-wrap gap-1.5">
                {(["todos", "galpao", "loja", "ambos"] as UsoTerreno[]).map((u) => (
                  <button key={u} onClick={() => setUsoTerreno(u)} className={btnToggle(usoTerreno === u)}>
                    {u === "todos" ? "Todos" : u === "galpao" ? "Galpão" : u === "loja" ? "Loja" : "Galpão e Loja"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inputs em grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Cidade</label>
              <select className={inputCls} value={cidade} onChange={(e) => setCidade(e.target.value)}>
                <option value="todas">Todas</option>
                {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                {categoria === "terreno" ? "Área total (m²)" : "Área construída (m²)"}
              </label>
              <div className="flex gap-1.5">
                <input type="number" placeholder="Mín" className={inputCls} value={areaMin} onChange={(e) => setAreaMin(e.target.value)} />
                <input type="number" placeholder="Máx" className={inputCls} value={areaMax} onChange={(e) => setAreaMax(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Valor (R$)</label>
              <div className="flex gap-1.5">
                <input type="number" placeholder="Mín" className={inputCls} value={valorMin} onChange={(e) => setValorMin(e.target.value)} />
                <input type="number" placeholder="Máx" className={inputCls} value={valorMax} onChange={(e) => setValorMax(e.target.value)} />
              </div>
            </div>

            {categoria === "galpao" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">Pé direito mín. (m)</label>
                  <input type="number" step="0.5" placeholder="Ex: 8" className={inputCls} value={peMin} onChange={(e) => setPeMin(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">Docas mín.</label>
                  <input type="number" min="0" placeholder="Ex: 2" className={inputCls} value={docasMin} onChange={(e) => setDocasMin(e.target.value)} />
                </div>
              </>
            )}

            {categoria === "loja" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Vagas mín.</label>
                <input type="number" min="0" placeholder="Ex: 5" className={inputCls} value={vagasMin} onChange={(e) => setVagasMin(e.target.value)} />
              </div>
            )}
          </div>

          {categoria === "galpao" && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer w-fit">
              <input type="checkbox" checked={acessoCarreta} onChange={(e) => setAcessoCarreta(e.target.checked)} className="w-4 h-4" />
              Acesso para carreta
            </label>
          )}
        </div>
      </div>

      {/* Contagem */}
      <p className="mt-3 text-xs text-gray-400">
        {filtrados.length} imóvel{filtrados.length !== 1 ? "is" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
        {filtrosAtivos > 0 ? " com os filtros aplicados" : ""}
      </p>

      {/* Grid de cards */}
      {filtrados.length === 0 ? (
        <p className="text-sm text-gray-400 py-12 text-center">Nenhum imóvel disponível nesta categoria.</p>
      ) : (
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((g) => {
            const imagens = [...g.galpao_imagens].sort((a, b) => a.ordem - b.ordem);
            const capa = imagens[0];
            const tipoLabel = g.tipo === "venda" ? "Venda" : g.tipo === "locacao" ? "Locação" : "Venda / Locação";

            const qs = new URLSearchParams({
              ...(categoria !== "galpao" ? { categoria } : {}),
              ...(negocio   !== "todos"  ? { negocio }   : {}),
              ...(cidade    !== "todas"  ? { cidade }     : {}),
            }).toString();
            const href = `/galpoes/${g.id}${qs ? `?${qs}` : ""}`;

            return (
              <Link
                key={g.id}
                href={href}
                className="group border border-gray-200 hover:border-gray-400 transition-colors"
              >
                <div className="bg-gray-100 h-48 overflow-hidden">
                  {capa ? (
                    <img
                      src={`${supabaseUrl}/storage/v1/object/public/galpoes/${capa.storage_path}`}
                      alt={g.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      Sem foto
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{tipoLabel}</span>
                    {g.valor && (
                      <span className="text-xs text-gray-500">R$ {Number(g.valor).toLocaleString("pt-BR")}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{g.titulo}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {g.bairro ? `${g.bairro}, ` : ""}{g.cidade}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                    {g.categoria === "terreno" ? (
                      <>
                        {g.area_total_m2 && <span>{g.area_total_m2.toLocaleString("pt-BR")} m²</span>}
                        {g.uso_terreno && (
                          <span>Para {g.uso_terreno === "galpao" ? "galpão" : g.uso_terreno === "loja" ? "loja" : "galpão e loja"}</span>
                        )}
                      </>
                    ) : (
                      <>
                        {g.area_construida_m2 && <span>{g.area_construida_m2.toLocaleString("pt-BR")} m²</span>}
                        {g.pe_direito_m && <span>Pé direito {g.pe_direito_m}m</span>}
                        {g.numero_docas > 0 && <span>{g.numero_docas} doca{g.numero_docas > 1 ? "s" : ""}</span>}
                        {g.acesso_carreta && g.categoria === "galpao" && <span>Acesso carreta</span>}
                        {g.vagas_estacionamento > 0 && g.categoria === "loja" && <span>{g.vagas_estacionamento} vagas</span>}
                      </>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-gray-400 line-clamp-2">{g.descricao}</p>
                  <p className="mt-4 text-xs font-medium text-gray-900 group-hover:underline">Ver detalhes</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
