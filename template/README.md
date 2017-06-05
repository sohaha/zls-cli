# <%= name %>

## Depend package

- zls.init

## Folder structure

- `src/`: App files
  - `components/`: Components directory
  <%_ if (router) { -%>
  - `pages/`: view directory
  <%_ } -%>
  <%_ if (vuex) { -%>
  - `stores/`: stores directory
  <%_ } -%>
  - `index.js`: App entry file
<%_ if (electron) { -%>
- `app/`: Electron app files for main process
  - `index.js`: Electron app main process entry
<%_ } -%>
- `zls.config.js`: Config file for zls
- `package.json`: App manifest
- `.editorconfig`: Ensure consistent editor behaivor
- `.gitignore`: Ignore files we don't need to push

## Commands

- `yarn dev`: Run in development mode
- `yarn build`: Build in production mode
- `yarn lint`: Run eslint
<%_ if (electron) { -%>
- `yarn dist`: Distribute Electron app for mac/windows/linux
- `yarn dist:mac`: Distribute Electron app for mac
- `yarn dist:win`: Distribute Electron app for windows
- `yarn dist:linux`: Distribute Electron app for linux
<%_ } -%>


---
