export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const token = process.env.GITHUB_TOKEN;
        const repo = 'QQzhusha123456/my-images';
        
        if (!token) {
            return res.status(500).json({ error: 'Server configuration error' });
        }
        
        // 获取上传的文件
        const formData = await req.formData();
        const file = formData.get('file');
        
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // 生成文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const filename = `image-${timestamp}-${randomStr}.jpg`;
        
        // 读取文件为buffer
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        // 上传到GitHub
        const response = await fetch(
            `https://api.github.com/repos/${repo}/contents/${filename}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Upload ${filename}`,
                    content: base64,
                    branch: 'main'
                })
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            return res.status(500).json({ error: error.message || 'Upload failed' });
        }
        
        // 返回CDN链接
        const cdnUrl = `https://cdn.jsdelivr.net/gh/${repo}/${filename}`;
        return res.status(200).json({ 
            success: true, 
            url: cdnUrl,
            markdown: `![image](${cdnUrl})`
        });
        
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
