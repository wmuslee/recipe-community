import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar/Navbar';

export const metadata = {
  title: 'Recipe Community — Share Your Culinary World',
  description: 'Discover, share and save amazing recipes. A social platform for food lovers.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
