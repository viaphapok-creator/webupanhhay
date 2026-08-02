const FormData = require('form-data');

module.exports = async (req, res) => {
    const token = process.env.BOT_TOKEN;
    if (!token) return res.status(500).json({ error: "Thiếu BOT_TOKEN trong Environment Variables" });

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type, media, text, chat_id } = req.body;

        // --- GỬI TIN NHẮN CHỈ CÓ TEXT ---
        if (type === 'text') {
            const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id, text })
            });
            const data = await r.json();
            return res.status(200).json(data);
        }

        // --- GỬI ALBUM ẢNH (GROUP MEDIA) ---
        if (type === 'media' && Array.isArray(media)) {
            const formData = new FormData();
            formData.append('chat_id', chat_id);

            const telegramMedia = media.map((item, index) => {
                const fieldName = `file${index}`;
                
                // Chuyển Base64 thành Buffer
                const b64 = item.media.split(',')[1]; 
                const buf = Buffer.from(b64, 'base64');
                
                // Đính kèm Buffer vào FormData
                formData.append(fieldName, buf, {
                    filename: `image${index}.jpg`,
                    contentType: 'image/jpeg'
                });

                return {
                    type: 'photo',
                    media: `attach://${fieldName}`,
                    caption: item.caption || ''
                };
            });

            formData.append('media', JSON.stringify(telegramMedia));

            // Gửi sang Telegram API bằng form-data
            const r = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
                method: 'POST',
                body: formData.getBuffer(),
                headers: formData.getHeaders()
            });
            
            const data = await r.json();
            return res.status(200).json(data);
        }

        return res.status(400).json({ error: "Định dạng dữ liệu không hợp lệ" });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
