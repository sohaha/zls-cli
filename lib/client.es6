require('eventsource-polyfill');
var hotClient = require('webpack-hot-middleware/client?timeout=3000&reload=true&quiet=false');

// hotClient.subscribe(event => {
//   if (event.action === 'reload') {
//     window.location.reload()
//   }
// })
