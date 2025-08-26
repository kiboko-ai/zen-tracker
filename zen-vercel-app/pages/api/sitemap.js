export default function handler(req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/xml')
  
  // Customize this with your domain
  const baseUrl = 'https://zen-tracker.vercel.app'
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
    </urlset>`
  
  res.end(sitemap)
}