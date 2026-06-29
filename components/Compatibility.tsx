export default function Compatibility() {
  const devices = [
    ["Hamilton C1", "✅"],
    ["Hamilton T1", "✅"],
    ["Hamilton C3", "✅"],
    ["Mindray SV300", "✅"],
    ["Mindray SV600", "✅"],
    ["Servo-i", "✅"],
    ["Servo-u", "✅"],
    ["Puritan Bennett 840", "✅"],
    ["Dräger Evita Infinity V500", "✅"],
    ["GE Carestation", "✅"],
  ];

  return (
    <section className="max-w-7xl mx-auto px-8 py-20">
      <h2 className="text-3xl font-bold mb-8">
        Совместимость
      </h2>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Аппарат ИВЛ</th>
              <th className="text-left p-4">Совместимость</th>
            </tr>
          </thead>

          <tbody>
            {devices.map(([name, ok]) => (
              <tr key={name} className="border-t">
                <td className="p-4">{name}</td>
                <td className="p-4 text-green-600 font-bold">{ok}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}