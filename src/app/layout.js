import './forms-ui.css';
export const metadata = {
  title: 'KHG — Apply',
  description: 'The Kollective Hospitality Group — Applications, Signups & Onboarding',
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#FAFAF8' }}>
        {children}
      </body>
    </html>
  );
}
