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

# Load environment variables
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print("TELEGRAM_BOT_TOKEN:", TELEGRAM_BOT_TOKEN)

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)

# Gemini Prompt Template
INSTRUCTION =(
    "You are a helpful assistant who replies in the same language as the user's question. "
    "Keep your replies clear, natural, and friendly — just like a real human. "
    "Avoid robotic or overly formal tone. Keep answers short and easy to understand."
)
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("👋 Hello! I’m your smart assistant powered by Gemini AI. Ask me anything!")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_input = update.message.text
    try:
        prompt = INSTRUCTION + "\n\n" + user_input  # ✅ define prompt
        response = model.generate_content(prompt)
        reply = response.text.strip()
        await update.message.reply_text(reply)

    except Exception as e:
        logging.error(f"Gemini Error: {e}")
        print("PROMPT SENT TO GEMINI:")
        print(prompt)
        await update.message.reply_text("❌ Sorry, I couldn't process that. Try again later.")


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logging.error(msg="Exception while handling an update:", exc_info=context.error)
    if isinstance(update, Update) and update.message:
        await update.message.reply_text("⚠️ An unexpected error occurred.")

def main():
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_error_handler(error_handler)

    print("🤖 Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    asyncio.run(main())
