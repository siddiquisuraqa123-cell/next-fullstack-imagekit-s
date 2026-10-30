async function verify() {
  const res = await fetch('http://localhost:3005/blog/seo-pricing-for-interior-designers');
  console.log('Status:', res.status);
  const html = await res.text();
  
  // H1 check
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  console.log('H1 count:', h1Matches.length);
  if (h1Matches.length > 0) console.log('H1 content:', h1Matches[0].replace(/<[^>]+>/g, '').trim());

  // Title check
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  console.log('Title:', titleMatch ? titleMatch[1] : 'NONE');

  // Description check
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
  console.log('Meta Description:', descMatch ? descMatch[1] : 'NONE');

  // Canonical check
  const canonMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([\s\S]*?)["']/i);
  console.log('Canonical:', canonMatch ? canonMatch[1] : 'NONE');

  // JSON-LD check
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  console.log('JSON-LD script tags count:', jsonLdMatches.length);
  for (const j of jsonLdMatches) {
    const raw = j.replace(/<\/?script[^>]*>/gi, '');
    try {
      const parsed = JSON.parse(raw);
      if (parsed['@graph']) {
        console.log('JSON-LD @graph types:', parsed['@graph'].map(g => g['@type']));
      } else {
        console.log('JSON-LD @type:', parsed['@type']);
      }
    } catch(e) {
      console.error('Invalid JSON-LD:', e.message);
    }
  }

  // Placeholder check
  const placeholders = ['lorem ipsum', 'TODO', 'TBD', '[insert', 'placeholder'];
  const found = placeholders.filter(p => html.toLowerCase().includes(p.toLowerCase()));
  console.log('Placeholders found:', found);

  // Link status check of internal links on the page
  const internalLinks = Array.from(html.matchAll(/href=["'](\/[^"'#?]+)["']/g)).map(m => m[1]);
  const uniqueLinks = Array.from(new Set(internalLinks));
  console.log('Checking internal links (' + uniqueLinks.length + '):');
  for (const link of uniqueLinks) {
    try {
      const linkRes = await fetch(`http://localhost:3005${link}`);
      console.log(`  ${linkRes.status === 200 ? '✓ 200' : '❌ ' + linkRes.status} -> ${link}`);
    } catch (err) {
      console.log(`  ❌ ERR -> ${link}: ${err.message}`);
    }
  }

  // Sitemap check
  const sitemapRes = await fetch('http://localhost:3005/sitemap.xml');
  const sitemapXml = await sitemapRes.text();
  const inSitemap = sitemapXml.includes('/blog/seo-pricing-for-interior-designers');
  console.log('In sitemap.xml:', inSitemap);
}
verify();
