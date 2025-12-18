import { Github, Twitter } from 'lucide-react';

interface FooterProps {
  githubUrl?: string;
  twitterUrl?: string;
}

export function Footer({
  githubUrl = 'https://github.com/umutterol/HoradricAbacus',
  twitterUrl = 'https://x.com/UmutTuncErol'
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-row">
          <p className="footer-copyright">
            © {currentYear} Horadric Abacus
          </p>
          <span className="footer-separator">·</span>
          <p className="footer-attribution">
            Built for the Diablo community
          </p>
          <span className="footer-separator">·</span>
          <div className="footer-links">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label="GitHub repository"
            >
              <Github size={16} />
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label="X profile"
            >
              <Twitter size={16} />
            </a>
          </div>
        </div>
        <p className="footer-disclaimer">
          Not affiliated with or endorsed by Blizzard Entertainment
        </p>
      </div>

      <style>{`
        .footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid var(--color-border-subtle);
          background: linear-gradient(180deg, transparent 0%, rgba(8, 7, 10, 0.5) 100%);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-separator {
          color: var(--color-border);
          font-size: 0.875rem;
        }

        .footer-copyright {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .footer-attribution {
          margin: 0;
          color: var(--color-gold);
          font-family: var(--font-display);
          font-size: 0.875rem;
        }

        .footer-links {
          display: flex;
          gap: 0.375rem;
        }

        .footer-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          background: rgba(0, 0, 0, 0.3);
          transition: all 0.2s;
        }

        .footer-link:hover {
          color: var(--color-gold);
          border-color: var(--color-gold);
        }

        .footer-disclaimer {
          margin: 0;
          color: var(--color-text-muted);
          font-size: 0.75rem;
          opacity: 0.7;
        }

        @media (max-width: 640px) {
          .footer {
            padding: 1rem;
          }

          .footer-copyright,
          .footer-attribution {
            font-size: 0.8125rem;
          }

          .footer-disclaimer {
            font-size: 0.6875rem;
          }
        }
      `}</style>
    </footer>
  );
}
