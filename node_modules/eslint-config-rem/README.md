# ESLint config for 🌟rem🌟

<img src="./media/rem.gif" alt="rem" width="400">

This config is supposed to work with [XO](https://github.com/sindresorhus/xo) or [eslint-config-xo](https://github.com/sindresorhus/eslint-config-xo).

## Features

- Indent with 2 spaces and no semicolon
- ...some tweaks for my preference.

## Install

```bash
$ npm install -D eslint eslint-config-rem
```

## Usage

In ESLint:

```js
{
  "extends": ["xo/esnext", "rem"]
}
```

Or in XO:

```js
{
  "xo": {
    "extends": "rem"
  }
}
```

**Use Prettier:**

```js
{
  "xo": {
    "extends": "rem/prettier"
  }
}
```

## Rules

This config is a fork of eslint-config-xo but with: `2 spaces indention` and `no semicolon` and more.