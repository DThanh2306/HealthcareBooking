# 🤖 AI Doctor Chatbot - Setup Guide

## 📋 Tổng quan

Chatbot Bác sĩ AI của bạn đã được nâng cấp với **khả năng hiểu ngữ cảnh linh hoạt** sử dụng LLM (GROQ API).

### ✨ Tính năng mới:

✅ **Intent Detection** - Phát hiện ý định người dùng (hỏi giá, off-topic, emergency)  
✅ **Flexible Responses** - Trả lời tự nhiên, có empathy  
✅ **Emergency Detection** - Phát hiện tình huống khẩn cấp tự động  
✅ **Smart Extraction** - Trích xuất thông tin từ câu trả lời phức tạp  
✅ **Off-topic Handling** - Xử lý câu hỏi ngoài lề và redirect  

---

## 🚀 Cài đặt

### Bước 1: Lấy GROQ API Key (MIỄN PHÍ)

1. Truy cập: https://console.groq.com
2. Đăng ký tài khoản (miễn phí)
3. Vào **API Keys** → Create new API key
4. Copy API key (dạng: `gsk_xxxxxxxxxxxxx`)

### Bước 2: Cấu hình Backend

```bash
cd backend

# Copy file .env.example
cp .env.example .env

# Sửa file .env, thêm GROQ API key:
GROQ_API_KEY=gsk_your_actual_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile
```

### Bước 3: Restart Server

```bash
# Trong thư mục backend
npm start
```

### Bước 4: Test Chatbot

Mở frontend và test các scenarios sau:

---

## 🧪 Test Cases

### ✅ Test 1: Câu trả lời bình thường

```
🤖: Giới tính của bạn?
👤: Nam
✅ Expected: "Đã ghi nhận, bạn là nam giới. Bạn bao nhiêu tuổi?"
```

### ✅ Test 2: Off-topic về giá

```
🤖: Giới tính của bạn?
👤: Khám ở đây có đắt không?
✅ Expected: 
"Tôi hiểu bạn quan tâm về chi phí. Giá khám thường dao động 
từ 150.000đ - 500.000đ tùy bác sĩ...

Mục đích cuộc trò chuyện này là giúp bạn:
✅ Tìm bác sĩ phù hợp với triệu chứng
✅ Gợi ý chuyên khoa cần khám

Để tiếp tục, bạn vui lòng cho tôi biết giới tính của bạn?"
```

### ✅ Test 3: Trả lời phức tạp

```
🤖: Bạn bao nhiêu tuổi?
👤: À tôi sinh năm 1998, năm nay 26 rồi
✅ Expected: LLM extract → age = "26"
```

### ✅ Test 4: Emergency Detection

```
🤖: Triệu chứng chính của bạn là gì?
👤: Con tôi 3 tuổi sốt 40 độ, co giật
✅ Expected:
"⚠️⚠️⚠️ TÌNH HUỐNG KHẨN CẤP ⚠️⚠️⚠️

Tôi nhận thấy: Trẻ 3 tuổi sốt cao 40°C kèm co giật

ĐÂY LÀ TÌNH HUỐNG KHẨN CẤP - HÃY LÀM NGAY:
1. 🚨 GỌI CẤP CỨU 115 NGAY LẬP TỨC
..."
```

### ✅ Test 5: Triệu chứng phức tạp

```
🤖: Triệu chứng chính của bạn là gì?
👤: Uh tôi cũng không rõ, mệt mỏi, không ăn được, 
    đôi khi đau đầu, chóng mặt, ngủ không ngon
✅ Expected: LLM extract → 
"Tôi hiểu bạn đang gặp nhiều vấn đề:
• Mệt mỏi
• Chán ăn  
• Đau đầu, chóng mặt
• Mất ngủ..."
```

---

## 🔍 Monitoring & Debugging

### Kiểm tra logs trong terminal:

```bash
# Khi chatbot hoạt động, bạn sẽ thấy:

💡 Intent detected: ANSWER_QUESTION (confidence: 0.95)
💡 Intent detected: ASK_PRICE (confidence: 0.98)
💡 Intent detected: EMERGENCY (confidence: 0.99)

⚠️ Intent analysis failed, using fallback: GROQ API error
```

### Nếu gặp lỗi:

#### ❌ Error: "GROQ_API_KEY not configured"

**Giải pháp:**
```bash
# Kiểm tra file .env
cat backend/.env | grep GROQ

# Nếu không có, thêm vào:
echo "GROQ_API_KEY=gsk_your_key_here" >> backend/.env
echo "GROQ_MODEL=llama-3.1-70b-versatile" >> backend/.env

# Restart server
```

#### ❌ Error: "GROQ API error: 401"

**Nguyên nhân:** API key không hợp lệ

**Giải pháp:**
- Kiểm tra lại API key tại https://console.groq.com
- Copy lại API key mới
- Update file `.env`

#### ❌ Chatbot không dùng LLM (dùng fallback)

**Nguyên nhân:** LLM không được config hoặc gặp lỗi

**Chatbot vẫn hoạt động BÌNH THƯỜNG** nhưng kém linh hoạt hơn

**Giải pháp:**
- Check logs để xem lỗi gì
- Verify GROQ API key
- Kiểm tra internet connection

---

## 📊 So sánh Before & After

### BEFORE (Rule-based):

| Scenario | Response |
|----------|----------|
| User: "Khám có đắt không?" | ❌ Lưu vào gender = "Khám có đắt không?" |
| User: "Tôi sinh 1998" | ❌ Lưu age = "Tôi sinh 1998" |
| User: "Sốt cao co giật" | ⚠️ Không phát hiện emergency |

### AFTER (LLM-powered):

| Scenario | Response |
|----------|----------|
| User: "Khám có đắt không?" | ✅ Trả lời về giá + redirect về câu hỏi |
| User: "Tôi sinh 1998" | ✅ Extract age = "26" |
| User: "Sốt cao co giật" | ✅ Cảnh báo KHẨN CẤP ngay lập tức |

---

## 💰 Chi phí

### GROQ API (hiện tại):

- **Free tier:** 14,400 requests/day
- **Paid:** $0.00006/1K tokens (rất rẻ!)

**Ước tính:**
- 1 conversation = ~5K tokens
- 1000 users/tháng = 5M tokens
- Chi phí: $0.30/tháng (**30 CENT!**)

### So sánh:

| Provider | Chi phí/1M tokens |
|----------|-------------------|
| GROQ (Llama 3.1) | $0.06 |
| ChatGPT (GPT-4o-mini) | $0.15 |
| ChatGPT (GPT-4) | $3.00 |
| Botpress | $50/tháng (flat) |

**→ GROQ rẻ nhất!**

---

## 🎯 Best Practices

### 1. Always check LLM availability

```javascript
if (conversationIntelligence.isConfigured()) {
  // Use LLM
} else {
  // Use fallback
}
```

### 2. Handle errors gracefully

```javascript
try {
  const intent = await analyzeIntent(...);
} catch (error) {
  // Fallback to rule-based
}
```

### 3. Monitor confidence scores

```javascript
if (intent.confidence < 0.7) {
  // Low confidence - use fallback
}
```

### 4. Log important events

```javascript
console.log(`💡 Intent: ${intent.intent}`);
console.log(`⚠️ Emergency detected!`);
```

---

## 🔧 Customization

### Thay đổi model:

```env
# Fast but less accurate
GROQ_MODEL=llama-3.1-8b-instant

# Balanced (recommended)
GROQ_MODEL=llama-3.1-70b-versatile

# Slow but very accurate
GROQ_MODEL=llama-3.1-405b-reasoning
```

### Thay đổi temperature:

```javascript
// services/conversationIntelligence.service.js

this.config = {
  temperature: 0.3, // Lower = more consistent
  maxTokens: 1000,
  topP: 0.9
};
```

---

## 📚 Tài liệu tham khảo

- GROQ API Docs: https://console.groq.com/docs
- Llama 3.1 Guide: https://ai.meta.com/llama/
- Code location:
  - `backend/services/conversationIntelligence.service.js` - LLM logic
  - `backend/services/aiDoctorConversation.service.js` - Main conversation flow

---

## 🐛 Troubleshooting

### Q: Chatbot trả lời chậm?

**A:** 
- GROQ thường rất nhanh (~0.3s)
- Nếu chậm, check network
- Có thể switch sang model nhỏ hơn: `llama-3.1-8b-instant`

### Q: Response không tự nhiên?

**A:**
- Tăng temperature: `0.3 → 0.5`
- Thử model khác: `llama-3.1-405b-reasoning`
- Check prompt engineering

### Q: Tôi muốn dùng ChatGPT thay vì GROQ?

**A:**
- Update `conversationIntelligence.service.js`
- Thay `groqApiUrl` → OpenAI endpoint
- Change API key format
- Tôi có thể giúp bạn code!

---

## ✅ Checklist

- [ ] Đã lấy GROQ API key
- [ ] Đã thêm vào file `.env`
- [ ] Đã restart server
- [ ] Test scenario: Off-topic question
- [ ] Test scenario: Emergency detection
- [ ] Test scenario: Complex answer extraction
- [ ] Monitor logs để xem intent detection
- [ ] Chatbot hoạt động linh hoạt hơn!

---

**Nếu gặp vấn đề, hãy kiểm tra logs và liên hệ để được hỗ trợ!**
