import { NextResponse } from "next/server";

const limits = {
  company: 160,
  name: 120,
  phone: 40,
  email: 160,
  message: 3000,
};

function readField(formData: FormData, field: keyof typeof limits) {
  return String(formData.get(field) || "")
    .trim()
    .slice(0, limits[field]);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > 100_000) {
    return NextResponse.json(
      { ok: false, error: "Запрос слишком большой." },
      { status: 413 }
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Не удалось прочитать форму." },
      { status: 400 }
    );
  }

  if (String(formData.get("website") || "")) {
    return NextResponse.json({ ok: true });
  }

  const lead = {
    id: crypto.randomUUID(),
    company: readField(formData, "company"),
    name: readField(formData, "name"),
    phone: readField(formData, "phone"),
    email: readField(formData, "email"),
    message: readField(formData, "message"),
    receivedAt: new Date().toISOString(),
  };

  if (!lead.company || !lead.name || !lead.message) {
    return NextResponse.json(
      { ok: false, error: "Заполните организацию, имя и описание задачи." },
      { status: 400 }
    );
  }

  if (!lead.phone && !lead.email) {
    return NextResponse.json(
      { ok: false, error: "Укажите телефон или email для ответа." },
      { status: 400 }
    );
  }

  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return NextResponse.json(
      { ok: false, error: "Проверьте адрес электронной почты." },
      { status: 400 }
    );
  }

  const webhookUrl = process.env.CYBERMEDICA_LEADS_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Приём заявок ещё не подключён. Настройте CYBERMEDICA_LEADS_WEBHOOK_URL.",
      },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.CYBERMEDICA_LEADS_WEBHOOK_TOKEN
          ? {
              authorization: `Bearer ${process.env.CYBERMEDICA_LEADS_WEBHOOK_TOKEN}`,
            }
          : {}),
      },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Сервис заявок временно недоступен. Попробуйте немного позже.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, requestId: lead.id });
}
