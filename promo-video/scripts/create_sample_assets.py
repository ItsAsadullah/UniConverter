import os
import zipfile
from PIL import Image, ImageDraw, ImageFont

OUT = r"d:\TechHat website\Bijoy Converter\promo-video\sample-assets"
os.makedirs(OUT, exist_ok=True)

def load_font(size, bold=False):
    paths = [
        r"d:\TechHat website\Bijoy Converter\public\fonts\dm-sans-700.ttf" if bold else r"d:\TechHat website\Bijoy Converter\public\fonts\inter-400.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

# 1. Sample NID Front & Back (realistic ID card look on a desk surface)
def make_nid_front():
    img = Image.new("RGB", (900, 580), (226, 232, 240))
    d = ImageDraw.Draw(img)
    # Card body
    d.rounded_rectangle([40, 35, 860, 545], radius=28, fill=(248, 250, 252), outline=(148, 163, 184), width=4)
    # Top header banner
    d.rounded_rectangle([44, 39, 856, 135], radius=24, fill=(15, 118, 110))
    d.rectangle([44, 100, 856, 135], fill=(15, 118, 110))
    d.text((75, 55), "GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH", fill=(255, 255, 255), font=load_font(20, True))
    d.text((75, 88), "NATIONAL ID CARD  |  SMART NID SPECIMEN", fill=(167, 243, 208), font=load_font(18, True))
    # Photo box on left
    d.rounded_rectangle([75, 165, 265, 415], radius=16, fill=(203, 213, 225), outline=(100, 116, 139), width=3)
    # Avatar silhouette
    d.ellipse([125, 195, 215, 285], fill=(71, 85, 105))
    d.rounded_rectangle([95, 295, 245, 405], radius=40, fill=(71, 85, 105))
    # Chip on right
    d.rounded_rectangle([720, 175, 825, 255], radius=12, fill=(245, 158, 11), outline=(180, 83, 9), width=3)
    d.line([720, 215, 825, 215], fill=(180, 83, 9), width=2)
    d.line([772, 175, 772, 255], fill=(180, 83, 9), width=2)
    # Details
    d.text((300, 175), "Name: TANVIR AHMED CHOWDHURY", fill=(15, 23, 42), font=load_font(26, True))
    d.text((300, 225), "Father: Mahmudul Hasan Chowdhury", fill=(51, 65, 85), font=load_font(20))
    d.text((300, 265), "Mother: Farhana Yasmin", fill=(51, 65, 85), font=load_font(20))
    d.text((300, 315), "Date of Birth: 15 Jan 1998", fill=(220, 38, 38), font=load_font(22, True))
    d.text((300, 365), "NID No: 482 910 3746", fill=(15, 118, 110), font=load_font(28, True))
    # Signature line
    d.text((75, 445), "Holder's Signature:  Tanvir Ahmed", fill=(30, 41, 59), font=load_font(20, True))
    img.save(os.path.join(OUT, "nid-front.png"))

def make_nid_back():
    img = Image.new("RGB", (900, 580), (226, 232, 240))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([40, 35, 860, 545], radius=28, fill=(248, 250, 252), outline=(148, 163, 184), width=4)
    # Barcode strip at top
    for x in range(75, 825, 9):
        w = 3 if (x // 9) % 3 == 0 else 6
        d.rectangle([x, 65, x + w, 145], fill=(15, 23, 42))
    d.text((75, 175), "Address: House #42, Road #7, Dhanmondi, Dhaka-1209", fill=(15, 23, 42), font=load_font(22, True))
    d.text((75, 220), "Blood Group: O+   |   Place of Birth: DHAKA", fill=(220, 38, 38), font=load_font(20, True))
    d.text((75, 265), "Issue Date: 08 Nov 2025", fill=(51, 65, 85), font=load_font(20))
    # MRZ zone
    d.rounded_rectangle([65, 365, 835, 510], radius=12, fill=(241, 245, 249), outline=(203, 213, 225), width=2)
    mrz_font = load_font(24, True)
    d.text((85, 382), "I<BGD4829103746<<<<<<<<<<<<<<<", fill=(30, 41, 59), font=mrz_font)
    d.text((85, 422), "9801158M3011084BGD<<<<<<<<<<<6", fill=(30, 41, 59), font=mrz_font)
    d.text((85, 462), "CHOWDHURY<<TANVIR<AHMED<<<<<<<", fill=(30, 41, 59), font=mrz_font)
    img.save(os.path.join(OUT, "nid-back.png"))

# 2. Sample Passport Spread (Top & Bottom pages for 6-point scanner)
def make_passport():
    img = Image.new("RGB", (900, 1200), (30, 41, 59))
    d = ImageDraw.Draw(img)
    # Top page
    d.rounded_rectangle([65, 55, 835, 585], radius=18, fill=(240, 249, 255), outline=(148, 163, 184), width=3)
    d.text((110, 95), "REPUBLIC OF BANGLADESH  -  E-PASSPORT", fill=(15, 118, 110), font=load_font(24, True))
    d.text((110, 145), "Emergency Contact & Observations Page", fill=(71, 85, 105), font=load_font(20))
    d.rounded_rectangle([110, 200, 790, 520], radius=12, outline=(186, 230, 253), width=2)
    d.text((140, 240), "Passport No: EB0948271", fill=(15, 23, 42), font=load_font(24, True))
    d.text((140, 290), "Valid Until: 07 NOV 2034", fill=(15, 23, 42), font=load_font(22))
    d.text((140, 340), "Issuing Authority: DIP DHAKA", fill=(15, 23, 42), font=load_font(22))
    # Center fold crease
    d.line([65, 598, 835, 598], fill=(100, 116, 139), width=6)
    # Bottom bio page
    d.rounded_rectangle([65, 605, 835, 1145], radius=18, fill=(248, 250, 252), outline=(148, 163, 184), width=3)
    d.text((100, 635), "PASSPORT  |  PEOPLE'S REPUBLIC OF BANGLADESH", fill=(15, 118, 110), font=load_font(22, True))
    d.rounded_rectangle([100, 685, 285, 935], radius=12, fill=(203, 213, 225), outline=(100, 116, 139), width=3)
    d.ellipse([145, 715, 240, 810], fill=(51, 65, 85))
    d.rounded_rectangle([120, 820, 265, 925], radius=36, fill=(51, 65, 85))
    d.text((315, 690), "Surname: CHOWDHURY", fill=(15, 23, 42), font=load_font(22, True))
    d.text((315, 730), "Given Name: TANVIR AHMED", fill=(15, 23, 42), font=load_font(22, True))
    d.text((315, 770), "Nationality: BANGLADESHI", fill=(51, 65, 85), font=load_font(20))
    d.text((315, 810), "Date of Birth: 15 JAN 1998", fill=(220, 38, 38), font=load_font(20, True))
    d.text((315, 850), "Personal No: 4829103746", fill=(15, 118, 110), font=load_font(20, True))
    d.text((100, 995), "P<BGDCHOWDHURY<<TANVIR<AHMED<<<<<<<<<<<<<<<<", fill=(30, 41, 59), font=load_font(22, True))
    d.text((100, 1040), "EB09482714BGD9801158M34110764829103746<<<<08", fill=(30, 41, 59), font=load_font(22, True))
    img.save(os.path.join(OUT, "passport-sample.png"))

# 3. Sample Document Page (for Document Scanner)
def make_document():
    img = Image.new("RGB", (900, 1200), (241, 245, 249))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([55, 50, 845, 1150], radius=12, fill=(255, 255, 255), outline=(203, 213, 225), width=3)
    d.rectangle([95, 95, 805, 185], fill=(37, 99, 235))
    d.text((125, 120), "TECHHAT STUDIO  -  OFFICIAL CERTIFICATE & DEED", fill=(255, 255, 255), font=load_font(24, True))
    d.text((100, 230), "Ref No: THS/2026/8841                           Date: 08 November 2026", fill=(15, 23, 42), font=load_font(20, True))
    lines = [
        "This is to certify that the attached project documentation and financial",
        "statements have been verified using TechHat Studio 2.0 Client-Side Engine.",
        "",
        "1. Adaptive Shadow Removal (Magic+ Pro Filter) applied cleanly.",
        "2. 4-Corner Perspective Rectification & Auto Deskew verified.",
        "3. Photoshop-Grade Retouch Toolbar (Spot Heal, Clone, Dodge/Burn).",
        "4. Multi-page PDF & High-Resolution Print Export Ready.",
    ]
    y = 300
    for ln in lines:
        d.text((100, y), ln, fill=(30, 41, 59), font=load_font(20))
        y += 42
    # Table inside document
    d.rectangle([100, 630, 800, 880], outline=(148, 163, 184), width=2)
    d.rectangle([100, 630, 800, 685], fill=(241, 245, 249), outline=(148, 163, 184), width=2)
    d.text((125, 645), "Description                                      Status             Score", fill=(15, 23, 42), font=load_font(20, True))
    d.text((125, 710), "Perspective Auto-Crop & Deskew                   Verified           100%", fill=(51, 65, 85), font=load_font(20))
    d.text((125, 765), "Magic+ Illumination Normalization                Verified           99.8%", fill=(51, 65, 85), font=load_font(20))
    d.text((125, 820), "300 DPI A4 Print Sheet Calibration               Ready              A+ Grade", fill=(15, 118, 110), font=load_font(20, True))
    # Official seal
    d.ellipse([610, 930, 770, 1090], outline=(37, 99, 235), width=5)
    d.text((642, 995), "APPROVED", fill=(37, 99, 235), font=load_font(20, True))
    img.save(os.path.join(OUT, "document-sample.png"))

# 4. Sample Logo / Emblem for Raster to Vector & Color Picker
def make_logo():
    img = Image.new("RGB", (600, 600), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([60, 60, 540, 540], radius=110, fill=(15, 23, 42))
    d.ellipse([130, 130, 470, 470], fill=(16, 185, 129))
    d.polygon([(300, 165), (430, 395), (170, 395)], fill=(255, 255, 255))
    d.ellipse([255, 275, 345, 365], fill=(37, 99, 235))
    img.save(os.path.join(OUT, "logo-sample.png"))

# 5. Sample Minimal Valid DOCX file
def make_docx(filename):
    path = os.path.join(OUT, filename)
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("[Content_Types].xml", '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>''')
        z.writestr("_rels/.rels", '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>''')
        z.writestr("word/document.xml", '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>আমার সোনার বাংলা, আমি তোমায় ভালোবাসি। TechHat Studio 2.0 অফিস ডকুমেন্ট কনভার্টার।</w:t></w:r></w:p>
  </w:body>
</w:document>''')

# 6. Sample Multi-page PDF using Pillow
def make_pdf(filename):
    pages = []
    for i in range(1, 5):
        p = Image.new("RGB", (600, 840), (255, 255, 255))
        d = ImageDraw.Draw(p)
        d.rectangle([40, 40, 560, 120], fill=(37, 99, 235) if i % 2 == 1 else (15, 118, 110))
        d.text((65, 65), f"TechHat Studio Official Report  -  Page {i} of 4", fill=(255, 255, 255), font=load_font(22, True))
        for row in range(6):
            y = 170 + row * 95
            d.rounded_rectangle([50, y, 550, y + 70], radius=10, fill=(241, 245, 249), outline=(203, 213, 225), width=2)
            d.text((75, y + 22), f"Section {i}.{row+1} — Financial & Technical Audit Summary", fill=(30, 41, 59), font=load_font(18))
        pages.append(p)
    pages[0].save(os.path.join(OUT, filename), "PDF", resolution=150.0, save_all=True, append_images=pages[1:])

make_nid_front()
make_nid_back()
make_passport()
make_document()
make_logo()
make_docx("বার্ষিক_প্রতিবেদন_২০২৬.docx")
make_docx("অফিস_বিজ্ঞপ্তি_ইউনিকোড.docx")
make_pdf("TechHat_Annual_Report_2026.pdf")
make_pdf("Financial_Summary_Annex.pdf")
print("Sample assets generated successfully in:", OUT)
