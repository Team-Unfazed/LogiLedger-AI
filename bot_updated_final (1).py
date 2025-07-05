import os
import logging
import asyncio
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)
import google.generativeai as genai
import easyocr
import pandas as pd
from PIL import Image
import re
import json
from pdf2image import convert_from_path

# Load environment variables
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)

# Prompt template
INSTRUCTION = (
    "You are a helpful assistant who replies in the same language as the user's question. "
    "Keep your replies clear, natural, and friendly — just like a real human. "
    "Avoid robotic or overly formal tone. Keep answers short and easy to understand."
)

user_preferences = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("👋 Hello! Upload an invoice (image or PDF) and set output format using /format excel|json|text.")

async def set_format(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.message.chat_id
    if context.args and context.args[0].lower() in ['excel', 'json', 'text']:
        user_preferences[chat_id] = context.args[0].lower()
        await update.message.reply_text(f"✅ Output format set to *{context.args[0].lower()}*", parse_mode='Markdown')
    else:
        await update.message.reply_text("❌ Invalid format. Use `/format excel`, `/format json`, or `/format text`.", parse_mode='Markdown')

def parse_invoice_text(text):
    invoice_no = re.search(r'Invoice\s*(?:Number|No)?[:\s]*([\w/-]+)', text, re.IGNORECASE)
    issued_to = re.search(r'Issued to[:\s]*(.+)', text, re.IGNORECASE)
    due_date = re.search(r'Due date[:\s]*([\d/\-]+)', text, re.IGNORECASE)
    subtotal = re.search(r'Subtotal[:\s]*([\d,.]+)', text, re.IGNORECASE)
    gst = re.search(r'GST.*?(\d{1,2}\.?\d*)%.*?([\d,.]+)', text, re.IGNORECASE)
    total = re.search(r'Total[:\s]*₹?\$?([\d,.]+)', text, re.IGNORECASE)
    signed_by = re.search(r'Signed by[:\s]*(.+)', text, re.IGNORECASE)

    items = []
    item_lines = re.findall(r'([\w\s]+)\n(\d+)\n([\d,.]+)\n([\d,.]+)', text)
    for desc, qty, unit_price, amount in item_lines:
        items.append({
            'Item Description': desc.strip(),
            'Qty': qty,
            'Price': unit_price,
            'Subtotal': amount
        })
    if not items:
        items.append({'Item Description': text.strip(), 'Qty': '', 'Price': '', 'Subtotal': ''})

    rows = []
    for item in items:
        rows.append({
            'Invoice Number': invoice_no.group(1) if invoice_no else '',
            'Issued To': issued_to.group(1) if issued_to else '',
            'Due Date': due_date.group(1) if due_date else '',
            'Item Description': item['Item Description'],
            'Qty': item['Qty'],
            'Price': item['Price'],
            'Subtotal': item['Subtotal'],
            'Total': total.group(1) if total else '',
            'GST %': gst.group(1) if gst else '',
            'GST Amount': gst.group(2) if gst else '',
            'Signed By': signed_by.group(1) if signed_by else ''
        })
    return rows

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.message.chat_id
    format_pref = user_preferences.get(chat_id, 'excel')

    if update.message.photo:
        file = await context.bot.get_file(update.message.photo[-1].file_id)
        file_id = update.message.photo[-1].file_id
        file_path = f"temp_{file_id}.jpg"
    elif update.message.document and update.message.document.mime_type.startswith('image/'):
        file = await context.bot.get_file(update.message.document.file_id)
        file_id = update.message.document.file_id
        file_path = f"temp_{file_id}.jpg"
    else:
        await update.message.reply_text("❌ Unsupported image format.")
        return

    await file.download_to_drive(file_path)

    reader = easyocr.Reader(['en'])
    result = reader.readtext(file_path, detail=0)
    text = '\n'.join(result)
    os.remove(file_path)

    rows = parse_invoice_text(text)
    df = pd.DataFrame(rows)

    if format_pref == 'excel':
        output_file = f"output_{file_id}.xlsx"
        df.to_excel(output_file, index=False)
    elif format_pref == 'json':
        output_file = f"output_{file_id}.json"
        with open(output_file, 'w') as f:
            json.dump(rows, f, indent=2)
    else:
        await update.message.reply_text(text[:4096])
        return

    await update.message.reply_document(document=open(output_file, 'rb'))
    os.remove(output_file)

async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    doc = update.message.document
    chat_id = update.message.chat_id
    format_pref = user_preferences.get(chat_id, 'excel')
    file_path = f"temp_{doc.file_id}_{doc.file_name}"

    await update.message.reply_text("📥 Downloading file...")
    file = await context.bot.get_file(doc.file_id)
    await file.download_to_drive(file_path)

    reader = easyocr.Reader(['en'])
    extracted_text = ""

    try:
        if file_path.lower().endswith('.pdf'):
            pages = convert_from_path(file_path)
            for i, page in enumerate(pages):
                img_path = f"{file_path}_page_{i}.jpg"
                page.save(img_path, 'JPEG')
                result = reader.readtext(img_path, detail=0)
                extracted_text += '\n'.join(result) + '\n'
                os.remove(img_path)
        else:
            result = reader.readtext(file_path, detail=0)
            extracted_text = '\n'.join(result)
    except Exception as e:
        await update.message.reply_text(f"❌ OCR failed: {e}")
        return
    finally:
        os.remove(file_path)

    rows = parse_invoice_text(extracted_text)
    df = pd.DataFrame(rows)

    if format_pref == 'excel':
        output_file = f"output_{doc.file_unique_id}.xlsx"
        df.to_excel(output_file, index=False)
    elif format_pref == 'json':
        output_file = f"output_{doc.file_unique_id}.json"
        with open(output_file, 'w') as f:
            json.dump(rows, f, indent=2)
    else:
        await update.message.reply_text(extracted_text[:4096])
        return

    await update.message.reply_document(document=open(output_file, 'rb'))
    os.remove(output_file)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_input = update.message.text
    try:
        prompt = INSTRUCTION + "\n\n" + user_input
        response = model.generate_content(prompt)
        reply = response.text.strip()
        await update.message.reply_text(reply)
    except Exception as e:
        await update.message.reply_text("❌ Sorry, something went wrong.")

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logging.error(msg="Exception while handling an update:", exc_info=context.error)
    if isinstance(update, Update) and update.message:
        await update.message.reply_text("⚠️ An unexpected error occurred.")

def main():
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("format", set_format))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.Document.IMAGE, handle_photo))
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_error_handler(error_handler)
    print("🤖 Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
