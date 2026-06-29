const docs = [
  {
    title: "Регистрационное удостоверение",
    description: "ФСЗ 2009/04992",
    button: "Скачать PDF",
  },
  {
    title: "Инструкция по эксплуатации",
    description: "Русский язык",
    button: "Скачать PDF",
  },
  {
    title: "Техническая спецификация",
    description: "FS510",
    button: "Скачать PDF",
  },
];

export default function Documents() {
  return (
    <section className="max-w-7xl mx-auto px-8 py-20">

      <h2 className="text-3xl font-bold mb-10">
        Документы
      </h2>

      <div className="grid md:grid-cols-3 gap-6">

        {docs.map((doc) => (

          <div
            key={doc.title}
            className="bg-white border rounded-2xl p-8 shadow-sm"
          >

            <h3 className="text-xl font-semibold">
              {doc.title}
            </h3>

            <p className="text-gray-500 mt-3">
              {doc.description}
            </p>

            <button className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition">

              {doc.button}

            </button>

          </div>

        ))}

      </div>

    </section>
  );
}