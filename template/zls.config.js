const path = require('path')

module.exports = (options, defaultOpt, require) => {
  return {
    entry: 'src/index.js',
    dist: '<% if (electron) { %>app/dist<% } else { %>dist<% } %>',
    html: {
        title: '<%= name %>',
        template: 'template.html'
    },
    promise: true,
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
        cfg.resolve.modules.push(path.resolve('src'))
        <% if (electron) { %>
        if (!options.dev) {
            cfg.output.publicPath = './'
        }
        cfg.target = 'electron-renderer'
        <% } %>
        return cfg
    }
  }
}