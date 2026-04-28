import MainMenu from "../components/main-menu";

export const metadata = {
  title: 'Main Menu',
};

export default function MainMenuPage() {
  return (
    <main className="min-h-screen bg-[#090b11] text-slate-100">
      <MainMenu />
    </main>
  );
}
