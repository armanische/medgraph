import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const company = String(formData.get("company") || "");
  const name = String(formData.get("name") || "");
  const phone = String(formData.get("phone") || "");
  const email = String(formData.get("email") || "");
  const message = String(formData.get("message") || "");

  console.log("NEW REQUEST:", {
    company,
    name,
    phone,
    email,
    message,
  });

  const params = new URLSearchParams({
    company,
    name,
    phone,
    email,
    message,
  });

  return NextResponse.redirect(
    new URL(`/thanks?${params.toString()}`, request.url),
    303
  );
}