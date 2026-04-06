# 🤖 Hướng Dẫn Sử Dụng AI Doctor Chatbot

## 🔥 Recent Updates (2026-04-06)

### ✅ Fixed: Chatbot lặp lại câu hỏi về triệu chứng
**Vấn đề**: Khi user trả lời triệu chứng (VD: "khó thở", "đau đầu"), chatbot cứ hỏi lại mãi
**Giải pháp**: Khi đang hỏi `primaryConcern`, nếu user nói triệu chứng → tự động ACCEPT làm câu trả lời
**Kết quả**: Flow mượt mà, không lặp lại câu hỏi ✅

### ✅ Improved: Chatbot xử lý câu hỏi OFF_TOPIC thông minh như ChatGPT
**Trước**: Hỏi giới tính mà user trả lời "thời tiết thế nào" → chatbot từ chối hoặc bối rối
**Bây giờ**: Chatbot trả lời thông minh và chuyển hướng tự nhiên
**Ví dụ**:
```
👤 User: thời tiết hôm nay như thế nào
🤖 Bot: Hôm nay thời tiết ở Hà Nội đẹp, khoảng 25-28 độ C. 🌞
       Nhân tiện, để tôi có thể tư vấn sức khỏe tốt nhất cho bạn, 
       bạn vui lòng cho tôi biết giới tính của bạn nhé (Nam, Nữ hoặc Khác)?
```
**Kết quả**: Chatbot thông minh, không cứng nhắc, giống ChatGPT ✅

### ✅ Improved: Chatbot xử lý câu trả lời đùa với hài hước
**Trước**: User nhập "200 tuổi" → chatbot từ chối
**Bây giờ**: Chatbot trả lời với hài hước và hỏi lại
**Ví dụ**:
```
👤 User: 200 tuổi
🤖 Bot: Haha 200 tuổi thì bạn đã là 'cụ rùa' rồi! 😄 
       Chắc bạn đang đùa đúng không?
       Để tư vấn y tế phù hợp với độ tuổi, 
       bạn vui lòng cho tôi biết tuổi thực của bạn nhé?
```
**Kết quả**: Chatbot thân thiện, có personality ✅

### ✅ Added: Multilingual Support (English)
**Tính năng**: Chatbot tự động phát hiện ngôn ngữ (Vietnamese/English)
**Cách dùng**: User có thể nói tiếng Anh, chatbot sẽ trả lời bằng tiếng Anh
**Ví dụ**:
```
👤 User: Male
🤖 Bot: Got it, you are male. How old are you?

👤 User: I am 25 years old
🤖 Bot: Thank you, you are 25 years old. Where would you like to get treatment?
```
**Kết quả**: Support cả tiếng Việt và tiếng Anh ✅

---

## 🚀 Quick Start

### 1. Cài Đặt & Chạy Server

```bash
cd backend
npm install
node server.js
```

Server sẽ chạy tại: `http://localhost:3000`

### 2. Kiểm Tra Environment Variables

File `.env` cần có:
```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
GROQ_MODEL=llama-3.1-8b-instant
```

## 📱 API Endpoints

### Start Conversation
```bash
POST /api/ai-doctor/start
Content-Type: application/json

# Response:
{
  "success": true,
  "data": {
    "conversationId": "uuid-here",
    "message": "Chào bạn, tôi là Bác sĩ AI của BookingCare...",
    "followUp": true
  }
}
```

### Send Message
```bash
POST /api/ai-doctor/message
Content-Type: application/json

{
  "conversationId": "uuid-here",
  "message": "tôi hơi đau đầu"
}

# Response:
{
  "success": true,
  "data": {
    "message": "Tôi hiểu bạn đang bị đau đầu. Tôi sẽ ghi nhận...",
    "followUp": true,
    "state": {...},
    "intent": "SYMPTOM_MENTIONED"
  }
}
```

## 💬 Ví Dụ Cuộc Hội Thoại

### Ví Dụ 1: User nói triệu chứng ngay từ đầu

```
🤖 Bot: Đầu tiên, bạn vui lòng cho bác sĩ biết giới tính của bạn?
👤 User: tôi hơi đau đầu

🤖 Bot: Tôi hiểu bạn đang bị đau đầu. Tôi sẽ ghi nhận điều này để phân tích kỹ hơn. 
       Trước tiên, để tư vấn chính xác nhất, bạn vui lòng cho tôi biết giới tính 
       của bạn nhé (Nam, Nữ hoặc Khác)?

👤 User: Nam
🤖 Bot: Đã ghi nhận, bạn là nam giới. Bạn bao nhiêu tuổi?

👤 User: 25
🤖 Bot: Cảm ơn bạn, tuổi của bạn là 25. Bạn muốn khám ở khu vực nào?

... (tiếp tục hỏi location, symptoms, duration)

🤖 Bot: [Gợi ý chuyên khoa, bác sĩ, bệnh viện dựa trên database]
```

### Ví Dụ 2: User hỏi về giá

```
🤖 Bot: Đầu tiên, bạn vui lòng cho bác sĩ biết giới tính của bạn?
👤 User: tôi muốn hỏi giá khám có đắt không?

🤖 Bot: Tôi hiểu bạn quan tâm về chi phí. Giá khám thường dao động từ 
       150.000đ - 500.000đ tùy bác sĩ và chuyên khoa. Sau khi hiểu rõ 
       triệu chứng của bạn, tôi sẽ gợi ý các bác sĩ với mức giá phù hợp.

       Mục đích cuộc trò chuyện này là giúp bạn:
       ✅ Tìm bác sĩ phù hợp với triệu chứng
       ✅ Gợi ý chuyên khoa cần khám
       ✅ Tìm bệnh viện gần bạn

       Để tiếp tục, Đầu tiên, bạn vui lòng cho bác sĩ biết giới tính của bạn?
```

### Ví Dụ 3: Flow bình thường

```
🤖 Bot: Đầu tiên, bạn vui lòng cho bác sĩ biết giới tính của bạn?
👤 User: Nam

🤖 Bot: Đã ghi nhận, bạn là nam giới. Bạn bao nhiêu tuổi?
👤 User: 25

🤖 Bot: Cảm ơn bạn, tuổi của bạn là 25. Bạn muốn khám ở khu vực nào?
👤 User: TP. Hồ Chí Minh

🤖 Bot: Đã ghi nhận vị trí. Triệu chứng chính của bạn là gì?
👤 User: Đau đầu và chóng mặt

🤖 Bot: Tôi hiểu. Bạn bị triệu chứng này trong bao lâu rồi?
👤 User: 3 ngày

🤖 Bot: [Phân tích và gợi ý chuyên khoa, bác sĩ, bệnh viện từ database]
```

## 🧠 Chatbot Features

### ✅ Hiểu Ngữ Cảnh
- Nhận diện khi user nói về triệu chứng (dù đang hỏi câu khác)
- Phân biệt các loại câu hỏi: về giá, lịch khám, thông tin chung
- Phát hiện tình huống khẩn cấp

### ✅ Trả Lời Tự Nhiên
- Sử dụng LLM (GROQ) để tạo response như ChatGPT
- Empathetic và chuyên nghiệp
- Không cứng nhắc, không gán cứng

### ✅ Dữ Liệu Từ Database
- Tất cả gợi ý bác sĩ, bệnh viện, chuyên khoa từ DB
- Không hard-code
- Cập nhật real-time theo DB

### ✅ Xử Lý Lỗi Thông Minh
- Retry khi gặp rate limit (429)
- Fallback khi LLM không khả dụng
- Vẫn hoạt động được ngay cả khi LLM fail

## 🎯 Intent Types

| Intent | Mô Tả | Ví Dụ |
|--------|-------|-------|
| `ANSWER_QUESTION` | Trả lời đúng câu hỏi hiện tại | "Nam", "25 tuổi" |
| `SYMPTOM_MENTIONED` | Nói về triệu chứng sớm | "tôi hơi đau đầu" |
| `ASK_PRICE` | Hỏi về giá khám | "khám có đắt không?" |
| `ASK_SCHEDULE` | Hỏi về lịch khám | "khám được ngay không?" |
| `ASK_GENERAL` | Hỏi thông tin chung | "bệnh viện ở đâu?" |
| `EMERGENCY` | Tình huống khẩn cấp | "sốt 40 độ co giật" |
| `OFF_TOPIC` | Không liên quan y tế | "thời tiết hôm nay thế nào?" |

## 🔧 Configuration

### GROQ API Settings (trong .env)
```bash
# API Key từ https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Model options:
# - llama-3.1-8b-instant (nhanh, tiết kiệm token)
# - llama-3.1-70b-versatile (chính xác hơn, tốn token)
GROQ_MODEL=llama-3.1-8b-instant
```

### Rate Limits
- **Free Tier**: 6,000 tokens/phút
- **Retry Logic**: Tự động retry với exponential backoff (2s, 4s, max 10s)
- **Max Retries**: 2 lần

## 🐛 Troubleshooting

### Lỗi: "GROQ_API_KEY not configured"
```bash
# Kiểm tra file .env có tồn tại không
ls -la backend/.env

# Kiểm tra GROQ_API_KEY có giá trị không
cat backend/.env | grep GROQ_API_KEY

# Restart server sau khi cập nhật .env
```

### Lỗi: Rate Limit (429)
```
❌ GROQ API error: rate_limit_exceeded
⏳ Rate limit hit, waiting 2000ms before retry...
```
→ Chatbot sẽ tự động retry. Nếu vẫn fail, sẽ dùng fallback logic.

### Chatbot trả lời sai ngữ cảnh
→ Kiểm tra LLM có hoạt động không:
```bash
cd backend
node -e "require('dotenv').config(); console.log('API Key:', process.env.GROQ_API_KEY?.substring(0, 20) + '...');"
```

## 📊 Monitoring

### Logs để theo dõi:
```
✅ AI Doctor knowledge base sẵn sàng
✅ MySQL connected with pool ID: XX
💡 Intent detected: SYMPTOM_MENTIONED (confidence: 0.95)
⏳ Rate limit hit, waiting Xms before retry...
❌ GROQ API error: ...
```

## 🎉 Summary

**Chatbot hiện tại:**
- ✅ Trả lời mượt mà như ChatGPT
- ✅ Hiểu đúng ngữ cảnh (triệu chứng vs câu trả lời)
- ✅ Lấy dữ liệu từ database (không gán cứng)
- ✅ Xử lý rate limit tự động
- ✅ Empathetic và chuyên nghiệp
- ✅ Hoạt động ổn định với fallback

**Ready to use!** 🚀
