/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://trainingapp-psi.vercel.app", // ←あなたの公開URL
  generateRobotsTxt: true,                       // robots.txt も自動生成
  exclude: ["/api/*"],                           // API など除外したいパスがあれば
  changefreq: "weekly",
  priority: 0.7,
};
