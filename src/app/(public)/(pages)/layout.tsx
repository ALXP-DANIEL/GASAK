export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
      {children}
    </div>
  );
}
