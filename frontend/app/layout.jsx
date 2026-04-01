import '../src/styles.css';

export const metadata = {
  title: 'Hostel Management Frontend',
  description: 'Next.js frontend for testing and customizing the hostel management system.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
