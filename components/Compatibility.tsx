const devices = [
  "Hamilton C1",
  "Hamilton C3",
  "Hamilton G5",
  "Mindray SV300",
  "Mindray SV600",
  "GE Carestation",
  "Dräger Perseus A500",
  "Dräger Fabius Plus",
  "Philips Respironics",
  "Puritan Bennett 980",
];

export default function Compatibility() {
  return (
    <section
      id="compatibility"
      className="max-w-7xl mx-auto px-8 py-20"
    >
      <h2 className="text-3xl font-bold mb-8">
        Совместимость
      </h2>

      <p className="text-gray-600 mb-8">
        FS510 совместим со стандартными дыхательными контурами и большинством
        современных аппаратов ИВЛ и наркозно-дыхательной аппаратуры.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div
            key={device}
            className="bg-white border rounded-xl p-5 shadow-sm"
          >
            ✅ {device}
          </div>
        ))}
      </div>
    </section>
  );
}