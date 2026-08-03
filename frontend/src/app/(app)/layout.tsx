import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { OrgProvider } from "@/lib/org-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrgProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </OrgProvider>
  );
}
