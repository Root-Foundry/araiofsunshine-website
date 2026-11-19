import type { BlogConfig } from './types';

// The blog's stylesheet, inlined into every page so neither adapter has to
// find and serve a separate CSS file. Colors and fonts come from the config.
export function blogStyles(config: BlogConfig): string {
  const { colors, fonts } = config.brand;
  return `
:root{--blog-bg:${colors.background};--blog-surface:${colors.surface};--blog-text:${colors.text};--blog-muted:${colors.muted};--blog-accent:${colors.accent};--blog-accent-text:${colors.accentText};--blog-border:${colors.border};--blog-font-body:${fonts.body};--blog-font-heading:${fonts.heading}}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--blog-bg);color:var(--blog-text);font-family:var(--blog-font-body);font-size:17px;line-height:1.7}
img{max-width:100%;height:auto}
a{color:var(--blog-accent)}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--blog-accent);outline-offset:3px}
.blog-skip{position:absolute;left:-9999px}
.blog-skip:focus{left:16px;top:16px;z-index:100;background:var(--blog-accent);color:var(--blog-accent-text);padding:8px 14px;border-radius:8px}
.blog-main{max-width:1120px;margin:0 auto;padding:48px 16px 80px}
.blog-narrow{max-width:760px;margin:0 auto}
.blog-eyebrow{font-size:.75rem;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--blog-accent);margin:0}
.blog-main h1,.blog-main h2,.blog-main h3{font-family:var(--blog-font-heading);line-height:1.2;color:var(--blog-text)}
.blog-hero h1{font-size:clamp(2rem,5vw,3rem);margin:.4em 0 .3em;letter-spacing:-.01em}
.blog-hero p{color:var(--blog-muted);max-width:640px;margin:0}
.blog-list{list-style:none;padding:0;margin:40px 0 0;display:grid;gap:24px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.blog-card{background:var(--blog-surface);border:1px solid var(--blog-border);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;height:100%}
.blog-card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}
.blog-card-body{padding:22px;display:flex;flex-direction:column;gap:10px;flex:1}
.blog-card h2{font-size:1.25rem;margin:0}
.blog-card h2 a{color:var(--blog-text);text-decoration:none}
.blog-card h2 a:hover{color:var(--blog-accent)}
.blog-card p{margin:0;color:var(--blog-muted);font-size:.95rem}
.blog-meta{font-size:.85rem;color:var(--blog-muted)}
.blog-tags{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:0}
.blog-tags a{display:inline-block;font-size:.8rem;padding:3px 10px;border:1px solid var(--blog-border);border-radius:999px;color:var(--blog-muted);text-decoration:none}
.blog-tags a:hover{border-color:var(--blog-accent);color:var(--blog-accent)}
.blog-empty{margin-top:40px;color:var(--blog-muted)}
.blog-pagination{display:flex;justify-content:space-between;gap:16px;margin-top:48px}
.blog-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;padding:12px 22px;font-weight:700;font-size:.95rem;text-decoration:none;background:var(--blog-accent);color:var(--blog-accent-text)}
.blog-btn:hover{filter:brightness(1.1)}
.blog-btn-outline{background:transparent;color:var(--blog-text);border:1.5px solid var(--blog-border)}
.blog-btn-outline:hover{border-color:var(--blog-accent);color:var(--blog-accent);filter:none}
.blog-article header{margin-bottom:32px}
.blog-article h1{font-size:clamp(2rem,5vw,2.75rem);margin:.3em 0}
.blog-cover{display:block;width:100%;border-radius:18px;margin:8px 0 36px;aspect-ratio:16/9;object-fit:cover}
.blog-body{font-size:1.06rem}
.blog-body h2{font-size:1.6rem;margin:2em 0 .6em}
.blog-body h3{font-size:1.25rem;margin:1.6em 0 .5em}
.blog-body p,.blog-body ul,.blog-body ol{margin:0 0 1.2em}
.blog-body li{margin:.3em 0}
.blog-body img{border-radius:12px;margin:1em 0}
.blog-body blockquote{margin:1.5em 0;padding:4px 0 4px 20px;border-left:4px solid var(--blog-accent);color:var(--blog-muted)}
.blog-body code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em;background:var(--blog-surface);border:1px solid var(--blog-border);border-radius:6px;padding:1px 6px}
.blog-body pre{background:var(--blog-surface);border:1px solid var(--blog-border);border-radius:12px;padding:16px;overflow-x:auto}
.blog-body pre code{border:0;padding:0;background:none}
.blog-body table{width:100%;border-collapse:collapse;margin:1.5em 0;display:block;overflow-x:auto}
.blog-body th,.blog-body td{border:1px solid var(--blog-border);padding:8px 12px;text-align:left}
.blog-body hr{border:0;border-top:1px solid var(--blog-border);margin:2.5em 0}
.blog-cta{margin-top:56px;padding:32px;border-radius:18px;background:var(--blog-surface);border:1px solid var(--blog-border)}
.blog-cta h2{margin:0 0 8px;font-size:1.5rem}
.blog-cta p{margin:0 0 20px;color:var(--blog-muted)}
.blog-back{display:inline-block;margin-top:40px}
.blog-404{text-align:center;padding:40px 0}
.blog-404 h1{font-size:clamp(2rem,6vw,3.5rem);margin:.2em 0}
.blog-404 p{color:var(--blog-muted);margin:0 auto 28px;max-width:520px}
@media (max-width:640px){body{font-size:16px}.blog-main{padding-top:32px}.blog-cta{padding:24px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
${config.brand.extraCss ?? ''}`;
}
