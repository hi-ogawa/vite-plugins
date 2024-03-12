// Unocss vite integration requires managing `virtual:uno.css` both on main and rsc server.
// It can work, but it's a way more complicated than relying on
// filesystem based crawling only on main server, so we opted for this approach for now.
// As a reference, here is a previous commit where Vite integration is used
// https://github.com/hi-ogawa/vite-plugins/pull/172/commits/71f2e4b5828b0d70106c9f0752606b9e2de9a735

// https://unocss.dev/integrations/postcss
module.exports = {
  plugins: {
    "@unocss/postcss": {},
  },
};
