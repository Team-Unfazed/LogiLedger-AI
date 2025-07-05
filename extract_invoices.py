import os
import easyocr
import pandas as pd

# Folder containing images
IMAGE_FOLDER = 'invoices'  # Change as needed
# Output Excel file
OUTPUT_EXCEL = 'extracted_invoices.xlsx'

# Supported image extensions
IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']

def is_image_file(filename):
    return any(filename.lower().endswith(ext) for ext in IMAGE_EXTENSIONS)

def main():
    reader = easyocr.Reader(['en'])
    results = []

    if not os.path.exists(IMAGE_FOLDER):
        print(f"Folder '{IMAGE_FOLDER}' does not exist. Please create it and add images.")
        return

    for filename in os.listdir(IMAGE_FOLDER):
        if is_image_file(filename):
            image_path = os.path.join(IMAGE_FOLDER, filename)
            print(f"Processing {image_path}...")
            result = reader.readtext(image_path, detail=0)
            text = '\n'.join(result)
            results.append({'filename': filename, 'extracted_text': text})

    if results:
        df = pd.DataFrame(results)
        df.to_excel(OUTPUT_EXCEL, index=False)
        print(f"Extraction complete! Results saved to {OUTPUT_EXCEL}")
    else:
        print("No images found to process.")

if __name__ == "__main__":
    main() 