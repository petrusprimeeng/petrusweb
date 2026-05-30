import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const nome: string = (body.nome ?? "").trim();
  const telefone: string = (body.telefone ?? "").trim();
  const empresa: string = (body.empresa ?? "").trim();
  const galpao_id: string | null = body.galpao_id || null;
  const galpao_titulo: string | null = body.galpao_titulo || null;

  if (!nome || !telefone) {
    return NextResponse.json({ error: "Nome e telefone obrigatórios" }, { status: 400 });
  }

  // Limites de tamanho para evitar abusos
  if (nome.length > 120 || telefone.length > 30 || empresa.length > 120) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { error: dbError } = await supabase.from("leads").insert({
    nome,
    telefone,
    empresa: empresa || null,
    galpao_id,
    galpao_titulo,
  });

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return NextResponse.json({ error: "Erro ao salvar lead" }, { status: 500 });
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_TO_EMAIL) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const nomeEsc = escapeHtml(nome);
    const telefoneEsc = escapeHtml(telefone);
    const empresaEsc = empresa ? escapeHtml(empresa) : null;
    const tituloEsc = galpao_titulo ? escapeHtml(galpao_titulo) : null;
    const telDigits = telefone.replace(/\D/g, "");

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Alphamix Galpões <onboarding@resend.dev>",
      to: process.env.RESEND_TO_EMAIL!.split(",").map((e) => e.trim()),
      subject: `Novo lead: ${nomeEsc}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; color: #111;">
          <p style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Novo lead pelo site</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 120px;">Nome</td>
              <td style="padding: 8px 0; font-weight: 500;">${nomeEsc}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Telefone</td>
              <td style="padding: 8px 0; font-weight: 500;">
                <a href="https://wa.me/55${telDigits}" style="color: #111;">${telefoneEsc}</a>
              </td>
            </tr>
            ${empresaEsc ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Empresa</td>
              <td style="padding: 8px 0; font-weight: 500;">${empresaEsc}</td>
            </tr>` : ""}
            ${tituloEsc ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Imóvel</td>
              <td style="padding: 8px 0; font-weight: 500;">${tituloEsc}</td>
            </tr>` : ""}
          </table>
          <div style="margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
            <a href="https://wa.me/55${telDigits}"
               style="display: inline-block; background: #111; color: #fff; padding: 10px 20px; text-decoration: none; font-size: 14px;">
              Abrir WhatsApp
            </a>
          </div>
          <p style="margin-top: 24px; font-size: 12px; color: #999;">Alphamix Galpões · petrusweb.vercel.app</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
