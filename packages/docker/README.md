# Local age API

Web page plus JSON API for [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/).

```sh
docker build -f packages/docker/Dockerfile -t hisab-age-calculator:local .
docker run --rm -p 8787:8787 hisab-age-calculator:local
```

`POST /api/v1/age` with `{"birth":"1990-05-15","asOf":"2026-11-08"}`.

Docker Hub already has `iamnazzal/hisab-age-calculator:1.0.0`. Do not push from this repository. That published tag clamps 29 February to 28 February. This source observes it on 1 March (`anniversaryRule` is `overflow-to-next-month`). Both are tabular civil Hijri, not Umm al-Qura.

## Links

- [حساب العمر بالهجري والميلادي](https://hisabaleumr.com/)
- Privacy: [سياسة الخصوصية](https://hisabaleumr.com/سياسة-الخصوصية/)
- Contact: [اتصل بنا](https://hisabaleumr.com/اتصل-بنا/)

