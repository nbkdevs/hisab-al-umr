# hisab-age-calculator

JavaScript library and CLI for [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/).

```js
const { calculateAge } = require("hisab-age-calculator");
const result = calculateAge("1990-05-15", "gregorian", "2026-11-08");
```

```sh
node packages/npm/bin/cli.js --birth 1990-05-15 --as-of 2026-11-08
```

`package.json` `homepage` is `https://hisabaleumr.com/`. Tabular civil Hijri (Kuwaiti algorithm). A date can differ by ±1 day from crescent sighting and from Umm al-Qura. 29 February is observed on 1 March in a common year. This package is not published from this repository.

## Links

- [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/)
- Privacy: [سياسة الخصوصية](https://hisabaleumr.com/سياسة-الخصوصية/)
- Contact: [اتصل بنا](https://hisabaleumr.com/اتصل-بنا/)

