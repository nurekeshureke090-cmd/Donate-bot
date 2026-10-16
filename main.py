import os
import asyncio
import logging
from datetime import datetime
from aiogram import Bot, Dispatcher, types, F, Router
from aiogram.filters import CommandStart, Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.enums import ParseMode
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# 1. Sozlamalarni yuklash
load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')
MONGO_URL = os.getenv('MONGO_URL')
ADMIN_ID = int(os.getenv('ADMIN_ID', 0))  # .env faylga o'z Telegram ID'ngizni yozing

# 2. Logging sozlamalari (Xatolarni ko'rish uchun)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# 3. Bot va Dispatcher yaratish
bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()
router = Router()
dp.include_router(router)

# 4. MongoDB ulanish
try:
    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    # Ulanishni tekshirish
    asyncio.get_event_loop().run_until_complete(client.admin.command('ping'))
    logger.info("✅ MongoDB ga muvaffaqiyatli ulandi!")
except Exception as e:
    logger.error(f"❌ MongoDB ga ulanishda xatolik: {e}")

db = client['payersub']
users_collection = db['users']
orders_collection = db['orders']

# Vaqtinchalik Mini App URL (Vercel'dan olgan linkingizni shu yerga qo'yasiz)
WEBAPP_URL = "https://payersub-bot.vercel.app" 


# ================= HANDLERS (Buyruqlar) =================

@router.message(CommandStart())
async def cmd_start(message: types.Message):
    """Botni ishga tushirish va foydalanuvchini bazaga yozish"""
    user_id = message.from_user.id
    username = message.from_user.username or "Noma'lum"
    first_name = message.from_user.first_name or "Foydalanuvchi"
    
    try:
        # Bazaga saqlash yoki yangilash
        await users_collection.update_one(
            {'telegram_id': user_id},
            {
                '$set': {'username': username, 'first_name': first_name, 'last_seen': datetime.now()},
                '$setOnInsert': {'balance': 0, 'created_at': datetime.now()}
            },
            upsert=True
        )
        logger.info(f"Yangi foydalanuvchi: {first_name} (ID: {user_id})")
    except Exception as e:
        logger.error(f" Bazaga yozishda xatolik: {e}")

    # Asosiy menyu tugmalari
    keyboard = types.ReplyKeyboardMarkup(
        keyboard=[
            [types.KeyboardButton(text="🎮 O'yinlarni ochish", web_app=WebAppInfo(url=WEBAPP_URL))],
            [types.KeyboardButton(text="💰 Mening balansim"), types.KeyboardButton(text="👤 Profilim")]
        ],
        resize_keyboard=True,
        input_field_placeholder="Menyudan birini tanlang..."
    )
    
    await message.answer(
        f"Salom, <b>{first_name}</b>! 👋\n\n"
        f"✅ <b>PayerSub</b> botiga xush kelibsiz!\n"
        f"Eng arzon va tez o'yin valyutalarini sotib olish uchun pastdagi <b>🎮 O'yinlarni ochish</b> tugmasini bosing.",
        reply_markup=keyboard
    )


@router.message(F.text == "💰 Mening balansim")
async def show_balance(message: types.Message):
    """Foydalanuvchi balansini ko'rsatish"""
    user = await users_collection.find_one({'telegram_id': message.from_user.id})
    balance = user.get('balance', 0) if user else 0
    
    # Balans to'ldirish uchun inline tugma
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💳 Balansni to'ldirish (Tez orada)", callback_data="top_up_balance")]
    ])
    
    await message.answer(
        f"💰 <b>Sizning joriy balansingiz:</b>\n"
        f"━━━━━━━━━━━━━━\n"
        f"<b>{balance:,} so'm</b>\n"
        f"━━━━━━━━━━━━━━",
        reply_markup=keyboard
    )


@router.message(F.text == "👤 Profilim")
async def show_profile(message: types.Message):
    """Foydalanuvchi profilini ko'rsatish"""
    user = await users_collection.find_one({'telegram_id': message.from_user.id})
    if user:
        text = (
            f"👤 <b>Shaxsiy kabinet</b>\n\n"
            f"🆔 Telegram ID: <code>{message.from_user.id}</code>\n"
            f"👤 Ism: {user.get('first_name', 'Noma\'lum')}\n"
            f"📱 Username: @{user.get('username', 'Noma\'lum')}\n"
            f"💰 Balans: <b>{user.get('balance', 0):,} so'm</b>\n"
            f"📅 Ro'yxatdan o'tgan sana: {user.get('created_at', 'Noma'lum').strftime('%d.%m.%Y') if isinstance(user.get('created_at'), datetime) else 'Noma'lum'}"
        )
        await message.answer(text)
    else:
        await message.answer("❌ Xatolik yuz berdi. Iltimos, /start buyrug'ini qaytadan bosing.")


# ================= ADMIN BUYRUQLARI =================

@router.message(Command('addbalance'))
async def admin_add_balance(message: types.Message):
    """Admin uchun: Foydalanuvchiga balans qo'shish (Test uchun)"""
    if message.from_user.id != ADMIN_ID:
        await message.answer("🚫 Sizda bu buyruq uchun ruxsat yo'q!")
        return

    # Format: /addbalance USER_ID SUMMA
    args = message.text.split()
    if len(args) != 3:
        await message.answer("❌ Noto'g'ri format!\nTo'g'ri format: <code>/addbalance 123456789 50000</code>")
        return

    target_user_id = int(args[1])
    amount = int(args[2])

    try:
        result = await users_collection.update_one(
            {'telegram_id': target_user_id},
            {'$inc': {'balance': amount}},
            upsert=True # Agar yo'q bo'lsa, yangi yaratadi
        )
        
        await message.answer(f"✅ Muvaffaqiyatli! ID: <code>{target_user_id}</code> ga <b>{amount:,} so'm</b> qo'shildi.")
        
        # Foydalanuvchiga xabar yuborish (agar botni bloklamagan bo'lsa)
        try:
            await bot.send_message(target_user_id, f"🎉 Tabriklaymiz! Balansingizga <b>{amount:,} so'm</b> qo'shildi!")
        except:
            pass
            
    except Exception as e:
        logger.error(f"Balans qo'shishda xatolik: {e}")
        await message.answer("❌ Balans qo'shishda xatolik yuz berdi.")


# ================= CALLBACK QUERY (Mini App dan keladigan so'rovlar) =================

@router.callback_query(F.data == "top_up_balance")
async def process_top_up(callback: types.CallbackQuery):
    """Balans to'ldirish tugmasi bosilganda"""
    await callback.answer("⚠️ Click/Payme to'lov tizimi tez orada ulanadi!", show_alert=True)


# ================= BOTNI ISHGA TUSHIRISH =================

async def main():
    logger.info("🚀 PayerSub bot ishga tushmoqda...")
    # Bot o'chib qolmasligi uchun polling
    await dp.start_polling(bot)

if __name__ == '__main__':
    # Windows'da asyncio xatolik bermasligi uchun
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot to'xtatildi.")
