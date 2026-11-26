"""
Tải & tự lưu font cho dự án (thay next/font/google).

Lý do: từ 2026-11 Google Fonts trả một số file font dạng "/l/font?kit=..." (không đuôi), ngẫu nhiên theo lần tải
→ next/font/google lỗi build "Cannot read properties of null (reading '1')" cả local lẫn Vercel.

Nguồn: github.com/google/fonts (bản gốc, giấy phép OFL — file OFL.txt lưu kèm từng font).
Xử lý (fontTools): cắt còn Latin + tiếng Việt, font variable thì ghim trục phụ (wdth/opsz…) về mặc định
và giới hạn trục wght vào khoảng dùng tới, xuất woff2 vào src/fonts/<thư-mục>/.

Chạy:  python -m pip install --user fonttools brotli
       python scripts/fetch-fonts.py
Sau đó khai báo trong src/lib/fonts.ts bằng next/font/local (option phải là literal).
"""
import io
import json
import os
import sys
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.join(os.path.dirname(__file__), "..", "src", "fonts")
RAW = "https://raw.githubusercontent.com/google/fonts/main/ofl/{dir}/{file}"
API = "https://api.github.com/repos/google/fonts/contents/ofl/{dir}"

# Latin (Google "latin") + tiếng Việt (Google "vietnamese")
UNICODES = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0300-0301,U+0303-0304,U+0308-0309,"
    "U+0323,U+0329,U+2000-206F,U+20AB,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,"
    "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+1EA0-1EF9"
)

# thư mục trên google/fonts → (khoảng wght cần, các file tĩnh cần nếu không có bản variable)
FONTS = {
    "greatvibes": ((400, 400), ["GreatVibes-Regular.ttf"]),
    "playfairdisplay": ((400, 700), None),
    "bevietnampro": (None, ["BeVietnamPro-Light.ttf", "BeVietnamPro-Regular.ttf", "BeVietnamPro-Medium.ttf", "BeVietnamPro-SemiBold.ttf", "BeVietnamPro-Bold.ttf"]),
    "cormorantgaramond": ((300, 700), None),
    "dancingscript": ((400, 700), None),
    "alexbrush": (None, ["AlexBrush-Regular.ttf"]),
    "allura": (None, ["Allura-Regular.ttf"]),
    "pinyonscript": (None, ["PinyonScript-Regular.ttf"]),
    "imperialscript": (None, ["ImperialScript-Regular.ttf"]),
    "corinthia": (None, ["Corinthia-Regular.ttf", "Corinthia-Bold.ttf"]),
    "charm": (None, ["Charm-Regular.ttf", "Charm-Bold.ttf"]),
    "lora": ((400, 700), None),
    "notoserif": ((400, 700), None),
    "ebgaramond": ((400, 800), None),
    "prata": (None, ["Prata-Regular.ttf"]),
    "montserrat": ((300, 700), None),
    "quicksand": ((300, 700), None),
}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "font-fetch-script"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def process(src: str, dst: str, wght):
    f = TTFont(src)
    if "fvar" in f:
        limits = {}
        for ax in f["fvar"].axes:
            if ax.axisTag == "wght" and wght:
                limits["wght"] = (max(ax.minValue, wght[0]), min(ax.maxValue, wght[1]))
            elif ax.axisTag != "wght":
                limits[ax.axisTag] = ax.defaultValue  # ghim trục phụ
        f = instancer.instantiateVariableFont(f, limits)
        # lưu rồi mở lại: subset trên font vừa instancer (gvar lazy) dễ lỗi KeyError glyph
        buf = io.BytesIO()
        f.save(buf)
        buf.seek(0)
        f = TTFont(buf, lazy=False)
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.flavor = "woff2"
    opts.name_IDs = ["*"]
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(UNICODES))
    sub.subset(f)
    f.flavor = "woff2"
    f.save(dst)


def main():
    only = set(sys.argv[1:])
    os.makedirs(ROOT, exist_ok=True)
    tmp = os.path.join(ROOT, "_tmp")
    os.makedirs(tmp, exist_ok=True)
    for d, (wght, statics) in FONTS.items():
        if only and d not in only:
            continue
        out = os.path.join(ROOT, d)
        os.makedirs(out, exist_ok=True)
        listing = [e["name"] for e in json.loads(get(API.format(dir=d)))]
        files = [n for n in listing if n.endswith(".ttf") and "[" in n] if statics is None else statics
        if not files:
            raise SystemExit(f"{d}: không thấy file font (có: {listing})")
        for name in files:
            raw = os.path.join(tmp, name)
            with open(raw, "wb") as fh:
                fh.write(get(RAW.format(dir=d, file=urllib.request.quote(name))))
            base = name.replace(".ttf", "").replace("[", "-").replace("]", "").replace(",", "-")
            dst = os.path.join(out, base + ".woff2")
            process(raw, dst, wght)
            print(f"{d}/{base}.woff2  {os.path.getsize(dst) // 1024} KB")
            os.remove(raw)
        with open(os.path.join(out, "OFL.txt"), "wb") as fh:
            fh.write(get(RAW.format(dir=d, file="OFL.txt")))
    os.rmdir(tmp)


if __name__ == "__main__":
    main()
