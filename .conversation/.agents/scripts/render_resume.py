import fitz
from pathlib import Path
pdf = fitz.open('attached_assets/Akshay_Suresh_Resume_1788368039566.pdf')
out = Path('.agents/outputs/resume_pages')
out.mkdir(parents=True, exist_ok=True)
for i, page in enumerate(pdf):
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    pix.save(out / f'page-{i+1}.png')
    print(f'rendered page {i+1}: {page.rect}')
print('pages=', len(pdf))
