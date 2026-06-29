export default function Analogs() {
  const analogs = [
    {
      name: "FS500",
      manufacturer: "Alba Healthcare",
      filter: "Электростатический",
      vt: "50–1500 мл",
    },
    {
      name: "DAR Adult HMEF",
      manufacturer: "Medtronic",
      filter: "Электростатический",
      vt: "150–2000 мл",
    },
    {
      name: "Hygrobac S",
      manufacturer: "Mallinckrodt",
      filter: "Механический",
      vt: "150–2000 мл",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-8 py-20">
      <h2 className="text-3xl font-bold mb-8">
        Аналоги
      </h2>

      <table className="w-full bg-white rounded-xl overflow-hidden shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-4">Модель</th>
            <th className="text-left p-4">Производитель</th>
            <th className="text-left p-4">Фильтр</th>
            <th className="text-left p-4">VT</th>
          </tr>
        </thead>

        <tbody>
          {analogs.map((a) => (
            <tr key={a.name} className="border-t">
              <td className="p-4 font-semibold">{a.name}</td>
              <td className="p-4">{a.manufacturer}</td>
              <td className="p-4">{a.filter}</td>
              <td className="p-4">{a.vt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}