const items = [
  {
    title: "Регистрационные удостоверения",
    text: "Все регистрационные удостоверения, инструкции и документы в одном месте.",
  },
  {
    title: "Аналоги",
    text: "Быстрый подбор аналогов медицинских изделий.",
  },
  {
    title: "Совместимость",
    text: "Проверка совместимости изделий и оборудования.",
  },
  {
    title: "Тендерная аналитика",
    text: "История закупок, заказчики и цены.",
  },
  {
    title: "ИИ-помощник",
    text: "Ответы на технические вопросы по изделиям.",
  },
  {
    title: "Коммерческие предложения",
    text: "Получите коммерческое предложение за несколько минут.",
  },
];

export default function Advantages() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-8">

        <h2 className="text-5xl font-bold text-center">
          Почему CyberMedica
        </h2>

        <p className="text-center text-gray-500 mt-4 text-xl">
          Мы создаем инфраструктуру знаний для медицинского рынка.
        </p>

        <div className="grid lg:grid-cols-3 gap-8 mt-16">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100"
            >
              <h3 className="text-2xl font-bold">
                {item.title}
              </h3>

              <p className="mt-4 text-gray-600 leading-8">
                {item.text}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}