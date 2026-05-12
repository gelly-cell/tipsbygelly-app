import './globals.css';

export const metadata = {
  title: 'Tips by Gelly',
  description: 'Caderno de mesas',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tips by Gelly" />
        <meta name="theme-color" content="#DCDACE" />
      </head>
      <body>{children}</body>
    </html>
  );
}
