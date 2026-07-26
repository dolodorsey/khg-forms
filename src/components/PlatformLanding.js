export default function PlatformLanding({ slug, platform }) {
  const entries = Object.entries(platform.forms);
  const primary = entries.slice(0, 3);
  const additional = entries.slice(3);

  return (
    <main style={{ ...styles.page, '--accent': platform.accent }}>
      <section style={styles.shell}>
        <a href="/" style={styles.back}>KHG Enterprise Forms</a>
        <div style={{ ...styles.eyebrow, color: platform.accent }}>{platform.eyebrow}</div>
        <h1 style={styles.title}>{platform.headline}</h1>
        <p style={styles.description}>{platform.description}</p>

        <div style={styles.primaryGrid}>
          {primary.map(([formSlug, [label, description]]) => (
            <a key={formSlug} href={`/${slug}/${formSlug}`} style={{ ...styles.primaryCard, borderColor: `${platform.accent}44` }}>
              <span style={styles.cardLabel}>{label}</span>
              <small style={styles.cardCopy}>{description}</small>
              <strong style={{ ...styles.open, color: platform.accent }}>Open form →</strong>
            </a>
          ))}
        </div>

        {additional.length > 0 && (
          <div style={styles.additionalGrid}>
            {additional.map(([formSlug, [label]]) => (
              <a key={formSlug} href={`/${slug}/${formSlug}`} style={styles.additionalLink}>{label}</a>
            ))}
          </div>
        )}

        <p style={styles.disclaimer}>{platform.disclaimer}</p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '58px 20px 90px',
    background: 'radial-gradient(circle at 88% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 35%), #090909',
    color: '#fff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  shell: { width: 'min(1080px,100%)', margin: '0 auto' },
  back: { color: 'rgba(255,255,255,.45)', textDecoration: 'none', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' },
  eyebrow: { marginTop: 44, fontSize: 11, fontWeight: 900, letterSpacing: '.2em' },
  title: { maxWidth: 900, margin: '14px 0', fontFamily: 'Georgia, serif', fontSize: 'clamp(52px,9vw,104px)', lineHeight: .88, fontWeight: 400, letterSpacing: '-.065em' },
  description: { maxWidth: 760, margin: '0 0 36px', color: 'rgba(255,255,255,.66)', fontSize: 17, lineHeight: 1.7 },
  primaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16 },
  primaryCard: { minHeight: 220, padding: 24, display: 'flex', flexDirection: 'column', border: '1px solid', borderRadius: 21, background: 'rgba(18,18,18,.92)', color: '#fff', textDecoration: 'none', boxShadow: '0 24px 70px rgba(0,0,0,.3)' },
  cardLabel: { fontSize: 24, fontWeight: 900, letterSpacing: '-.035em' },
  cardCopy: { marginTop: 12, color: 'rgba(255,255,255,.57)', fontSize: 13, lineHeight: 1.6 },
  open: { marginTop: 'auto', fontSize: 13 },
  additionalGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 10, marginTop: 18 },
  additionalLink: { padding: '14px 12px', border: '1px solid rgba(255,255,255,.1)', borderRadius: 11, background: 'rgba(255,255,255,.035)', color: 'rgba(255,255,255,.82)', textDecoration: 'none', fontSize: 12, fontWeight: 800, textAlign: 'center' },
  disclaimer: { maxWidth: 850, margin: '30px 0 0', color: 'rgba(255,255,255,.38)', fontSize: 11, lineHeight: 1.65 },
};
