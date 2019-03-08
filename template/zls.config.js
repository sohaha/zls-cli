module.exports = (options, defaultOpt, require) => {
  return {
    entry: 'src/index.js',
    dist: '<% if (electron) { %>app/dist<% } else { %>dist<% } %>',
    html: {
        title: '<%= name %>',
        template: 'template.html'
    },
    analyzer: false,
    openBrowser: true,
    <%_ if (electron) { -%>
    filename: {
        js: 'static/[name].js',
        css: 'static/[name].css',
        static: 'static/[name].[ext]'
    },
    <%_ } -%>
    webpack(cfg) {
        <% if (electron) { %>
        if (!options.dev) {
            cfg.output.publicPath = './';
        }
        cfg.target = 'electron-renderer';
        <% } %>
        return cfg;
    }
  };
};
