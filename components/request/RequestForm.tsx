"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RequestFormProps {
  initialMessage?: string;
}

export default function RequestForm({
  initialMessage = "",
}: RequestFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/request", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setError(
          result.error ||
            "Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами напрямую."
        );
        return;
      }

      router.push("/thanks");
    } catch {
      setError("Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  const fieldClassName =
    "cm-field text-[13px]";

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="cm-label mb-2 block">
          Организация <span className="text-cm-danger">*</span>
        </span>
        <input
          name="company"
          required
          maxLength={160}
          autoComplete="organization"
          placeholder="Название организации"
          className={fieldClassName}
        />
      </label>

      <label className="block">
        <span className="cm-label mb-2 block">
          Ваше имя <span className="text-cm-danger">*</span>
        </span>
        <input
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          placeholder="Имя и должность"
          className={fieldClassName}
        />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="cm-label mb-2 block">Телефон</span>
          <input
            name="phone"
            type="tel"
            maxLength={40}
            autoComplete="tel"
            placeholder="+7 999 000-00-00"
            className={fieldClassName}
          />
        </label>
        <label className="block">
          <span className="cm-label mb-2 block">Email</span>
          <input
            name="email"
            type="email"
            maxLength={160}
            autoComplete="email"
            placeholder="name@company.ru"
            className={fieldClassName}
          />
        </label>
      </div>

      <p className="-mt-2 text-[11px] text-cm-dim">
        Укажите телефон или email, чтобы мы могли ответить.
      </p>

      <label className="block">
        <span className="cm-label mb-2 block">
          Что нужно подобрать? <span className="text-cm-danger">*</span>
        </span>
        <textarea
          name="message"
          required
          maxLength={3000}
          defaultValue={initialMessage}
          placeholder="Изделие, количество, важные параметры или номер закупки"
          rows={6}
          className={fieldClassName}
        />
      </label>

      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-[var(--cm-danger-soft)] p-4 text-xs text-[var(--cm-danger)]"
        >
          {error}
        </div>
      )}

      <button
        disabled={pending}
        className="cm-button-primary w-full disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Отправляем…" : "Отправить запрос"}
      </button>

      <p className="text-center text-[10px] leading-5 text-cm-dim">
        Нажимая кнопку, вы соглашаетесь на обработку данных для ответа на
        запрос.
      </p>
    </form>
  );
}
