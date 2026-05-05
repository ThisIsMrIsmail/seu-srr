import './globals.css';

export const metadata = {
  title: 'Student Search Interface',
  description:
    'Upload an Excel workbook, search student records instantly, and export updated selections.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}