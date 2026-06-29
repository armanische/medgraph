export default function Search() {
  return (
    <section className="max-w-7xl mx-auto px-8 -mt-14 relative z-20">

      <div className="bg-white rounded-3xl shadow-2xl p-8">

        <h2 className="text-2xl font-bold">
          Что вы ищете?
        </h2>

        <p className="text-gray-500 mt-2">
          Найдите изделие, РУ, производителя, аналог или КТРУ
        </p>

        <input
          className="w-full mt-6 rounded-2xl border border-gray-300 p-5 text-lg"
          placeholder="Например: FS510, Ambu aScope, Hamilton C1..."
        />

      </div>

    </section>
  );
}