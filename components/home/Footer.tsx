export default function Footer() {
  return (
    <footer className="border-t bg-white py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-bold">
            Cyber<span className="text-blue-600">Medica</span>
          </div>

          <p className="mt-2 text-gray-500">
            Knowledge Platform для медицинских изделий.
          </p>
        </div>

        <div className="text-gray-500">
          © 2026 CyberMedica
        </div>
      </div>
    </footer>
  );
}