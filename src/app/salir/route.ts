import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export async function GET(peticion: Request) {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/entrar?error=salida", peticion.url));
}
