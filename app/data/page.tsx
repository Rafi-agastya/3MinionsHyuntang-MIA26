import DataTerbukaPage from "@/app/data-terbuka/page";

export const metadata = {
  title: "Data Terbuka (CSV/JSON) & Verifikasi Hash | AKAR Transparansi Desa",
  description:
    "Katalog dataset terbuka APBDes TA 2026 dan alat mandiri verifikasi rantai integritas SHA-256.",
};

export default function DataPage() {
  return <DataTerbukaPage />;
}

